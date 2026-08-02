(function trophyDemo(global) {
  'use strict';

  function ensureCanvas() {
    var canvas = document.getElementById('trophy-demo-canvas');
    if (canvas) {
      return canvas;
    }
    canvas = document.createElement('canvas');
    canvas.id = 'trophy-demo-canvas';
    canvas.width = 256;
    canvas.height = 256;
    document.body.appendChild(canvas);
    return canvas;
  }

  var canvas = ensureCanvas();
  var ctx = canvas.getContext('2d');
  var palette = [
    'rgba(0,0,0,0)',
    '#24180C',
    '#E3AA33',
    '#FFE68C',
    '#B4781C',
    '#5C3814'
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

  function buildTrophy32() {
    var grid = makeGrid(32, 32, 0);
    rect(grid, 10, 6, 22, 8, 2);
    rect(grid, 9, 8, 23, 14, 2);
    rect(grid, 10, 14, 22, 16, 2);
    rect(grid, 10, 8, 12, 14, 3);
    rect(grid, 20, 8, 22, 14, 4);
    rect(grid, 12, 12, 20, 13, 3);
    rect(grid, 6, 9, 9, 12, 2);
    rect(grid, 5, 10, 6, 11, 2);
    rect(grid, 23, 9, 26, 12, 2);
    rect(grid, 26, 10, 27, 11, 2);
    rect(grid, 6, 11, 9, 12, 4);
    rect(grid, 23, 11, 26, 12, 4);
    rect(grid, 14, 16, 18, 21, 2);
    rect(grid, 14, 16, 15, 21, 3);
    rect(grid, 17, 16, 18, 21, 4);
    rect(grid, 12, 21, 20, 23, 5);
    rect(grid, 10, 23, 22, 26, 5);
    rect(grid, 11, 23, 12, 26, 2);
    rect(grid, 20, 23, 21, 26, 4);
    rect(grid, 10, 23, 22, 24, 4);
    rect(grid, 11, 24, 21, 25, 5);
    return outline(grid, 1);
  }

  function drawTrophyGrid(context, x, y, blockSize, grid) {
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

  var trophy = buildTrophy32();
  var trophyBlock = 4;
  var trophySize = trophy.length * trophyBlock;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTrophyGrid(
    ctx,
    Math.floor((canvas.width - trophySize) * 0.5),
    Math.floor((canvas.height - trophySize) * 0.5),
    trophyBlock,
    trophy
  );

  global.buildTrophy32 = buildTrophy32;
  global.drawTrophyGrid = drawTrophyGrid;
})(window);
