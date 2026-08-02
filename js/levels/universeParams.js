(function attachUniverseConfig(global) {
  'use strict';

  var GAME_CONFIG = {
    title: '瞬息全宇宙：逃离贝果',
    logicWidth: 720,
    logicHeight: 1280,
    tileSize: 80,
    mapCols: 9,
    mapRows: 16,
    playerRadius: 26,
    playerSpeed: 280,
    bagelRadius: 24,
    fragmentRadius: 16,
    initialCollapse: 50,
    collapseRates: [
      { until: 30, rate: 0.2 },
      { until: 60, rate: 0.4 },
      { until: Infinity, rate: 0.8 }
    ],
    fragmentRelief: 5,
    hitPenalty: 10,
    nearBagelMultiplier: 1.5,
    nearBagelDistance: 150,
    skillCooldown: 5,
    skillRelief: 5,
    fragmentConcurrent: 5,
    fragmentRespawnDelay: 3,
    tutorialFragmentGoal: 3,
    tutorialUniverse: 'stone',
    stageChangeDelay: 1.2,
    chaseDecisionInterval: 0.18,
    wanderDecisionInterval: 0.6,
    stuckCheckInterval: 0.9,
    skillButtonRadius: 76,
    dragReferenceRadius: 86,
    hudTopPadding: 54,
    uiEdgePadding: 38,
    touchDeadZone: 14,
    skillTapMaxMove: 20,
    collisionEpsilon: 0.01,
    maxDt: 0.033,
    safeSpawnDistanceFromPlayer: 170,
    toastDuration: 1.8
  };

  var UNIVERSES = {
    stone: {
      key: 'stone',
      label: '石头宇宙',
      pursuerCount: 1,
      speed: 145,
      perception: 180,
      background: '#29272c',
      floor: '#403b43',
      wall: '#7f7785',
      accent: '#d8d2dc',
      fragment: '#fff2a6',
      player: '#ffffff',
      pursuer: '#b0a7b7',
      pursuerShape: 'rock'
    },
    laundromat: {
      key: 'laundromat',
      label: '洗衣店宇宙',
      pursuerCount: 1,
      speed: 220,
      perception: 240,
      background: '#10263f',
      floor: '#183a5f',
      wall: '#79b8f3',
      accent: '#9ad9ff',
      fragment: '#f7f3b0',
      player: '#fefefe',
      pursuer: '#8cd5ff',
      pursuerShape: 'washer'
    },
    hotdog: {
      key: 'hotdog',
      label: '热狗宇宙',
      pursuerCount: 3,
      speed: 180,
      perception: 180,
      background: '#432116',
      floor: '#6d3623',
      wall: '#f2b366',
      accent: '#ffdca0',
      fragment: '#fff2aa',
      player: '#fffefa',
      pursuer: '#f0803c',
      pursuerShape: 'hotdog'
    },
    kungfu: {
      key: 'kungfu',
      label: '功夫宇宙',
      pursuerCount: 1,
      speed: 185,
      perception: 320,
      background: '#311317',
      floor: '#5a1f27',
      wall: '#ea8b6f',
      accent: '#ffd0b0',
      fragment: '#fff2a8',
      player: '#ffffff',
      pursuer: '#ff6f61',
      pursuerShape: 'diamond'
    }
  };

  var UNIVERSE_POOL = ['stone', 'laundromat', 'hotdog', 'kungfu'];

  global.ULEAP_CONFIG = {
    GAME_CONFIG: GAME_CONFIG,
    UNIVERSES: UNIVERSES,
    UNIVERSE_POOL: UNIVERSE_POOL
  };
})(window);
