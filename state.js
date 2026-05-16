// state.js
// État applicatif, valeurs par défaut et presets indicatifs.

export const COLORS = [
  '#43b0f1', '#bd00ff', '#00ff9d', '#ffbe0b',
  '#f94144', '#0ef6cc', '#1d3557', '#f3722c'
];

export const DEFAULT_PARAMS = {
  setupName: 'Setup de base',
  uiMode: 'simple',
  bowType: 'recurve',

  fps: 190,
  angleDeg: 0,
  shootingHeight: 1.5,
  scopeOffset: 0.05,
  scopeAngleDeg: 0,

  poidsGr: 25,
  massMode: 'total',
  diameter: 0.007,
  arrowLengthIn: 29,
  spineStatic: 600,
  spineReference: 'generalized',
  shaftGpi: 7.4,
  pointWeightGrains: 100,
  insertWeightGrains: 12,
  nockWeightGrains: 10,
  vaneWeightTotalGrains: null,
  vaneCount: 3,
  vaneLengthIn: 1.75,
  vaneProfile: 'medium',
  fletchingOrientation: 'straight',
  fletchingAngleDeg: 0,
  balancePointIn: 0,

  releaseType: 'fingers',
  drawWeightLbs: 35,
  drawLengthIn: 28,
  drawWeightBasis: 'at-28',

  pressureHpa: 1020,
  temperatureCelsius: 20,
  humidityPercent: 50,
  altitudeM: 0,
  windSpeedKmh: 0,
  windDirectionDeg: 0,
  gustPercent: 0,

  nockingPointOffsetMm: 0,
  centerShotMm: 0,
  plungerStiffness: 0.5,
  releaseErrorVerticalMm: 0,
  releaseErrorLateralMm: 0,
  dispersionEnabled: false
};

export const PRESETS = {
  longbowTraditional: {
    label: 'Longbow traditionnel',
    values: {
      setupName: 'Longbow traditionnel',
      bowType: 'traditional',
      fps: 165,
      poidsGr: 32,
      diameter: 0.008,
      arrowLengthIn: 30,
      spineStatic: 600,
      pointWeightGrains: 125,
      vaneProfile: 'low',
      fletchingOrientation: 'straight',
      drawWeightLbs: 40
    }
  },
  recurveLeisure: {
    label: 'Recurve loisir',
    values: {
      setupName: 'Recurve loisir',
      bowType: 'recurve',
      fps: 180,
      poidsGr: 26,
      diameter: 0.007,
      arrowLengthIn: 29,
      spineStatic: 700,
      pointWeightGrains: 100,
      vaneProfile: 'medium',
      drawWeightLbs: 30
    }
  },
  recurveTarget: {
    label: 'Recurve cible',
    values: {
      setupName: 'Recurve cible',
      bowType: 'recurve',
      fps: 205,
      poidsGr: 22.5,
      diameter: 0.0058,
      arrowLengthIn: 29,
      spineStatic: 600,
      shaftGpi: 6.9,
      pointWeightGrains: 100,
      vaneLengthIn: 1.75,
      vaneProfile: 'low',
      drawWeightLbs: 40
    }
  },
  barebowField: {
    label: 'Barebow field',
    values: {
      setupName: 'Barebow field',
      bowType: 'recurve',
      fps: 185,
      poidsGr: 27,
      diameter: 0.0065,
      arrowLengthIn: 30,
      spineStatic: 500,
      pointWeightGrains: 120,
      vaneLengthIn: 2,
      vaneProfile: 'medium',
      drawWeightLbs: 38
    }
  },
  compoundHunting: {
    label: 'Compound hunting',
    values: {
      setupName: 'Compound hunting',
      bowType: 'compound',
      fps: 285,
      poidsGr: 29.5,
      diameter: 0.0072,
      arrowLengthIn: 28,
      spineStatic: 340,
      pointWeightGrains: 125,
      insertWeightGrains: 30,
      vaneLengthIn: 2.1,
      vaneProfile: 'high',
      fletchingOrientation: 'helical',
      fletchingAngleDeg: 2,
      drawWeightLbs: 65,
      drawLengthIn: 29
    }
  },
  compoundTarget: {
    label: 'Compound target',
    values: {
      setupName: 'Compound target',
      bowType: 'compound',
      fps: 275,
      poidsGr: 25.5,
      diameter: 0.0062,
      arrowLengthIn: 28,
      spineStatic: 400,
      pointWeightGrains: 100,
      vaneLengthIn: 1.85,
      vaneProfile: 'medium',
      fletchingOrientation: 'offset',
      fletchingAngleDeg: 1.5,
      drawWeightLbs: 55,
      drawLengthIn: 28.5
    }
  }
};

export const appState = {
  savedCurves: [],
  activeTab: 'trajectory2D',
  requestSeq: 0,
  lastResult: null,
  pendingSave: false,
  currentSpineRecommendation: null
};
