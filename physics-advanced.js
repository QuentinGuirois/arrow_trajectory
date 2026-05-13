// physics-advanced.js
// Constantes et sous-modèles physiques avancés. Les coefficients aérodynamiques sont documentés comme simplifiés.

import { fpsToMetersPerSecond, kmhToMps, clamp } from './units.js';

export const PHYSICS_CONSTANTS = {
  gravity: 9.80665,
  airGasDry: 287.058,
  airGasVapor: 461.495,
  airViscosity: 1.81e-5,
  lbfInToJoule: 0.112984829
};

export function calculateAirDensityAdvanced(params) {
  const tempK = params.temperatureCelsius + 273.15;
  const altitudeFactor = Math.pow(Math.max(0.2, 1 - 2.25577e-5 * params.altitudeM), 5.25588);
  const pressurePa = params.pressureHpa * 100 * altitudeFactor;
  const saturationPa = 610.94 * Math.exp((17.625 * params.temperatureCelsius) / (params.temperatureCelsius + 243.04));
  const vaporPa = clamp(params.humidityPercent, 0, 100) / 100 * saturationPa;
  const dryPa = pressurePa - vaporPa;
  return dryPa / (PHYSICS_CONSTANTS.airGasDry * tempK) + vaporPa / (PHYSICS_CONSTANTS.airGasVapor * tempK);
}

export function windVector(params) {
  const speed = kmhToMps(params.windSpeedKmh);
  const rad = params.windDirectionDeg * Math.PI / 180;
  const gust = 1 + clamp(params.gustPercent, 0, 80) / 200;
  return {
    x: -Math.cos(rad) * speed * gust,
    y: 0,
    z: -Math.sin(rad) * speed * gust
  };
}

export function computeAdvancedCd(params, arrow, relativeSpeed, aoaRad) {
  const reynoldsProxy = Math.max(15000, relativeSpeed * arrow.diameterM / PHYSICS_CONSTANTS.airViscosity);
  const reynoldsFactor = clamp(1.08 - Math.log10(reynoldsProxy / 50000) * 0.08, 0.82, 1.18);
  const shaftBase = 0.78;
  const diameterFactor = clamp(arrow.diameterM / 0.0065, 0.75, 1.35);
  const vaneFactor = 0.08 * arrow.vaneDragFactor;
  const fletchAngleFactor = params.fletchingOrientation === 'helical'
    ? 0.08 + params.fletchingAngleDeg * 0.018
    : params.fletchingOrientation === 'offset'
      ? 0.04 + params.fletchingAngleDeg * 0.012
      : 0;
  const aoaFactor = clamp(1 + Math.abs(aoaRad) * 4.5, 1, 1.6);
  return (shaftBase * diameterFactor + vaneFactor + fletchAngleFactor) * reynoldsFactor * aoaFactor;
}

export function estimateLaunchFromForceCurve(params, arrow) {
  const efficiency = params.bowType.startsWith('compound') ? 0.82 : 0.72;
  let storedEnergyJ;

  if (params.forceProfile === 'points') {
    const pts = [
      [params.forcePoint1DrawIn, params.forcePoint1Lbs],
      [params.forcePoint2DrawIn, params.forcePoint2Lbs],
      [params.forcePoint3DrawIn, params.forcePoint3Lbs]
    ].sort((a, b) => a[0] - b[0]);
    storedEnergyJ = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = Math.max(0, pts[i][0] - pts[i - 1][0]);
      const avgForce = (pts[i][1] + pts[i - 1][1]) / 2;
      storedEnergyJ += dx * avgForce * PHYSICS_CONSTANTS.lbfInToJoule;
    }
  } else {
    const drawIn = Math.max(10, params.drawLengthIn - params.braceHeightIn);
    const shapeFactor = params.bowType.startsWith('compound')
      ? 0.72 + params.camAggressiveness * 0.08
      : 0.52;
    storedEnergyJ = drawIn * params.drawWeightLbs * shapeFactor * PHYSICS_CONSTANTS.lbfInToJoule;
  }

  const speedMps = Math.sqrt(Math.max(0, 2 * storedEnergyJ * efficiency / arrow.totalMassKg));
  return {
    fps: speedMps / 0.3048,
    storedEnergyJ,
    note: 'Mode expérimental: la courbe force-allonge sert uniquement à dériver la vitesse de sortie.'
  };
}

export function buildInitialVelocity(params, launch) {
  const speed = fpsToMetersPerSecond(launch.fps);
  const pitch = params.angleDeg * Math.PI / 180;
  const lateralSign = params.handedness === 'left' ? -1 : 1;
  const lateralMps = lateralSign * params.releaseErrorLateralMm * 0.015;
  return {
    x: speed * Math.cos(pitch),
    y: speed * Math.sin(pitch) + params.releaseErrorVerticalMm * 0.015,
    z: lateralMps
  };
}
