// state.js
// Etat applicatif, valeurs par défaut et presets métier.

export const COLORS = [
  '#43b0f1', '#bd00ff', '#00ff9d', '#ffbe0b',
  '#f94144', '#0ef6cc', '#1d3557', '#f3722c'
];

export const DEFAULT_PARAMS = {
  setupName: 'Setup de base',
  uiMode: 'simple',
  bowType: 'recurve_target',
  releaseType: 'fingers',
  handedness: 'right',

  fps: 200,
  angleDeg: 0,
  shootingHeight: 1.5,
  scopeOffset: 0.05,
  scopeAngleDeg: 0,

  poidsGr: 25,
  massMode: 'total',
  diameter: 0.007,
  arrowLengthIn: 29,
  spineStatic: 600,
  shaftGpi: 7.4,
  pointWeightGrains: 100,
  insertWeightGrains: 12,
  nockWeightGrains: 10,
  vaneCount: 3,
  vaneLengthIn: 1.75,
  vaneProfile: 'medium',
  fletchingOrientation: 'straight',
  fletchingAngleDeg: 0,
  balancePointIn: 17,
  focPercent: 10,

  drawWeightLbs: 38,
  drawLengthIn: 28,
  braceHeightIn: 8.5,
  letOffPercent: 0,
  camAggressiveness: 0.4,

  pressureHpa: 1020,
  temperatureCelsius: 20,
  humidityPercent: 50,
  altitudeM: 0,
  windSpeedKmh: 0,
  windDirectionDeg: 0,
  gustPercent: 0,

  calibrationMode: 'chrono',
  chronoFps: 200,
  sightDistance1M: 20,
  sightHold1Cm: 0,
  sightDistance2M: 50,
  sightHold2Cm: -80,
  referenceDistanceM: 30,
  referenceDropCm: -25,

  nockingPointOffsetMm: 0,
  centerShotMm: 0,
  plungerStiffness: 0.5,
  releaseErrorVerticalMm: 0,
  releaseErrorLateralMm: 0,
  dispersionEnabled: false,
  dispersionShots: 12,

  forceCurveEnabled: false,
  forceProfile: 'auto',
  forcePoint1DrawIn: 10,
  forcePoint1Lbs: 12,
  forcePoint2DrawIn: 20,
  forcePoint2Lbs: 32,
  forcePoint3DrawIn: 28,
  forcePoint3Lbs: 38
};

export const PRESETS = {
  recurve70: {
    label: 'Recurve cible 70 m',
    values: {
      setupName: 'Recurve cible 70 m',
      bowType: 'recurve_target',
      releaseType: 'fingers',
      fps: 205,
      poidsGr: 22.5,
      arrowLengthIn: 29,
      spineStatic: 600,
      shaftGpi: 6.9,
      pointWeightGrains: 100,
      diameter: 0.0058,
      vaneLengthIn: 1.75,
      vaneProfile: 'low',
      drawWeightLbs: 40,
      braceHeightIn: 8.75,
      focPercent: 11
    }
  },
  barebowField: {
    label: 'Barebow / field',
    values: {
      setupName: 'Barebow / field',
      bowType: 'barebow_field',
      releaseType: 'fingers',
      fps: 185,
      poidsGr: 27,
      arrowLengthIn: 30,
      spineStatic: 500,
      pointWeightGrains: 120,
      diameter: 0.0065,
      vaneLengthIn: 2,
      vaneProfile: 'medium',
      drawWeightLbs: 38,
      braceHeightIn: 8.25,
      focPercent: 13
    }
  },
  compoundHunting: {
    label: 'Compound / hunting',
    values: {
      setupName: 'Compound / hunting',
      bowType: 'compound_hunting',
      releaseType: 'mechanical',
      fps: 285,
      poidsGr: 29.5,
      arrowLengthIn: 28,
      spineStatic: 340,
      pointWeightGrains: 125,
      insertWeightGrains: 30,
      diameter: 0.0072,
      vaneLengthIn: 2.1,
      vaneProfile: 'high',
      fletchingOrientation: 'helical',
      fletchingAngleDeg: 2,
      drawWeightLbs: 65,
      drawLengthIn: 29,
      letOffPercent: 80,
      camAggressiveness: 0.75,
      focPercent: 14
    }
  }
};

export const appState = {
  savedCurves: [],
  activeTab: 'trajectory2D',
  requestSeq: 0,
  lastResult: null
};
