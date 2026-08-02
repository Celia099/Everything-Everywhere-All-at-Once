(function hotdogHandDemo(global) {
  'use strict';

  function ensureCanvas() {
    var canvas = document.getElementById('hotdog-hand-demo-canvas');
    if (canvas) {
      return canvas;
    }
    canvas = document.createElement('canvas');
    canvas.id = 'hotdog-hand-demo-canvas';
    canvas.width = 256;
    canvas.height = 256;
    document.body.appendChild(canvas);
    return canvas;
  }

  var canvas = ensureCanvas();
  var ctx = canvas.getContext('2d');
  var palette = [
    'rgba(0,0,0,0)',
    '#381812',
    '#E07B4F',
    '#FFBA96',
    '#B85B35'
  ];

  if (!ctx) {
    return;
  }

  ctx.imageSmoothingEnabled = false;

  function makeGrid(width, height, value) {
    return Array.from({ length: height }, function () {
      return Array(width).fill(typeof value === 'number' ? value : 0);
    });
  }

  function rect(grid, x0, y0, x1, y1, value) {
    var y;
    var x;
    for (y = Math.max(0, y0); y < Math.min(grid.length, y1); y += 1) {
      for (x = Math.max(0, x0); x < Math.min(grid[0].length, x1); x += 1) {
        grid[y][x] = value;
      }
    }
  }

  function outline(fill, outlineValue) {
    var height = fill.length;
    var width = fill[0].length;
    var output = fill.map(function (row) { return row.slice(); });
    var y;
    var x;
    var dy;
    var dx;
    var nx;
    var ny;

    for (y = 0; y < height; y += 1) {
      for (x = 0; x < width; x += 1) {
        if (fill[y][x] === 0) {
          continue;
        }
        for (dy = -1; dy <= 1; dy += 1) {
          for (dx = -1; dx <= 1; dx += 1) {
            nx = x + dx;
            ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
              continue;
            }
            if (fill[ny][nx] === 0) {
              output[ny][nx] = outlineValue;
            }
          }
        }
      }
    }

    for (y = 0; y < height; y += 1) {
      for (x = 0; x < width; x += 1) {
        if (fill[y][x] !== 0) {
          output[y][x] = fill[y][x];
        }
      }
    }

    return output;
  }

  function shade(fill) {
    var height = fill.length;
    var width = fill[0].length;
    var y;
    var x;

    for (y = 0; y < height; y += 1) {
      for (x = 0; x < width; x += 1) {
        if (fill[y][x] !== 2) {
          continue;
        }
        if ((x <= width * 0.40 && y <= height * 0.45) || (y <= 5 && x <= width * 0.65)) {
          fill[y][x] = 3;
        }
        if ((x >= width * 0.62 && y >= height * 0.35) || (y >= height * 0.66)) {
          fill[y][x] = 4;
        }
      }
    }
  }

  function buildHotdogHand32() {
    var width = 32;
    var height = 32;
    var grid = makeGrid(width, height, 0);
    var fingerWidth = 2;
    var gap = 1;
    var totalWidth = 5 * fingerWidth + 4 * gap;
    var startX = Math.floor((width - totalWidth) / 2);
    var lengths = [8, 10, 12, 10, 7];
    var yBase = 10;
    var palmBottom = 22;
    var i;
    var x0;
    var y0;
    var gx;

    for (i = 0; i < 5; i += 1) {
      x0 = startX + i * (fingerWidth + gap);
      y0 = yBase - lengths[i];
      rect(grid, x0, y0, x0 + fingerWidth, yBase, 2);
      rect(grid, x0, y0 - 1, x0 + fingerWidth, y0, 2);
    }

    rect(grid, startX - 2, yBase, startX + totalWidth + 2, palmBottom, 2);
    rect(grid, startX - 1, palmBottom, startX + totalWidth + 1, palmBottom + 2, 2);

    for (i = 0; i < 4; i += 1) {
      gx = startX + i * (fingerWidth + gap) + fingerWidth;
      rect(grid, gx, yBase - 2, gx + gap, yBase + 1, 0);
    }

    shade(grid);
    return outline(grid, 1);
  }

  function drawHotdogHand(context, x, y, blockSize, grid) {
    var rowIndex;
    var colIndex;
    var value;

    for (rowIndex = 0; rowIndex < grid.length; rowIndex += 1) {
      for (colIndex = 0; colIndex < grid[rowIndex].length; colIndex += 1) {
        value = grid[rowIndex][colIndex];
        if (value === 0) {
          continue;
        }
        context.fillStyle = palette[value];
        context.fillRect(x + colIndex * blockSize, y + rowIndex * blockSize, blockSize, blockSize);
      }
    }
  }

  var hand = buildHotdogHand32();
  var handBlock = 4;
  var handSize = hand.length * handBlock;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawHotdogHand(
    ctx,
    Math.floor((canvas.width - handSize) * 0.5),
    Math.floor((canvas.height - handSize) * 0.5),
    handBlock,
    hand
  );

  global.buildHotdogHand32 = buildHotdogHand32;
  global.drawHotdogHand = drawHotdogHand;
})(window);
