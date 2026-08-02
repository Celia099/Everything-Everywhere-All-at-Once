(function bagelSpriteDemo(global) {
  'use strict';

  function ensureCanvas() {
    var canvas = document.getElementById('bagel-demo-canvas');
    if (canvas) {
      return canvas;
    }
    canvas = document.createElement('canvas');
    canvas.id = 'bagel-demo-canvas';
    canvas.width = 256;
    canvas.height = 256;
    document.body.appendChild(canvas);
    return canvas;
  }

  var canvas = ensureCanvas();
  var ctx = canvas.getContext('2d');
  var LOGICAL_SIZE = 32;
  var DISPLAY_SCALE = 8;
  var offscreen = document.createElement('canvas');
  var offCtx = offscreen.getContext('2d');
  var palette = {
    outline: '#5a2406',
    dark: '#9a470d',
    mid: '#c86410',
    warm: '#dd7b14',
    light: '#f0b35d',
    cream: '#f7e2a1',
    glaze: '#fff3ca',
    hole: '#261004',
    seed: '#fff6dd'
  };
  var seedPositions = [
    { x: 10, y: 7 }, { x: 14, y: 6 }, { x: 21, y: 7 }, { x: 24, y: 9 },
    { x: 8, y: 10 }, { x: 18, y: 9 }, { x: 23, y: 12 }, { x: 7, y: 14 },
    { x: 12, y: 16 }, { x: 20, y: 15 }, { x: 25, y: 16 }, { x: 9, y: 20 },
    { x: 15, y: 21 }, { x: 22, y: 20 }, { x: 18, y: 24 }
  ];

  if (!ctx || !offCtx) {
    return;
  }

  canvas.width = 256;
  canvas.height = 256;
  offscreen.width = LOGICAL_SIZE;
  offscreen.height = LOGICAL_SIZE;
  ctx.imageSmoothingEnabled = false;
  offCtx.imageSmoothingEnabled = false;

  function getBagelColor(x, y) {
    var dx = x - 16;
    var dy = y - 16;
    var outer = (dx * dx) / (13.7 * 13.7) + (dy * dy) / (11.6 * 11.6);
    var innerDx = x - 16.1;
    var innerDy = y - 15.6;
    var inner = (innerDx * innerDx) / (4.1 * 4.1) + (innerDy * innerDy) / (2.9 * 2.9);
    var edgeBias = (x - 16) * 0.06 + (y - 16) * 0.03;

    if (outer > 1.08) {
      return null;
    }
    if (inner < 0.9) {
      return palette.hole;
    }
    if (outer > 0.98) {
      return palette.outline;
    }
    if (inner < 1.15) {
      return palette.dark;
    }
    if (outer > 0.88) {
      return edgeBias > 0.3 ? palette.dark : palette.light;
    }
    if ((x <= 10 && y <= 12) || (x >= 20 && y >= 15 && y <= 23) || (y >= 23 && x >= 8 && x <= 23)) {
      return palette.cream;
    }
    if ((x <= 12 && y <= 9) || (x >= 22 && y >= 11 && y <= 19)) {
      return palette.glaze;
    }
    if ((x >= 12 && x <= 19 && y >= 11 && y <= 19) || (x >= 8 && x <= 23 && y >= 20 && y <= 23)) {
      return palette.warm;
    }
    return edgeBias > 0.35 ? palette.mid : palette.light;
  }

  function drawSeeds(context) {
    var i;
    var seed;
    for (i = 0; i < seedPositions.length; i += 1) {
      seed = seedPositions[i];
      context.fillStyle = palette.seed;
      context.fillRect(seed.x, seed.y, 1, 1);
      if (i % 3 === 0) {
        context.fillRect(seed.x + 1, seed.y, 1, 1);
      }
    }
  }

  function renderBagelSprite(context, x, y, scale) {
    var px;
    var py;
    var color;
    var size = typeof scale === 'number' ? scale : DISPLAY_SCALE;

    offCtx.clearRect(0, 0, LOGICAL_SIZE, LOGICAL_SIZE);

    for (py = 0; py < LOGICAL_SIZE; py += 1) {
      for (px = 0; px < LOGICAL_SIZE; px += 1) {
        color = getBagelColor(px + 0.5, py + 0.5);
        if (!color) {
          continue;
        }
        offCtx.fillStyle = color;
        offCtx.fillRect(px, py, 1, 1);
      }
    }

    drawSeeds(offCtx);

    context.save();
    context.imageSmoothingEnabled = false;
    context.drawImage(offscreen, x, y, LOGICAL_SIZE * size, LOGICAL_SIZE * size);
    context.restore();
  }

  function drawBagelSprite(context, x, y, scale) {
    renderBagelSprite(context, x, y, scale);
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBagelSprite(
    ctx,
    Math.floor((canvas.width - LOGICAL_SIZE * DISPLAY_SCALE) * 0.5),
    Math.floor((canvas.height - LOGICAL_SIZE * DISPLAY_SCALE) * 0.5),
    DISPLAY_SCALE
  );

  global.drawBagelSprite = drawBagelSprite;
})(window);
