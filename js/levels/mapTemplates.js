(function attachMaps(global) {
  'use strict';

  global.ULEAP_MAPS = {
    mainMaze: {
      key: 'mainMaze',
      name: '贝果迷宫',
      grid: [
        '111111111',
        '100000001',
        '101110101',
        '101000101',
        '101011101',
        '101000001',
        '101111101',
        '100000101',
        '111010101',
        '100010001',
        '101110111',
        '101000001',
        '101011101',
        '100010001',
        '101000101',
        '111111111'
      ],
      playerSpawn: { col: 1, row: 1 },
      pursuerSpawns: [
        { col: 7, row: 1 },
        { col: 7, row: 13 },
        { col: 1, row: 13 },
        { col: 5, row: 11 }
      ],
      fragmentSpawns: [
        { col: 2, row: 1 },
        { col: 4, row: 1 },
        { col: 6, row: 1 },
        { col: 1, row: 3 },
        { col: 4, row: 3 },
        { col: 7, row: 3 },
        { col: 1, row: 5 },
        { col: 3, row: 5 },
        { col: 5, row: 5 },
        { col: 7, row: 5 },
        { col: 1, row: 7 },
        { col: 3, row: 7 },
        { col: 5, row: 7 },
        { col: 7, row: 8 },
        { col: 1, row: 9 },
        { col: 6, row: 9 },
        { col: 2, row: 11 },
        { col: 4, row: 11 },
        { col: 7, row: 11 },
        { col: 1, row: 13 },
        { col: 5, row: 13 },
        { col: 7, row: 13 },
        { col: 3, row: 14 },
        { col: 6, row: 14 }
      ]
    }
  };
})(window);
