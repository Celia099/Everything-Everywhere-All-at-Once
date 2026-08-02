(function tutorialFragmentDemo(global) {
  'use strict';

  function ensureCanvas() {
    var canvas = document.getElementById('fragment-demo-canvas');
    if (canvas) {
      return canvas;
    }
    canvas = document.createElement('canvas');
    canvas.id = 'fragment-demo-canvas';
    canvas.width = 256;
    canvas.height = 256;
    document.body.appendChild(canvas);
    return canvas;
  }

  var canvas = ensureCanvas();
  var ctx = canvas.getContext('2d');
  var block = 4;
  var colors = {
    darkBlue: '#0055dd',
    cyan: '#00e5ff',
    white: '#ffffff'
  };
  var grid = [
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 2, 2, 1, 0, 0],
    [0, 1, 2, 3, 3, 2, 1, 0],
    [1, 2, 3, 3, 3, 3, 2, 1],
    [1, 2, 3, 3, 3, 3, 2, 1],
    [0, 1, 2, 3, 3, 2, 1, 0],
    [0, 0, 1, 2, 2, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0]
  ];
  var dotList = [
    [1, 1], [6, 1],
    [1, 6], [6, 6],
    [2, 2], [5, 2],
    [2, 5], [5, 5],
    [1, 3], [6, 3],
    [3, 1], [4, 1],
    [3, 6], [4, 6]
  ];

  if (!ctx) {
    return;
  }

  ctx.imageSmoothingEnabled = false;

  function drawTutorialFragment(context, offsetX, offsetY, scale) {
    var y;
    var x;
    var value;
    var color;
    var i;
    var factor = typeof scale === 'number' ? scale : 1;

    context.save();
    context.translate(offsetX || 0, offsetY || 0);
    context.scale(factor, factor);

    for (y = 0; y < 8; y += 1) {
      for (x = 0; x < 8; x += 1) {
        value = grid[y][x];
        color = null;
        if (value === 1) {
          color = colors.darkBlue;
        }
        if (value === 2) {
          color = colors.cyan;
        }
        if (value === 3) {
          color = colors.white;
        }
        if (color) {
          context.fillStyle = color;
          context.fillRect(x * block, y * block, block, block);
        }
      }
    }

    context.fillStyle = colors.cyan;
    context.fillRect(0 * block, 3 * block, block, block);
    context.fillRect(7 * block, 3 * block, block, block);
    context.fillRect(3 * block, 0 * block, block, block);
    context.fillRect(3 * block, 7 * block, block, block);
    context.fillRect(4 * block, 0 * block, block, block);
    context.fillRect(4 * block, 7 * block, block, block);

    context.fillStyle = colors.white;
    for (i = 0; i < dotList.length; i += 1) {
      context.fillRect(dotList[i][0] * block, dotList[i][1] * block, block, block);
    }

    context.restore();
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTutorialFragment(
    ctx,
    Math.floor((canvas.width - 8 * block * 4) * 0.5),
    Math.floor((canvas.height - 8 * block * 4) * 0.5),
    4
  );

  global.drawTutorialFragment = drawTutorialFragment;
})(window);
