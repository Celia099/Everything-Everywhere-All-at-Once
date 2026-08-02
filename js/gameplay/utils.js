(function attachUtils(global) {
  'use strict';

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function distance(x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function length(x, y) {
    return Math.sqrt(x * x + y * y);
  }

  function normalize(x, y) {
    var len = length(x, y);
    if (!len) {
      return { x: 0, y: 0 };
    }
    return { x: x / len, y: y / len };
  }

  function pickRandom(list) {
    if (!list || !list.length) {
      return null;
    }
    return list[Math.floor(Math.random() * list.length)];
  }

  function rectContainsPoint(rect, x, y) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  }

  function cellToWorldCenter(col, row, tileSize) {
    return {
      x: col * tileSize + tileSize * 0.5,
      y: row * tileSize + tileSize * 0.5
    };
  }

  function worldToCell(x, y, tileSize) {
    return {
      col: Math.floor(x / tileSize),
      row: Math.floor(y / tileSize)
    };
  }

  function shuffle(list) {
    var copy = list.slice();
    var i;
    var j;
    var temp;
    for (i = copy.length - 1; i > 0; i -= 1) {
      j = Math.floor(Math.random() * (i + 1));
      temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  function formatSeconds(seconds) {
    var safeSeconds = Math.max(0, Math.floor(seconds));
    var minutes = Math.floor(safeSeconds / 60);
    var remain = safeSeconds % 60;
    return minutes + ':' + (remain < 10 ? '0' + remain : remain);
  }

  global.ULEAP_UTILS = {
    clamp: clamp,
    lerp: lerp,
    distance: distance,
    length: length,
    normalize: normalize,
    pickRandom: pickRandom,
    rectContainsPoint: rectContainsPoint,
    cellToWorldCenter: cellToWorldCenter,
    worldToCell: worldToCell,
    shuffle: shuffle,
    formatSeconds: formatSeconds
  };
})(window);
