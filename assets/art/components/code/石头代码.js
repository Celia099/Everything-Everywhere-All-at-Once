(function stoneSpriteDemo(global) {
  'use strict';

  function ensureCanvas() {
    var canvas = document.getElementById('stone-demo-canvas');
    if (canvas) {
      return canvas;
    }
    canvas = document.createElement('canvas');
    canvas.id = 'stone-demo-canvas';
    canvas.width = 256;
    canvas.height = 256;
    document.body.appendChild(canvas);
    return canvas;
  }

  var canvas = ensureCanvas();
  var ctx = canvas.getContext('2d');
  var pixel = 8;
  var sprite = [
    '0001111000',
    '0012222100',
    '0122222220',
    '1222222221',
    '1220000221',
    '1220000221',
    '1222222221',
    '0122222210',
    '0012222100',
    '0001111000'
  ];
  var colors = {
    '1': '#7d7d7d',
    '2': '#bdbdbd'
  };

  if (!ctx) {
    return;
  }

  ctx.imageSmoothingEnabled = false;

  function drawEye(x, y) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(x, y, pixel * 2, pixel * 2);
    ctx.fillStyle = '#000';
    ctx.fillRect(x + pixel, y + pixel, pixel, pixel);
  }

  function drawStoneSprite(x, y) {
    var rowIndex;
    var colIndex;
    var row;
    var value;

    for (rowIndex = 0; rowIndex < sprite.length; rowIndex += 1) {
      row = sprite[rowIndex];
      for (colIndex = 0; colIndex < row.length; colIndex += 1) {
        value = row.charAt(colIndex);
        if (value === '0') {
          continue;
        }
        ctx.fillStyle = colors[value];
        ctx.fillRect(x + colIndex * pixel, y + rowIndex * pixel, pixel, pixel);
      }
    }

    drawEye(x + 22, y + 30);
    drawEye(x + 54, y + 30);

    ctx.fillStyle = '#000';
    ctx.fillRect(x + 38, y + 52, pixel, pixel);
    ctx.fillRect(x + 30, y + 60, pixel, pixel);
    ctx.fillRect(x + 46, y + 60, pixel, pixel);
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStoneSprite(
    Math.floor((canvas.width - sprite[0].length * pixel) * 0.5),
    Math.floor((canvas.height - sprite.length * pixel) * 0.5)
  );

  global.drawStoneSprite = drawStoneSprite;
})(window);
