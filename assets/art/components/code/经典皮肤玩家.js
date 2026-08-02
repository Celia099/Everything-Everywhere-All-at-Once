(function classicEvelynDemo(global) {
  'use strict';

  function ensureCanvas() {
    var canvas = document.getElementById('classic-player-demo-canvas');
    if (canvas) {
      return canvas;
    }
    canvas = document.createElement('canvas');
    canvas.id = 'classic-player-demo-canvas';
    canvas.width = 256;
    canvas.height = 256;
    document.body.appendChild(canvas);
    return canvas;
  }

  var canvas = ensureCanvas();
  var ctx = canvas.getContext('2d');
  var palette = {
    0: 'rgba(0,0,0,0)',
    1: '#1b1412',
    2: '#f1c27d',
    3: '#c01818',
    4: '#7f0f12'
  };
  var matrix = [
    '0000111111110000',
    '0001111111111000',
    '0011111111111100',
    '0011112222111100',
    '0111122222221110',
    '0111222222222110',
    '0111222222222110',
    '0111122222221110',
    '0011112222111100',
    '0011111111111100',
    '0011113333111100',
    '0111133333331110',
    '0111333333333110',
    '0111333444333110',
    '0111333444333110',
    '0111333333333110',
    '0011333333331100',
    '0001133333311000',
    '0000113333110000',
    '0000114444110000',
    '0000114444110000',
    '0000014444100000',
    '0000001111000000',
    '0000000000000000'
  ];

  if (!ctx) {
    return;
  }

  ctx.imageSmoothingEnabled = false;

  function drawClassicEvelyn(context, x, y, blockSize) {
    var rowIndex;
    var colIndex;
    var row;
    var index;

    for (rowIndex = 0; rowIndex < matrix.length; rowIndex += 1) {
      row = matrix[rowIndex];
      for (colIndex = 0; colIndex < row.length; colIndex += 1) {
        index = row.charCodeAt(colIndex) - 48;
        if (index === 0) {
          continue;
        }
        context.fillStyle = palette[index];
        context.fillRect(x + colIndex * blockSize, y + rowIndex * blockSize, blockSize, blockSize);
      }
    }
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawClassicEvelyn(
    ctx,
    Math.floor((canvas.width - matrix[0].length * 6) * 0.5),
    Math.floor((canvas.height - matrix.length * 6) * 0.5),
    6
  );

  global.drawClassicEvelyn = drawClassicEvelyn;
})(window);
