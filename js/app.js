(function boot(global) {
  'use strict';

  var game = null;
  var prefersReducedMotion = false;
  var engineConfig = null;
  var gateScreen = null;
  var gateTitle = null;
  var gateSubtitle = null;
  var gateButton = null;
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

  function showGate(title, subtitle, buttonText, onConfirm) {
    if (!gateScreen || !gateTitle || !gateSubtitle || !gateButton) {
      return;
    }
    gateTitle.textContent = title;
    gateSubtitle.textContent = subtitle;
    gateButton.textContent = buttonText;
    gateButton.disabled = false;
    gateButton.onclick = function () {
      gateButton.disabled = true;
      hideOverlay(gateScreen, function () {
        if (onConfirm) {
          onConfirm();
        }
      });
    };
    showOverlay(gateScreen);
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
      var startButton = document.getElementById('start-button');
      var storyScreen = document.getElementById('story-screen');
      var storySlide = document.getElementById('story-slide');
      var storyCaption = document.getElementById('story-caption');
      if (global.matchMedia) {
        prefersReducedMotion = global.matchMedia('(prefers-reduced-motion: reduce)').matches;
      }
      gateScreen = document.getElementById('gate-screen');
      gateTitle = document.getElementById('gate-title');
      gateSubtitle = document.getElementById('gate-subtitle');
      gateButton = document.getElementById('gate-button');
      victoryScreen = document.getElementById('victory-screen');
      victoryButton = document.getElementById('victory-button');
      game = new global.ULEAP_Game(canvas, errorElement);

      var originalReset = game.reset.bind(game);
      game.reset = function patchedReset() {
        victoryShown = false;
        return originalReset();
      };

      if (victoryButton) {
        victoryButton.addEventListener('click', function () {
          global.location.reload();
        });
      }

      function startLoop() {
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
        var duration = Math.max(0, cfg.storyDurationMs | 0);
        var slides = cfg.storySlides.length ? cfg.storySlides : [];

        var timers = [];
        var index = 0;

        function clearTimers() {
          while (timers.length) {
            global.clearTimeout(timers.pop());
          }
        }

        function applySlide(slide, i) {
          storyCaption.textContent = slide && slide.caption ? slide.caption : ('情景画面 ' + (i + 1) + ' / 2');
          if (engineArtLayer && slide && slide.image) {
            engineArtLayer.style.backgroundImage = 'url(' + slide.image + ')';
            engineArtLayer.classList.remove('engine-art--zoom');
            void engineArtLayer.offsetWidth;
            engineArtLayer.classList.add('engine-art--zoom');
            return;
          }
          if (slide && slide.image) {
            storySlide.style.backgroundImage = 'url(' + slide.image + ')';
            storySlide.style.backgroundSize = 'contain';
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
        }

        function finish() {
          clearTimers();
          storyScreen.removeEventListener('pointerup', onSkip);
          global.removeEventListener('keydown', onKeySkip);
          hideOverlay(storyScreen, function () {
            if (onDone) {
              onDone();
            }
          });
        }

        function next() {
          clearTimers();
          if (index >= slides.length) {
            finish();
            return;
          }
          applySlide(slides[index], index);
          index += 1;
          if (duration > 0) {
            timers.push(global.setTimeout(next, duration));
          }
        }

        function onSkip(event) {
          if (event) {
            event.preventDefault();
          }
          next();
        }

        function onKeySkip(event) {
          if (event.key === ' ' || event.key === 'Enter' || event.key === 'Escape') {
            event.preventDefault();
            next();
          }
        }

        storyScreen.addEventListener('pointerup', onSkip);
        global.addEventListener('keydown', onKeySkip);

        if (!slides.length) {
          finish();
          return;
        }

        next();
      }

      if (startScreen && startButton) {
        pauseLoop();
        if (canvas) {
          canvas.style.opacity = '0';
        }
        showOverlay(startScreen);

        function goToStory() {
          startButton.disabled = true;
          hideOverlay(startScreen, function () {
            var cfg = getEngineConfig();
            if (!cfg.storySlides || !cfg.storySlides.length) {
              showGate('确认开始第1关？', '点击确认后进入第1关。', '开始第1关', function () {
                startLoop();
              });
              return;
            }
            playStory(function () {
              showGate('确认开始第1关？', '点击确认后进入第1关。', '开始第1关', function () {
                startLoop();
              });
            });
          });
        }

        startButton.addEventListener('click', goToStory);

        global.addEventListener('keydown', function onKeyDown(event) {
          if (event.key === 'Enter' || event.key === ' ') {
            if (startScreen.style.display !== 'none' && startScreen.classList.contains('overlay--show')) {
              event.preventDefault();
              goToStory();
            }
          }
        });
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
