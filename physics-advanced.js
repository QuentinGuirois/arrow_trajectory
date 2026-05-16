// physics-advanced.js
// Constantes et sous-modèles physiques avancés. Les coefficients aérodynamiques sont documentés comme simplifiés.

import { fpsToMetersPerSecond, kmhToMps, clamp, degreesToRadians } from './units.js';

export const PHYSICS_CONSTANTS = {
  gravity: 9.80665,
  airGasDry: 287.058,
  airGasVapor: 461.495,
  airViscosity: 1.81e-5
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
  // Convention globale : x avant, y latéral, z vertical.
  const speed = kmhToMps(params.windSpeedKmh);
  const rad = degreesToRadians(params.windDirectionDeg);
  const gust = 1 + clamp(params.gustPercent, 0, 80) / 200;
  return {
    x: -Math.cos(rad) * speed * gust,
    y: -Math.sin(rad) * speed * gust,
    z: 0
  };
}

export function computeAdvancedCd(params, arrow, relativeSpeed, aoaRad, airDensity = 1.2) {
  // Cd simplifié: Reynolds plus correct (rho * v * D / mu), puis facteurs empiriques bornés.
  const reynolds = Math.max(15000, airDensity * relativeSpeed * arrow.diameterM / PHYSICS_CONSTANTS.airViscosity);
  const reynoldsFactor = clamp(1.08 - Math.log10(reynolds / 50000) * 0.08, 0.82, 1.18);
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

export function buildInitialVelocity(params, launch) {
  const speed = fpsToMetersPerSecond(launch.fps);
  const pitch = degreesToRadians(params.angleDeg);
  const lateralMps = params.releaseErrorLateralMm * 0.015;
  return {
    x: speed * Math.cos(pitch),
    y: lateralMps,
    z: speed * Math.sin(pitch) + params.releaseErrorVerticalMm * 0.015
  };
}
