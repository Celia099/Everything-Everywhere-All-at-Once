(function coinDemo(global) {
  'use strict';

  function ensureCanvas() {
    var canvas = document.getElementById('c');
    if (canvas) {
      return canvas;
    }

    canvas = document.createElement('canvas');
    canvas.id = 'c';
    canvas.width = 256;
    canvas.height = 256;
    document.body.appendChild(canvas);
    return canvas;
  }

  var canvas = ensureCanvas();
  var ctx = canvas.getContext('2d');

  if (!ctx) {
    return;
  }

  ctx.imageSmoothingEnabled = false;

  // 12x12 blocks, each block is 4px => 48x48 sprite
  // 0=transparent
  var P = {
    0: 'rgba(0,0,0,0)',
    1: '#2B2B2E',
    2: '#60646D',
    3: '#9AA0AA',
    4: '#C9CED6',
    5: '#EEF1F5',
    6: '#767B84',
    7: '#DDE2E8'
  };

  // 像素块矩阵：尽量做出“银币边缘厚度 + 内圈 + 高光 + $号”
  var M = [
    [0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 2, 2, 2, 5, 5, 2, 2, 1, 0, 0],
    [1, 2, 5, 5, 5, 5, 5, 5, 4, 2, 1, 0],
    [1, 2, 5, 7, 7, 7, 7, 7, 4, 2, 1, 0],
    [1, 2, 5, 7, 3, 3, 3, 7, 4, 2, 1, 0],
    [1, 2, 5, 7, 3, 6, 6, 7, 4, 2, 1, 0],
    [1, 2, 5, 7, 3, 6, 6, 7, 4, 2, 1, 0],
    [1, 2, 4, 7, 3, 3, 3, 7, 4, 2, 1, 0],
    [1, 2, 4, 7, 7, 7, 7, 7, 4, 2, 1, 0],
    [0, 1, 2, 4, 4, 4, 4, 4, 2, 1, 0, 0],
    [0, 0, 1, 2, 2, 2, 2, 2, 1, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0]
  ];

  // 在硬币中心叠加 $ 符号
  var SIGN_COLOR = '#3A3D43';
  var S = [
    [0, 0, 0, 8, 8, 0, 0],
    [0, 0, 8, 0, 0, 8, 0],
    [0, 0, 8, 8, 8, 0, 0],
    [0, 0, 0, 0, 0, 8, 0],
    [0, 0, 8, 8, 8, 0, 0],
    [0, 8, 0, 0, 0, 8, 0],
    [0, 0, 8, 8, 8, 0, 0]
  ];

  function drawPixelBlocks(context, x, y, blockSize, matrix, palette) {
    var r;
    var c;
    var value;
    for (r = 0; r < matrix.length; r += 1) {
      for (c = 0; c < matrix[r].length; c += 1) {
        value = matrix[r][c];
        if (!value) {
          continue;
        }
        context.fillStyle = palette[value] || 'rgba(0,0,0,0)';
        if (context.fillStyle === 'rgba(0,0,0,0)') {
          continue;
        }
        context.fillRect(x + c * blockSize, y + r * blockSize, blockSize, blockSize);
      }
    }
  }

  function drawCoinSprite(context, x, y, scale) {
    var spriteScale = typeof scale === 'number' ? scale : 1;
    var block = 4 * spriteScale;
    var signBlock = block;
    var signW = S[0].length * signBlock;
    var signH = S.length * signBlock;
    var coinW = M[0].length * block;
    var coinH = M.length * block;
    var sx = x + ((coinW - signW) >> 1);
    var sy = y + ((coinH - signH) >> 1);
    var signPalette = { 8: SIGN_COLOR };

    drawPixelBlocks(context, x, y, block, M, P);
    drawPixelBlocks(context, sx, sy, signBlock, S, signPalette);

    context.fillStyle = '#FFFFFF';
    context.globalAlpha = 0.85;
    context.fillRect(x + 5 * block, y + 2 * block, block, block);
    context.fillRect(x + 8 * block, y + 4 * block, block, block);
    context.globalAlpha = 1;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  var demoScale = 2;
  drawCoinSprite(
    ctx,
    Math.floor((canvas.width - M[0].length * 4 * demoScale) * 0.5),
    Math.floor((canvas.height - M.length * 4 * demoScale) * 0.5),
    demoScale
  );

  global.drawCoinSprite = drawCoinSprite;
})(window);
