(function attachEntities(global) {
  'use strict';

  var utils = global.ULEAP_UTILS;
  var DIRECTIONS = [
    { x: 1, y: 0, name: 'right' },
    { x: -1, y: 0, name: 'left' },
    { x: 0, y: 1, name: 'down' },
    { x: 0, y: -1, name: 'up' }
  ];

  function createPlayer(x, y, radius, speed, color) {
    return {
      x: x,
      y: y,
      radius: radius,
      speed: speed,
      color: color
    };
  }

  function createPursuer(spawnIndex, x, y, radius, universe) {
    return {
      x: x,
      y: y,
      spawnIndex: spawnIndex,
      radius: radius,
      speed: universe.speed,
      perception: universe.perception,
      color: universe.pursuer,
      shape: universe.pursuerShape,
      dirX: 0,
      dirY: 1,
      decisionTimer: 0,
      stuckTimer: 0,
      wanderTarget: null,
      lastX: x,
      lastY: y
    };
  }

  function createFragment(id, x, y, radius, color) {
    return {
      id: id,
      x: x,
      y: y,
      radius: radius,
      color: color,
      active: true,
      respawnAt: 0
    };
  }

  function isWall(map, col, row) {
    if (row < 0 || row >= map.rows || col < 0 || col >= map.cols) {
      return true;
    }
    return map.grid[row].charAt(col) === '1';
  }

  function resolveCircle(entity, radius, map) {
    var tileSize = map.tileSize;
    var minCol = Math.floor((entity.x - radius) / tileSize);
    var maxCol = Math.floor((entity.x + radius) / tileSize);
    var minRow = Math.floor((entity.y - radius) / tileSize);
    var maxRow = Math.floor((entity.y + radius) / tileSize);
    var row;
    var col;
    var nearestX;
    var nearestY;
    var dx;
    var dy;
    var distSq;
    var dist;
    var overlap;

    for (row = minRow; row <= maxRow; row += 1) {
      for (col = minCol; col <= maxCol; col += 1) {
        if (!isWall(map, col, row)) {
          continue;
        }
        nearestX = utils.clamp(entity.x, col * tileSize, (col + 1) * tileSize);
        nearestY = utils.clamp(entity.y, row * tileSize, (row + 1) * tileSize);
        dx = entity.x - nearestX;
        dy = entity.y - nearestY;
        distSq = dx * dx + dy * dy;

        if (distSq >= radius * radius) {
          continue;
        }

        if (distSq <= 0.0001) {
          var tileCenterX = col * tileSize + tileSize * 0.5;
          var tileCenterY = row * tileSize + tileSize * 0.5;
          dx = entity.x - tileCenterX;
          dy = entity.y - tileCenterY;
          if (Math.abs(dx) > Math.abs(dy)) {
            entity.x += dx >= 0 ? radius : -radius;
          } else {
            entity.y += dy >= 0 ? radius : -radius;
          }
          continue;
        }

        dist = Math.sqrt(distSq);
        overlap = radius - dist;
        entity.x += (dx / dist) * overlap;
        entity.y += (dy / dist) * overlap;
      }
    }
  }

  function moveCircle(entity, dx, dy, radius, map) {
    entity.x += dx;
    resolveCircle(entity, radius, map);
    entity.y += dy;
    resolveCircle(entity, radius, map);
  }

  function canMove(entity, dirX, dirY, distanceToTest, radius, map) {
    var sample = {
      x: entity.x + dirX * distanceToTest,
      y: entity.y + dirY * distanceToTest
    };
    resolveCircle(sample, radius, map);
    return utils.distance(sample.x, sample.y, entity.x + dirX * distanceToTest, entity.y + dirY * distanceToTest) < 2;
  }

  function getPriorityDirectionsToPlayer(pursuer, player) {
    var dx = player.x - pursuer.x;
    var dy = player.y - pursuer.y;
    var horizontalFirst = Math.abs(dx) >= Math.abs(dy);
    var preferred = [];

    if (horizontalFirst) {
      preferred.push(dx >= 0 ? DIRECTIONS[0] : DIRECTIONS[1]);
      preferred.push(dy >= 0 ? DIRECTIONS[2] : DIRECTIONS[3]);
      preferred.push(dy >= 0 ? DIRECTIONS[3] : DIRECTIONS[2]);
      preferred.push(dx >= 0 ? DIRECTIONS[1] : DIRECTIONS[0]);
    } else {
      preferred.push(dy >= 0 ? DIRECTIONS[2] : DIRECTIONS[3]);
      preferred.push(dx >= 0 ? DIRECTIONS[0] : DIRECTIONS[1]);
      preferred.push(dx >= 0 ? DIRECTIONS[1] : DIRECTIONS[0]);
      preferred.push(dy >= 0 ? DIRECTIONS[3] : DIRECTIONS[2]);
    }

    return preferred;
  }

  function getWanderDirection(pursuer, game) {
    var available;
    var currentCell;
    var targetCell;
    var options;
    var i;
    var dir;
    var dx;
    var dy;

    if (!pursuer.wanderTarget) {
      pursuer.wanderTarget = utils.pickRandom(game.map.walkableCells);
    }

    currentCell = utils.worldToCell(pursuer.x, pursuer.y, game.map.tileSize);
    targetCell = pursuer.wanderTarget;
    if (targetCell && currentCell.col === targetCell.col && currentCell.row === targetCell.row) {
      pursuer.wanderTarget = utils.pickRandom(game.map.walkableCells);
      targetCell = pursuer.wanderTarget;
    }

    if (targetCell) {
      dx = targetCell.col - currentCell.col;
      dy = targetCell.row - currentCell.row;
      if (Math.abs(dx) >= Math.abs(dy)) {
        options = [
          dx >= 0 ? DIRECTIONS[0] : DIRECTIONS[1],
          dy >= 0 ? DIRECTIONS[2] : DIRECTIONS[3],
          dy >= 0 ? DIRECTIONS[3] : DIRECTIONS[2],
          dx >= 0 ? DIRECTIONS[1] : DIRECTIONS[0]
        ];
      } else {
        options = [
          dy >= 0 ? DIRECTIONS[2] : DIRECTIONS[3],
          dx >= 0 ? DIRECTIONS[0] : DIRECTIONS[1],
          dx >= 0 ? DIRECTIONS[1] : DIRECTIONS[0],
          dy >= 0 ? DIRECTIONS[3] : DIRECTIONS[2]
        ];
      }
      for (i = 0; i < options.length; i += 1) {
        dir = options[i];
        if (canMove(pursuer, dir.x, dir.y, 28, pursuer.radius, game.map)) {
          return dir;
        }
      }
    }

    available = utils.shuffle(DIRECTIONS);
    for (i = 0; i < available.length; i += 1) {
      dir = available[i];
      if (canMove(pursuer, dir.x, dir.y, 28, pursuer.radius, game.map)) {
        return dir;
      }
    }
    return { x: 0, y: 0 };
  }

  function chooseDirection(pursuer, player, game) {
    var dist = utils.distance(pursuer.x, pursuer.y, player.x, player.y);
    var options;
    var i;
    var dir;

    if (dist <= pursuer.perception) {
      options = getPriorityDirectionsToPlayer(pursuer, player);
      for (i = 0; i < options.length; i += 1) {
        dir = options[i];
        if (canMove(pursuer, dir.x, dir.y, 32, pursuer.radius, game.map)) {
          return dir;
        }
      }
    }

    return getWanderDirection(pursuer, game);
  }

  function updatePursuer(pursuer, player, game, dt) {
    var decisionLimit = utils.distance(pursuer.x, pursuer.y, player.x, player.y) <= pursuer.perception
      ? game.config.chaseDecisionInterval
      : game.config.wanderDecisionInterval;
    var step;
    var moved;

    pursuer.decisionTimer += dt;
    pursuer.stuckTimer += dt;

    if (pursuer.decisionTimer >= decisionLimit) {
      pursuer.decisionTimer = 0;
      var dir = chooseDirection(pursuer, player, game);
      pursuer.dirX = dir.x;
      pursuer.dirY = dir.y;
    }

    step = pursuer.speed * dt;
    moved = { x: pursuer.x, y: pursuer.y };
    moveCircle(moved, pursuer.dirX * step, pursuer.dirY * step, pursuer.radius, game.map);

    if (utils.distance(moved.x, moved.y, pursuer.x, pursuer.y) < 1) {
      pursuer.decisionTimer = decisionLimit;
    } else {
      pursuer.x = moved.x;
      pursuer.y = moved.y;
    }

    if (pursuer.stuckTimer >= game.config.stuckCheckInterval) {
      pursuer.stuckTimer = 0;
      if (utils.distance(pursuer.x, pursuer.y, pursuer.lastX, pursuer.lastY) < 8) {
        pursuer.wanderTarget = null;
        pursuer.decisionTimer = decisionLimit;
      }
      pursuer.lastX = pursuer.x;
      pursuer.lastY = pursuer.y;
    }
  }

  function drawPursuer(ctx, pursuer) {
    ctx.save();
    ctx.translate(pursuer.x, pursuer.y);
    ctx.fillStyle = pursuer.color;

    if (pursuer.shape === 'washer') {
      ctx.beginPath();
      ctx.arc(0, 0, pursuer.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0d2238';
      ctx.beginPath();
      ctx.arc(0, 0, pursuer.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
    } else if (pursuer.shape === 'hotdog') {
      ctx.rotate(Math.atan2(pursuer.dirY || 1, pursuer.dirX || 0) + Math.PI * 0.5);
      roundRect(ctx, -pursuer.radius * 0.7, -pursuer.radius * 1.2, pursuer.radius * 1.4, pursuer.radius * 2.4, pursuer.radius * 0.5);
      ctx.fill();
      ctx.fillStyle = '#ffca73';
      roundRect(ctx, -pursuer.radius * 0.45, -pursuer.radius, pursuer.radius * 0.9, pursuer.radius * 2, pursuer.radius * 0.4);
      ctx.fill();
    } else if (pursuer.shape === 'diamond') {
      ctx.rotate(Math.PI * 0.25);
      ctx.fillRect(-pursuer.radius * 0.72, -pursuer.radius * 0.72, pursuer.radius * 1.44, pursuer.radius * 1.44);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, pursuer.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.arc(-pursuer.radius * 0.25, -pursuer.radius * 0.25, pursuer.radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawFragment(ctx, fragment, time) {
    var pulse = 1 + Math.sin(time * 5 + fragment.id) * 0.12;
    var radius = fragment.radius * pulse;
    ctx.save();
    ctx.translate(fragment.x, fragment.y);
    ctx.rotate(time * 1.4);
    ctx.fillStyle = fragment.color;
    ctx.beginPath();
    ctx.moveTo(0, -radius);
    ctx.lineTo(radius * 0.6, 0);
    ctx.lineTo(0, radius);
    ctx.lineTo(-radius * 0.6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  global.ULEAP_ENTITIES = {
    createPlayer: createPlayer,
    createPursuer: createPursuer,
    createFragment: createFragment,
    isWall: isWall,
    moveCircle: moveCircle,
    updatePursuer: updatePursuer,
    drawPursuer: drawPursuer,
    drawFragment: drawFragment,
    DIRECTIONS: DIRECTIONS,
    findPathDirection: function findPathDirectionPlaceholder() {
      return null;
    }
  };
})(window);
