(function kungfuEvelynDemo(global) {
  'use strict';

  function ensureCanvas() {
    var canvas = document.getElementById('kungfu-player-demo-canvas');
    if (canvas) {
      return canvas;
    }
    canvas = document.createElement('canvas');
    canvas.id = 'kungfu-player-demo-canvas';
    canvas.width = 256;
    canvas.height = 256;
    document.body.appendChild(canvas);
    return canvas;
  }

  var canvas = ensureCanvas();
  var ctx = canvas.getContext('2d');
  var palette = {
    0: 'rgba(0,0,0,0)',
    1: '#141216',
    2: '#F2C27B',
    3: '#F4F4F4',
    4: '#CFCFD4',
    5: '#101014',
    6: '#0A0A0C'
  };
  var matrix = [
    '000000000066660000000000',
    '000000000661166000000000',
    '000000006611116600000000',
    '000000006112221600000000',
    '000000061122222160000000',
    '000000611222222216000000',
    '000000611222222216000000',
    '000000061122222160000000',
    '000000006112221600000000',
    '000000006333333600000000',
    '000000063344443360000000',
    '000000633344444336000000',
    '000006333334433333600000',
    '000006333333333333600000',
    '000006333335553333600000',
    '000006333355553333600000',
    '000000633335553336000000',
    '000000063333333360000000',
    '000000006334443600000000',
    '000000006334443600000000',
    '000000006344443600000000',
    '000000000663336000000000',
    '000000000066660000000000',
    '000000000000000000000000'
  ];

  if (!ctx) {
    return;
  }

  ctx.imageSmoothingEnabled = false;

  function drawKungfuEvelyn(context, x, y, blockSize) {
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
  drawKungfuEvelyn(
    ctx,
    Math.floor((canvas.width - matrix[0].length * 6) * 0.5),
    Math.floor((canvas.height - matrix.length * 6) * 0.5),
    6
  );

  global.drawKungfuEvelyn = drawKungfuEvelyn;
})(window);
