(function attachMaps(global) {
  'use strict';

  global.ULEAP_MAPS = {
    mainMaze: {
      key: 'mainMaze',
      name: '贝果迷宫',
      grid: [
        '11111111111',
        '10000000001',
        '11111111101',
        '10000000001',
        '10111111111',
        '10000000001',
        '11111111101',
        '10000000001',
        '10111111111',
        '10000000001',
        '11111111101',
        '10000000001',
        '10111111111',
        '10000000001',
        '11111111111'
      ],
      playerSpawn: { col: 1, row: 1 },
      pursuerSpawns: [
        { col: 9, row: 1 },
        { col: 9, row: 13 },
        { col: 1, row: 13 },
        { col: 5, row: 11 }
      ],
      fragmentSpawns: [
        { col: 3, row: 1 },
        { col: 5, row: 1 },
        { col: 7, row: 1 },
        { col: 1, row: 3 },
        { col: 5, row: 3 },
        { col: 9, row: 3 },
        { col: 1, row: 5 },
        { col: 5, row: 5 },
        { col: 9, row: 5 },
        { col: 1, row: 7 },
        { col: 5, row: 7 },
        { col: 9, row: 7 },
        { col: 1, row: 9 },
        { col: 5, row: 9 },
        { col: 9, row: 9 },
        { col: 1, row: 11 },
        { col: 5, row: 11 },
        { col: 9, row: 11 },
        { col: 1, row: 13 },
        { col: 5, row: 13 },
        { col: 9, row: 13 }
      ]
    }
  };
})(window);
