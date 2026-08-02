(function attachGame(global) {
  'use strict';

  var configBundle = global.ULEAP_CONFIG;
  var maps = global.ULEAP_MAPS;
  var utils = global.ULEAP_UTILS;
  var entities = global.ULEAP_ENTITIES;
  var InputController = global.ULEAP_InputController;

  function UniverseLeapGame(canvas, errorElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.errorElement = errorElement;
    this.config = configBundle.GAME_CONFIG;
    this.universes = configBundle.UNIVERSES;
    this.universePool = configBundle.UNIVERSE_POOL.slice();
    this.map = this.buildMap(maps.mainMaze);
    this.input = new InputController(canvas, this.config);
    this.now = 0;
    this.lastFrameTime = 0;
    this.running = false;
    this.toast = null;
    this.overlayButton = null;
    this.overlayHomeButton = null;
    this.overlayAction = null;
    this._bindOverlayInput();
    this.reset();
  }

  UniverseLeapGame.prototype._bindOverlayInput = function bindOverlayInput() {
    var self = this;
    this.canvas.addEventListener('pointerup', function onPointerUp(event) {
      try {
        var pos;
        pos = self.getCanvasPoint(event);
        if (!pos) {
          return;
        }
        if (
          self.overlayHomeButton &&
          pos.x >= self.overlayHomeButton.x &&
          pos.x <= self.overlayHomeButton.x + self.overlayHomeButton.w &&
          pos.y >= self.overlayHomeButton.y &&
          pos.y <= self.overlayHomeButton.y + self.overlayHomeButton.h
        ) {
          global.location.reload();
          return;
        }
        if (!self.overlayButton) {
          return;
        }
        if (
          pos.x >= self.overlayButton.x &&
          pos.x <= self.overlayButton.x + self.overlayButton.w &&
          pos.y >= self.overlayButton.y &&
          pos.y <= self.overlayButton.y + self.overlayButton.h
        ) {
          if (self.overlayAction === 'enterLevel2' && typeof self.startLevel2 === 'function') {
            self.overlayAction = null;
            self.overlayButton = null;
            self.startLevel2();
            return;
          }
          if (self.pendingFormalEntry) {
            self.startFormalStage();
          }
        }
      } catch (error) {
        self.handleFatalError(error);
      }
    });
  };

  UniverseLeapGame.prototype.getCanvasPoint = function getCanvasPoint(event) {
    var rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return null;
    }
    return {
      x: (event.clientX - rect.left) * (this.config.logicWidth / rect.width),
      y: (event.clientY - rect.top) * (this.config.logicHeight / rect.height)
    };
  };

  UniverseLeapGame.prototype.buildMap = function buildMap(template) {
    var walkableCells = [];
    var row;
    var col;
    for (row = 0; row < template.grid.length; row += 1) {
      for (col = 0; col < template.grid[row].length; col += 1) {
        if (template.grid[row].charAt(col) === '0') {
          walkableCells.push({ col: col, row: row });
        }
      }
    }

    return {
      key: template.key,
      name: template.name,
      grid: template.grid,
      cols: template.grid[0].length,
      rows: template.grid.length,
      tileSize: this.config.tileSize,
      playerSpawn: template.playerSpawn,
      pursuerSpawns: template.pursuerSpawns,
      fragmentSpawns: template.fragmentSpawns,
      walkableCells: walkableCells
    };
  };

  UniverseLeapGame.prototype.reset = function reset() {
    var spawn = utils.cellToWorldCenter(this.map.playerSpawn.col, this.map.playerSpawn.row, this.map.tileSize);
    this.stage = 'tutorial';
    this.pendingFormalEntry = false;
    this.status = 'playing';
    this.elapsed = 0;
    this.collapse = this.config.initialCollapse;
    this.collectedTotal = 0;
    this.collectedTutorial = 0;
    this.skillCooldownLeft = 0;
    this.overlayButton = null;
    this.overlayHomeButton = null;
    this.overlayAction = null;
    this.player = entities.createPlayer(
      spawn.x,
      spawn.y,
      this.config.playerRadius,
      this.config.playerSpeed,
      this.universes[this.config.tutorialUniverse].player
    );
    this.fragments = [];
    this.nextFragmentId = 1;
    this.applyUniverse(this.config.tutorialUniverse, true);
    this.initializeFragments();
    this.addToast('教程关：先收集 ' + this.config.tutorialFragmentGoal + ' 个碎片，熟悉操作。');
  };

  UniverseLeapGame.prototype.initializeFragments = function initializeFragments() {
    var i;
    for (i = 0; i < this.config.fragmentConcurrent; i += 1) {
      this.spawnNewFragment(true);
    }
  };

  UniverseLeapGame.prototype.getCollapseRate = function getCollapseRate() {
    var rates = this.config.collapseRates;
    var i;
    for (i = 0; i < rates.length; i += 1) {
      if (this.elapsed < rates[i].until) {
        return rates[i].rate;
      }
    }
    return rates[rates.length - 1].rate;
  };

  UniverseLeapGame.prototype.getUniverse = function getUniverse(key) {
    return this.universes[key] || this.universes.stone;
  };

  UniverseLeapGame.prototype.getRandomUniverseKey = function getRandomUniverseKey(excludeKey) {
    var pool = [];
    var i;
    for (i = 0; i < this.universePool.length; i += 1) {
      if (this.universePool[i] !== excludeKey) {
        pool.push(this.universePool[i]);
      }
    }
    return utils.pickRandom(pool.length ? pool : this.universePool);
  };

  UniverseLeapGame.prototype.applyUniverse = function applyUniverse(key, silent) {
    var universe = this.getUniverse(key);
    var i;
    this.currentUniverseKey = universe.key;
    this.currentUniverse = universe;
    this.player.color = universe.player;
    this.pursuers = [];

    for (i = 0; i < universe.pursuerCount; i += 1) {
      this.pursuers.push(this.createPursuerAtSpawn(i));
    }

    for (i = 0; i < this.fragments.length; i += 1) {
      this.fragments[i].color = universe.fragment;
    }

    if (!silent) {
      this.addToast('跃迁至 ' + universe.label + '。');
    }
  };

  UniverseLeapGame.prototype.createPursuerAtSpawn = function createPursuerAtSpawn(index) {
    var spawnCell = this.map.pursuerSpawns[index % this.map.pursuerSpawns.length];
    var spawn = utils.cellToWorldCenter(spawnCell.col, spawnCell.row, this.map.tileSize);
    return entities.createPursuer(index, spawn.x, spawn.y, this.config.bagelRadius, this.currentUniverse);
  };

  UniverseLeapGame.prototype.resetPursuerPosition = function resetPursuerPosition(pursuer) {
    var i;
    var candidateCell;
    var candidate;
    var best = null;
    var bestDistance = -1;

    for (i = 0; i < this.map.pursuerSpawns.length; i += 1) {
      candidateCell = this.map.pursuerSpawns[i];
      candidate = utils.cellToWorldCenter(candidateCell.col, candidateCell.row, this.map.tileSize);
      var dist = utils.distance(candidate.x, candidate.y, this.player.x, this.player.y);
      if (dist > bestDistance) {
        bestDistance = dist;
        best = { x: candidate.x, y: candidate.y, spawnIndex: i };
      }
    }

    if (best) {
      pursuer.x = best.x;
      pursuer.y = best.y;
      pursuer.spawnIndex = best.spawnIndex;
      pursuer.dirX = 0;
      pursuer.dirY = 1;
      pursuer.decisionTimer = 0;
      pursuer.wanderTarget = null;
    }
  };

  UniverseLeapGame.prototype.resetAllPursuers = function resetAllPursuers() {
    var i;
    for (i = 0; i < this.pursuers.length; i += 1) {
      this.resetPursuerPosition(this.pursuers[i]);
    }
  };

  UniverseLeapGame.prototype.pickFragmentSpawn = function pickFragmentSpawn() {
    var shuffled = utils.shuffle(this.map.fragmentSpawns);
    var i;
    var center;
    var j;
    var valid;
    var fragment;

    for (i = 0; i < shuffled.length; i += 1) {
      center = utils.cellToWorldCenter(shuffled[i].col, shuffled[i].row, this.map.tileSize);
      valid = utils.distance(center.x, center.y, this.player.x, this.player.y) >= this.config.safeSpawnDistanceFromPlayer;

      for (j = 0; valid && j < this.pursuers.length; j += 1) {
        valid = utils.distance(center.x, center.y, this.pursuers[j].x, this.pursuers[j].y) >= this.config.safeSpawnDistanceFromPlayer * 0.7;
      }

      for (j = 0; valid && j < this.fragments.length; j += 1) {
        fragment = this.fragments[j];
        if (fragment.active) {
          valid = utils.distance(center.x, center.y, fragment.x, fragment.y) >= this.map.tileSize * 0.8;
        }
      }

      if (valid) {
        return center;
      }
    }

    return utils.cellToWorldCenter(this.map.fragmentSpawns[0].col, this.map.fragmentSpawns[0].row, this.map.tileSize);
  };

  UniverseLeapGame.prototype.spawnNewFragment = function spawnNewFragment(activeImmediately) {
    var center = this.pickFragmentSpawn();
    var fragment = entities.createFragment(
      this.nextFragmentId,
      center.x,
      center.y,
      this.config.fragmentRadius,
      this.currentUniverse.fragment
    );
    this.nextFragmentId += 1;
    fragment.active = !!activeImmediately;
    this.fragments.push(fragment);
  };

  UniverseLeapGame.prototype.collectFragment = function collectFragment(fragment) {
    fragment.active = false;
    fragment.respawnAt = this.elapsed + this.config.fragmentRespawnDelay;
    this.collectedTotal += 1;
    if (this.stage === 'tutorial') {
      this.collectedTutorial += 1;
    }
    this.collapse = utils.clamp(this.collapse - this.config.fragmentRelief, 0, 100);
  };

  UniverseLeapGame.prototype.respawnDueFragments = function respawnDueFragments() {
    var i;
    var center;
    for (i = 0; i < this.fragments.length; i += 1) {
      if (!this.fragments[i].active && this.elapsed >= this.fragments[i].respawnAt) {
        center = this.pickFragmentSpawn();
        this.fragments[i].x = center.x;
        this.fragments[i].y = center.y;
        this.fragments[i].color = this.currentUniverse.fragment;
        this.fragments[i].active = true;
      }
    }
  };

  UniverseLeapGame.prototype.tryUseSkill = function tryUseSkill() {
    if (this.skillCooldownLeft > 0 || this.status !== 'playing') {
      return;
    }

    this.skillCooldownLeft = this.config.skillCooldown;
    this.collapse = utils.clamp(this.collapse - this.config.skillRelief, 0, 100);

    if (this.stage === 'tutorial') {
      this.applyUniverse(this.config.tutorialUniverse, true);
      this.resetAllPursuers();
      this.addToast('教程关已稳定在石头宇宙，追逐者被重置。');
      return;
    }

    this.applyUniverse(this.getRandomUniverseKey(this.currentUniverseKey), false);
    this.resetAllPursuers();
  };

  UniverseLeapGame.prototype.finish = function finish(status) {
    this.status = status;
    if (status === 'win') {
      this.addToast('坍塌归零，你逃离了贝果。点击技能键可重开。');
    } else {
      this.addToast('宇宙彻底坍塌。点击技能键可重开。');
    }
  };

  UniverseLeapGame.prototype.startFormalStage = function startFormalStage() {
    this.stage = 'formal';
    this.pendingFormalEntry = false;
    this.applyUniverse(this.getRandomUniverseKey(null), true);
    this.resetAllPursuers();
    this.addToast('正式关开始：四宇宙将随技能随机跃迁。');
  };

  UniverseLeapGame.prototype.startLevel2 = function startLevel2() {
    var spawn = utils.cellToWorldCenter(this.map.playerSpawn.col, this.map.playerSpawn.row, this.map.tileSize);
    this.stage = 'formal';
    this.pendingFormalEntry = false;
    this.status = 'playing';
    this.elapsed = 0;
    this.collapse = this.config.initialCollapse;
    this.collectedTotal = 0;
    this.collectedTutorial = 0;
    this.skillCooldownLeft = 0;
    this.overlayButton = null;
    this.overlayHomeButton = null;
    this.player = entities.createPlayer(
      spawn.x,
      spawn.y,
      this.config.playerRadius,
      this.config.playerSpeed,
      this.getUniverse(this.config.tutorialUniverse).player
    );
    this.fragments = [];
    this.nextFragmentId = 1;
    this.applyUniverse(this.getRandomUniverseKey(null), true);
    this.initializeFragments();
    this.resetAllPursuers();
    this.addToast('第2关开始：四宇宙将随技能随机跃迁。');
  };

  UniverseLeapGame.prototype.addToast = function addToast(text) {
    this.toast = {
      text: text,
      ttl: this.config.toastDuration
    };
  };

  UniverseLeapGame.prototype.isNearBagel = function isNearBagel() {
    var i;
    for (i = 0; i < this.pursuers.length; i += 1) {
      if (utils.distance(this.player.x, this.player.y, this.pursuers[i].x, this.pursuers[i].y) <= this.config.nearBagelDistance) {
        return true;
      }
    }
    return false;
  };

  UniverseLeapGame.prototype.updatePlayer = function updatePlayer(dt) {
    var move = this.input.getMoveVector();
    entities.moveCircle(
      this.player,
      move.x * this.player.speed * dt,
      move.y * this.player.speed * dt,
      this.player.radius,
      this.map
    );
  };

  UniverseLeapGame.prototype.updatePursuers = function updatePursuers(dt) {
    var i;
    for (i = 0; i < this.pursuers.length; i += 1) {
      entities.updatePursuer(this.pursuers[i], this.player, this, dt);
    }
  };

  UniverseLeapGame.prototype.checkFragmentCollection = function checkFragmentCollection() {
    var i;
    var fragment;
    for (i = 0; i < this.fragments.length; i += 1) {
      fragment = this.fragments[i];
      if (fragment.active && utils.distance(this.player.x, this.player.y, fragment.x, fragment.y) <= this.player.radius + fragment.radius) {
        this.collectFragment(fragment);
      }
    }
  };

  UniverseLeapGame.prototype.checkPursuerCollisions = function checkPursuerCollisions() {
    var i;
    var pursuer;
    for (i = 0; i < this.pursuers.length; i += 1) {
      pursuer = this.pursuers[i];
      if (utils.distance(this.player.x, this.player.y, pursuer.x, pursuer.y) <= this.player.radius + pursuer.radius) {
        this.collapse = utils.clamp(this.collapse + this.config.hitPenalty, 0, 100);
        this.resetPursuerPosition(pursuer);
        this.addToast('被贝果碰到了，坍塌值上升。');
      }
    }
  };

  UniverseLeapGame.prototype.updateGameplay = function updateGameplay(dt) {
    var collapseRate = this.getCollapseRate();
    var multiplier = this.isNearBagel() ? this.config.nearBagelMultiplier : 1;

    this.elapsed += dt;
    this.skillCooldownLeft = Math.max(0, this.skillCooldownLeft - dt);
    if (this.toast) {
      this.toast.ttl -= dt;
      if (this.toast.ttl <= 0) {
        this.toast = null;
      }
    }

    this.collapse = utils.clamp(this.collapse + collapseRate * multiplier * dt, 0, 100);
    this.updatePlayer(dt);
    this.updatePursuers(dt);
    this.checkFragmentCollection();
    this.respawnDueFragments();
    this.checkPursuerCollisions();

    if (this.collapse <= 0) {
      this.finish('win');
    } else if (this.collapse >= 100) {
      this.finish('lose');
    }
  };

  UniverseLeapGame.prototype.restartIfNeeded = function restartIfNeeded() {
    if (this.status !== 'playing' && this.input.consumeSkill()) {
      this.reset();
      return true;
    }
    return false;
  };

  UniverseLeapGame.prototype.step = function step(timestamp) {
    try {
      if (!this.running) {
        this.running = true;
        this.lastFrameTime = timestamp;
      }

      this.now = timestamp * 0.001;
      var rawDt = (timestamp - this.lastFrameTime) * 0.001;
      this.lastFrameTime = timestamp;
      var dt = Math.min(this.config.maxDt, Math.max(0, rawDt || 0));

      if (this.restartIfNeeded()) {
        return;
      }

      if (this.status === 'playing') {
        if (!this.pendingFormalEntry && this.input.consumeSkill()) {
          this.tryUseSkill();
        }
        if (!this.pendingFormalEntry) {
          this.updateGameplay(dt);
        } else if (this.toast) {
          this.toast.ttl -= dt;
          if (this.toast.ttl <= 0) {
            this.toast = null;
          }
        }
      } else if (this.toast) {
        this.toast.ttl -= dt;
        if (this.toast.ttl <= 0) {
          this.toast = null;
        }
      }

      this.render();
    } catch (error) {
      this.handleFatalError(error);
    }
  };

  UniverseLeapGame.prototype.handleFatalError = function handleFatalError(error) {
    console.error(error);
    this.running = false;
    if (this.errorElement) {
      this.errorElement.style.display = 'flex';
      this.errorElement.textContent = '哎呀，出错了，请重启试试吧~';
    }
  };

  UniverseLeapGame.prototype.render = function render() {
    try {
      var ctx = this.ctx;
      ctx.clearRect(0, 0, this.config.logicWidth, this.config.logicHeight);
      this.drawBackground(ctx);
      this.drawMap(ctx);
      this.drawFragments(ctx);
      this.drawPlayer(ctx);
      this.drawPursuers(ctx);
      this.drawHUD(ctx);
      this.drawSkillButton(ctx);
      this.drawToast(ctx);
      this.drawEndState(ctx);
    } catch (error) {
      this.handleFatalError(error);
    }
  };

  UniverseLeapGame.prototype.drawBackground = function drawBackground(ctx) {
    ctx.fillStyle = this.currentUniverse.background;
    ctx.fillRect(0, 0, this.config.logicWidth, this.config.logicHeight);

    var gradient = ctx.createLinearGradient(0, 0, 0, this.config.logicHeight);
    gradient.addColorStop(0, 'rgba(255,255,255,0.08)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.config.logicWidth, this.config.logicHeight);
  };

  UniverseLeapGame.prototype.drawMap = function drawMap(ctx) {
    var row;
    var col;
    var x;
    var y;
    var tile = this.map.tileSize;

    ctx.fillStyle = this.currentUniverse.floor;
    for (row = 0; row < this.map.rows; row += 1) {
      for (col = 0; col < this.map.cols; col += 1) {
        x = col * tile;
        y = row * tile;
        if (entities.isWall(this.map, col, row)) {
          ctx.fillStyle = this.currentUniverse.wall;
          ctx.fillRect(x + 5, y + 5, tile - 10, tile - 10);
        } else {
          ctx.fillStyle = this.currentUniverse.floor;
          ctx.fillRect(x, y, tile, tile);
          ctx.fillStyle = 'rgba(255,255,255,0.04)';
          ctx.fillRect(x + 10, y + 10, tile - 20, tile - 20);
        }
      }
    }
  };

  UniverseLeapGame.prototype.drawPlayer = function drawPlayer(ctx) {
    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    ctx.fillStyle = this.player.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.arc(0, -4, this.player.radius * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  UniverseLeapGame.prototype.drawPursuers = function drawPursuers(ctx) {
    var i;
    for (i = 0; i < this.pursuers.length; i += 1) {
      entities.drawPursuer(ctx, this.pursuers[i]);
    }
  };

  UniverseLeapGame.prototype.drawFragments = function drawFragments(ctx) {
    var i;
    for (i = 0; i < this.fragments.length; i += 1) {
      if (this.fragments[i].active) {
        entities.drawFragment(ctx, this.fragments[i], this.now);
      }
    }
  };

  UniverseLeapGame.prototype.drawHUD = function drawHUD(ctx) {
    var barX = 36;
    var barY = this.config.hudTopPadding;
    var barW = this.config.logicWidth - 72;
    var barH = 26;
    var fillW = barW * (this.collapse / 100);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.fillRect(24, 18, this.config.logicWidth - 48, 144);

    ctx.fillStyle = '#fff7df';
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.fillText(this.config.title, 36, 54);

    ctx.font = '22px "Courier New", monospace';
    ctx.fillText('宇宙：' + this.currentUniverse.label, 36, 92);
    ctx.fillText(this.stage === 'tutorial' ? '关卡：第1关' : '关卡：第2关', 36, 122);
    ctx.fillText('时间：' + utils.formatSeconds(this.elapsed), 470, 92);
    ctx.fillText('碎片：' + this.collectedTotal, 470, 122);

    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(barX, barY + 82, barW, barH);
    ctx.fillStyle = this.collapse < 35 ? '#5fe08b' : (this.collapse < 70 ? '#f7c44a' : '#ff6b5e');
    ctx.fillRect(barX, barY + 82, fillW, barH);

    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.fillStyle = '#fff7df';
    ctx.fillText('坍塌值 ' + this.collapse.toFixed(1) + '%', 36, barY + 104);

    if (this.stage === 'tutorial') {
      ctx.font = '20px "Courier New", monospace';
      ctx.fillStyle = '#fff7df';
      ctx.fillText('第1关目标：将坍塌值降至 0%', 36, 170);
    }
  };

  UniverseLeapGame.prototype.drawSkillButton = function drawSkillButton(ctx) {
    var skill = this.input.skillButton;
    var ratio = this.skillCooldownLeft > 0 ? this.skillCooldownLeft / this.config.skillCooldown : 0;

    ctx.save();
    ctx.globalAlpha = 0.82;

    ctx.fillStyle = this.skillCooldownLeft > 0 ? 'rgba(130,130,130,0.65)' : this.currentUniverse.accent;
    ctx.beginPath();
    ctx.arc(skill.x, skill.y, skill.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(skill.x, skill.y, skill.radius - 12, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * (1 - ratio));
    ctx.stroke();

    ctx.fillStyle = '#111';
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('跃迁', skill.x, skill.y - 4);
    ctx.font = '18px "Courier New", monospace';
    ctx.fillText(this.skillCooldownLeft > 0 ? this.skillCooldownLeft.toFixed(1) + 's' : '就绪', skill.x, skill.y + 28);
    ctx.textAlign = 'left';
    ctx.restore();
  };

  UniverseLeapGame.prototype.drawToast = function drawToast(ctx) {
    if (!this.toast || this.status !== 'playing') {
      return;
    }
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(76, this.config.logicHeight - 270, this.config.logicWidth - 152, 74);
    ctx.fillStyle = '#fff7df';
    ctx.font = '22px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.toast.text, this.config.logicWidth * 0.5, this.config.logicHeight - 225);
    ctx.textAlign = 'left';
    ctx.restore();
  };

  UniverseLeapGame.prototype.drawEndState = function drawEndState(ctx) {
    function roundedRectPath(context, button, radius) {
      var x = button.x;
      var y = button.y;
      var w = button.w;
      var h = button.h;
      var r = Math.min(radius, w * 0.5, h * 0.5);
      context.beginPath();
      context.moveTo(x + r, y);
      context.lineTo(x + w - r, y);
      context.quadraticCurveTo(x + w, y, x + w, y + r);
      context.lineTo(x + w, y + h - r);
      context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      context.lineTo(x + r, y + h);
      context.quadraticCurveTo(x, y + h, x, y + h - r);
      context.lineTo(x, y + r);
      context.quadraticCurveTo(x, y, x + r, y);
      context.closePath();
    }

    function drawTranslucentButton(context, button, label) {
      var shadowButton = {
        x: button.x + 3,
        y: button.y + 3,
        w: button.w,
        h: button.h
      };
      context.save();
      context.fillStyle = 'rgba(5,5,16,0.58)';
      roundedRectPath(context, shadowButton, shadowButton.h * 0.5);
      context.fill();
      context.restore();

      context.fillStyle = 'rgba(255,255,255,0.13)';
      roundedRectPath(context, button, button.h * 0.5);
      context.fill();
      context.strokeStyle = 'rgba(255,255,255,0.78)';
      context.lineWidth = 2;
      context.stroke();

      context.fillStyle = '#fff7df';
      context.font = 'bold 16px "Courier New", monospace';
      context.textAlign = 'center';
      context.fillText(label, button.x + button.w * 0.5, button.y + button.h * 0.5 + 6);
    }

    if (this.status === 'playing') {
      this.overlayButton = null;
      this.overlayHomeButton = null;
      this.overlayAction = null;
      return;
    }

    if (this.stage === 'tutorial' && this.status === 'win') {
      this.overlayButton = {
        x: 230,
        y: 598,
        w: 260,
        h: 56
      };
      this.overlayHomeButton = {
        x: 24,
        y: this.config.logicHeight - 78,
        w: 150,
        h: 54
      };
      this.overlayAction = 'enterLevel2';

      ctx.save();
      ctx.fillStyle = 'rgba(3,4,10,0.86)';
      ctx.fillRect(0, 0, this.config.logicWidth, this.config.logicHeight);

      ctx.fillStyle = '#fff7df';
      ctx.textAlign = 'center';
      ctx.font = 'bold 34px "Courier New", monospace';
      ctx.fillText('教学关通关', this.config.logicWidth * 0.5, 560);

      drawTranslucentButton(ctx, this.overlayButton, '进入正式关');

      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,247,223,0.92)';
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillText('返回首页', this.overlayHomeButton.x + 12, this.overlayHomeButton.y + 36);
      ctx.fillStyle = 'rgba(255,247,223,0.54)';
      ctx.fillRect(this.overlayHomeButton.x, this.overlayHomeButton.y + 48, 112, 2);
      ctx.textAlign = 'left';
      ctx.restore();
      return;
    }

    if (this.status === 'lose') {
      this.overlayButton = null;
      this.overlayHomeButton = {
        x: 230,
        y: 598,
        w: 260,
        h: 56
      };
      this.overlayAction = null;

      ctx.save();
      ctx.fillStyle = 'rgba(3,4,10,0.88)';
      ctx.fillRect(0, 0, this.config.logicWidth, this.config.logicHeight);
      ctx.fillStyle = '#fff7df';
      ctx.textAlign = 'center';
      ctx.font = 'bold 34px "Courier New", monospace';
      ctx.fillText('坍塌失控！！！', this.config.logicWidth * 0.5, 520);
      ctx.font = '16px "Courier New", monospace';
      ctx.fillText('坍塌值达到100%', this.config.logicWidth * 0.5, 560);
      drawTranslucentButton(ctx, this.overlayHomeButton, '返回首页');
      ctx.textAlign = 'left';
      ctx.restore();
      return;
    }

    this.overlayButton = null;
    this.overlayHomeButton = null;
    this.overlayAction = null;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.64)';
    ctx.fillRect(0, 0, this.config.logicWidth, this.config.logicHeight);
    ctx.fillStyle = '#fff7df';
    ctx.textAlign = 'center';
    ctx.font = 'bold 34px "Courier New", monospace';
    ctx.fillText(this.status === 'win' ? '逃离成功' : '坍塌失控', this.config.logicWidth * 0.5, 540);
    ctx.font = '16px "Courier New", monospace';
    ctx.fillText(this.status === 'win' ? '坍塌值降至 0%' : '坍塌值已达到 100%', this.config.logicWidth * 0.5, 580);
    ctx.fillText('点击右下角技能键重新开始', this.config.logicWidth * 0.5, 620);
    ctx.textAlign = 'left';
    ctx.restore();
  };

  global.ULEAP_Game = UniverseLeapGame;
})(window);
