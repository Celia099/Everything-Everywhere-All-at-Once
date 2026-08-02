(function hotdogEvelynDemo(global) {
  'use strict';

  function ensureCanvas() {
    var canvas = document.getElementById('hotdog-player-demo-canvas');
    if (canvas) {
      return canvas;
    }
    canvas = document.createElement('canvas');
    canvas.id = 'hotdog-player-demo-canvas';
    canvas.width = 256;
    canvas.height = 256;
    document.body.appendChild(canvas);
    return canvas;
  }

  var canvas = ensureCanvas();
  var ctx = canvas.getContext('2d');
  var palette = {
    0: 'rgba(0,0,0,0)',
    1: '#2a1c16',
    2: '#f2c27b',
    3: '#3b556a',
    4: '#e07b4f',
    5: '#b85b35'
  };
  var matrix = [
    '00000111111100000000',
    '00001111111110000000',
    '00011111111111000000',
    '00111122222211110000',
    '00111222222221110000',
    '00111222222221110000',
    '00111122222211110000',
    '00011112222111100000',
    '00003333333333300000',
    '00444433333334444000',
    '04555433333345555000',
    '04555433333345555000',
    '04555433333345555000',
    '00444433333334444000',
    '00003333333333300000',
    '00000333333330000000',
    '00000333333330000000',
    '00000333333330000000',
    '00000033333300000000',
    '00000033333300000000',
    '00000003333000000000',
    '00000000000000000000',
    '00000000000000000000',
    '00000000000000000000'
  ];

  if (!ctx) {
    return;
  }

  ctx.imageSmoothingEnabled = false;

  function drawHotdogEvelyn(context, x, y, blockSize) {
    var rowIndex;
    var colIndex;
    var row;
    var index;
    var size;

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

    context.fillStyle = palette[5];
    size = blockSize;
    context.fillRect(x + 1 * size, y + 10 * size, 1 * size, 4 * size);
    context.fillRect(x + 18 * size, y + 10 * size, 1 * size, 4 * size);
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  var demoBlockSize = 6;
  drawHotdogEvelyn(
    ctx,
    Math.floor((canvas.width - matrix[0].length * demoBlockSize) * 0.5),
    Math.floor((canvas.height - matrix.length * demoBlockSize) * 0.5),
    demoBlockSize
  );

  global.drawHotdogEvelyn = drawHotdogEvelyn;
})(window);
