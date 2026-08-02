(function boot(global) {
  'use strict';

  var game = null;
  var prefersReducedMotion = false;
  var engineConfig = null;
  var victoryScreen = null;
  var victoryButton = null;
  var victoryShown = false;

  function getEngineConfig() {
    if (engineConfig) {
      return engineConfig;
    }
    var cfg = global.ULEAP_ENGINE || {};
    engineConfig = {
      storyDurationMs: typeof cfg.storyDurationMs === 'number' ? cfg.storyDurationMs : 2000,
      storySlides: Array.isArray(cfg.storySlides) ? cfg.storySlides.slice(0, 2) : [],
      opening: cfg.opening || null
    };
    return engineConfig;
  }

  function preloadImages(urls) {
    if (!urls || !urls.length) {
      return;
    }
    for (var i = 0; i < urls.length; i += 1) {
      if (!urls[i]) {
        continue;
      }
      var img = new Image();
      img.src = urls[i];
    }
  }

  function showFatalError() {
    var errorElement = document.getElementById('fatal-error');
    if (errorElement) {
      errorElement.style.display = 'flex';
      errorElement.textContent = '哎呀，出错了，请重启试试吧~';
    }
  }

  function showOverlay(el) {
    if (!el) {
      return;
    }
    if (el.style.display === 'none') {
      el.style.display = 'flex';
    }
    if (!prefersReducedMotion) {
      global.requestAnimationFrame(function () {
        el.classList.add('overlay--show');
        el.classList.remove('overlay--hide');
      });
    } else {
      el.classList.add('overlay--show');
      el.classList.remove('overlay--hide');
    }
  }

  function hideOverlay(el, onDone) {
    if (!el) {
      if (onDone) {
        onDone();
      }
      return;
    }
    if (prefersReducedMotion) {
      el.classList.remove('overlay--show');
      el.classList.add('overlay--hide');
      el.style.display = 'none';
      if (onDone) {
        onDone();
      }
      return;
    }
    el.classList.remove('overlay--show');
    el.classList.add('overlay--hide');
    var done = false;
    function finish() {
      if (done) {
        return;
      }
      done = true;
      el.style.display = 'none';
      if (onDone) {
        onDone();
      }
    }
    el.addEventListener('transitionend', finish, { once: true });
    global.setTimeout(finish, 520);
  }

  function tick(timestamp) {
    if (!game || !game.running) {
      return;
    }
    try {
      game.step(timestamp);
      if (!game.running) {
        return;
      }
      if (!victoryShown && victoryScreen && game.stage === 'formal' && game.status === 'win') {
        victoryShown = true;
        game.running = false;
        showOverlay(victoryScreen);
        return;
      }
      global.requestAnimationFrame(tick);
    } catch (error) {
      console.error(error);
      showFatalError();
    }
  }

  global.addEventListener('error', function onError() {
    showFatalError();
  });

  global.addEventListener('DOMContentLoaded', function onReady() {
    try {
      var canvas = document.getElementById('game-canvas');
      var engineArtLayer = document.getElementById('engine-art-layer');
      var errorElement = document.getElementById('fatal-error');
      var startScreen = document.getElementById('start-screen');
      var storyScreen = document.getElementById('story-screen');
      var storySlide = document.getElementById('story-slide');
      var storyTitle = document.getElementById('story-title');
      var storyCaption = document.getElementById('story-caption');
      var gateScreen = document.getElementById('gate-screen');
      var gateButton = document.getElementById('gate-button');
      var musicToggle = document.getElementById('music-toggle');
      var musicPlayer = global.ULEAP_Audio && global.ULEAP_Audio.createEscapeBagelThemePlayer
        ? global.ULEAP_Audio.createEscapeBagelThemePlayer()
        : null;
      var musicStarted = false;
      var musicEnabled = false;
      var musicUnavailable = !musicPlayer;
      if (global.matchMedia) {
        prefersReducedMotion = global.matchMedia('(prefers-reduced-motion: reduce)').matches;
      }
      victoryScreen = document.getElementById('victory-screen');
      victoryButton = document.getElementById('victory-button');
      game = new global.ULEAP_Game(canvas, errorElement);

      var originalReset = game.reset.bind(game);
      game.reset = function patchedReset() {
        victoryShown = false;
        return originalReset();
      };

      function updateMusicToggle() {
        if (!musicToggle) {
          return;
        }
        if (musicUnavailable) {
          musicToggle.dataset.state = 'unavailable';
          musicToggle.setAttribute('aria-pressed', 'false');
          musicToggle.setAttribute('aria-label', '音乐不可用');
          musicToggle.setAttribute('title', '音乐不可用');
          return;
        }
        if (!musicStarted) {
          musicToggle.dataset.state = 'idle';
          musicToggle.setAttribute('aria-pressed', 'false');
          musicToggle.setAttribute('aria-label', '开启音乐');
          musicToggle.setAttribute('title', '开启音乐');
          return;
        }
        musicToggle.dataset.state = musicEnabled ? 'playing' : 'muted';
        musicToggle.setAttribute('aria-pressed', musicEnabled ? 'true' : 'false');
        musicToggle.setAttribute('aria-label', musicEnabled ? '关闭音乐' : '开启音乐');
        musicToggle.setAttribute('title', musicEnabled ? '关闭音乐' : '开启音乐');
      }

      function startMusic() {
        if (!musicPlayer || musicUnavailable || musicEnabled) {
          updateMusicToggle();
          return;
        }
        musicStarted = true;
        try {
          Promise.resolve(musicPlayer.start()).then(function () {
            musicEnabled = true;
            updateMusicToggle();
          }).catch(function (error) {
            console.error(error);
            musicStarted = false;
            musicEnabled = false;
            musicUnavailable = true;
            updateMusicToggle();
          });
        } catch (error) {
          console.error(error);
          musicStarted = false;
          musicEnabled = false;
          musicUnavailable = true;
          updateMusicToggle();
        }
      }

      if (musicToggle) {
        musicToggle.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();
          if (!musicPlayer || musicUnavailable) {
            updateMusicToggle();
            return;
          }
          if (!musicStarted || !musicEnabled) {
            startMusic();
            return;
          }
          musicPlayer.stop();
          musicEnabled = false;
          updateMusicToggle();
        });
      }
      updateMusicToggle();

      if (victoryButton) {
        victoryButton.addEventListener('click', function () {
          global.location.reload();
        });
      }

      function startLoop() {
        if (musicToggle) {
          musicToggle.classList.add('music-toggle--game');
        }
        if (engineArtLayer) {
          engineArtLayer.style.display = 'none';
          engineArtLayer.classList.remove('engine-art--zoom');
        }
        if (canvas) {
          canvas.style.opacity = '1';
        }
        game.running = true;
        global.requestAnimationFrame(tick);
      }

      function pauseLoop() {
        game.running = false;
      }

      function showTeachingGate() {
        if (!gateScreen || !gateButton) {
          startLoop();
          return;
        }
        gateButton.disabled = false;
        gateButton.onclick = function () {
          gateButton.disabled = true;
          hideOverlay(gateScreen, startLoop);
        };
        showOverlay(gateScreen);
      }

      function playStory(onDone) {
        if (!storyScreen || !storySlide || !storyCaption) {
          if (onDone) {
            onDone();
          }
          return;
        }

        if (engineArtLayer) {
          engineArtLayer.style.display = 'block';
        }
        if (canvas) {
          canvas.style.opacity = '0';
        }
        showOverlay(storyScreen);

        var cfg = getEngineConfig();
        var slides = cfg.storySlides.length ? cfg.storySlides : [];
        var index = 0;
        var finalTimer = 0;
        var finished = false;

        function applySlide(slide, i) {
          if (storyTitle) {
            storyTitle.textContent = slide && slide.title ? slide.title : ('情景画面 ' + (i + 1));
          }
          storyCaption.textContent = slide && slide.caption ? slide.caption : ('情景画面 ' + (i + 1) + ' / ' + slides.length);
          if (engineArtLayer && slide && slide.image) {
            engineArtLayer.style.backgroundImage = 'url(' + slide.image + ')';
            engineArtLayer.classList.remove('engine-art--zoom');
            void engineArtLayer.offsetWidth;
            engineArtLayer.classList.add('engine-art--zoom');
          }
          if (slide && slide.image) {
            storySlide.style.backgroundImage = 'url(' + slide.image + ')';
            storySlide.style.backgroundSize = 'cover';
            storySlide.style.backgroundPosition = 'center';
            storySlide.style.backgroundRepeat = 'no-repeat';
            storySlide.style.backgroundColor = '#05050a';
          } else {
            storySlide.style.backgroundImage = '';
            storySlide.style.background = slide && slide.background ? slide.background : '#05050a';
          }
          storySlide.classList.remove('story-slide--play');
          void storySlide.offsetWidth;
          storySlide.classList.add('story-slide--play');

          if (i === slides.length - 1 && !finalTimer) {
            finalTimer = global.setTimeout(finish, 3000);
          }
        }

        function finish() {
          if (finished) {
            return;
          }
          finished = true;
          if (finalTimer) {
            global.clearTimeout(finalTimer);
            finalTimer = 0;
          }
          storyScreen.removeEventListener('pointerup', onBackgroundAdvance);
          global.removeEventListener('keydown', onStoryKeyDown);
          hideOverlay(storyScreen);
          if (onDone) {
            onDone();
          }
        }

        function next() {
          if (index >= slides.length - 1) {
            return;
          }
          index += 1;
          applySlide(slides[index], index);
        }

        function onBackgroundAdvance(event) {
          event.preventDefault();
          next();
        }

        function onStoryKeyDown(event) {
          if (event.key === ' ' || event.key === 'Enter' || event.key === 'ArrowRight') {
            event.preventDefault();
            next();
          }
        }

        if (!slides.length) {
          finish();
          return;
        }

        storyScreen.addEventListener('pointerup', onBackgroundAdvance);
        global.addEventListener('keydown', onStoryKeyDown);
        applySlide(slides[index], index);
      }

      if (startScreen) {
        pauseLoop();
        if (canvas) {
          canvas.style.opacity = '0';
        }
        showOverlay(startScreen);
        var openingStarted = false;

        function goToStory(event) {
          if (openingStarted) {
            return;
          }
          if (event) {
            event.preventDefault();
          }
          openingStarted = true;
          startMusic();
          startScreen.removeEventListener('pointerup', goToStory);
          global.removeEventListener('keydown', onOpeningKeyDown);
          hideOverlay(startScreen, function () {
            var cfg = getEngineConfig();
            if (!cfg.storySlides || !cfg.storySlides.length) {
              showTeachingGate();
              return;
            }
            playStory(showTeachingGate);
          });
        }

        function onOpeningKeyDown(event) {
          if (event.target === musicToggle) {
            return;
          }
          if (event.key === 'Enter' || event.key === ' ') {
            if (startScreen.style.display !== 'none' && startScreen.classList.contains('overlay--show')) {
              goToStory(event);
            }
          }
        }

        startScreen.addEventListener('pointerup', goToStory);
        global.addEventListener('keydown', onOpeningKeyDown);
      } else {
        game.running = true;
        global.requestAnimationFrame(tick);
      }

      (function bindEngineArt() {
        var cfg = getEngineConfig();
        var urls = [];
        if (cfg.opening && cfg.opening.backgroundImage) {
          urls.push(cfg.opening.backgroundImage);
          if (engineArtLayer) {
            engineArtLayer.style.backgroundImage = 'url(' + cfg.opening.backgroundImage + ')';
            engineArtLayer.style.display = 'block';
          }
          var opening = document.getElementById('opening-art');
          if (opening) {
            opening.style.backgroundImage = 'url(' + cfg.opening.backgroundImage + ')';
          }
        }
        for (var i = 0; i < cfg.storySlides.length; i += 1) {
          if (cfg.storySlides[i] && cfg.storySlides[i].image) {
            urls.push(cfg.storySlides[i].image);
          }
        }
        preloadImages(urls);
      })();

      if (game && typeof game.render === 'function') {
        game.render();
      }
    } catch (error) {
      console.error(error);
      showFatalError();
    }
  });
})(window);
