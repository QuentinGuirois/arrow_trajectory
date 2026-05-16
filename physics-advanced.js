// physics-advanced.js
// Constantes et sous-modèles physiques avancés hors modèle Cd dédié.

import { fpsToMetersPerSecond, kmhToMps, clamp, degreesToRadians } from './units.js';
import {
  calculateDynamicViscosity,
  calculateReynoldsNumber,
  getDragCoefficient
} from './aero-models.js';

export const PHYSICS_CONSTANTS = {
  gravity: 9.80665,
  airGasDry: 287.058,
  airGasVapor: 461.495,
  // Référence legacy conservée pour les imports historiques ; le calcul courant
  // passe par `calculateDynamicViscosity(tempC)` dans `aero-models.js`.
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
  // Adaptateur temporaire : les anciens imports continuent de fonctionner,
  // mais la décision Cd vit désormais dans `aero-models.js`.
  const mu = calculateDynamicViscosity(params?.temperatureCelsius ?? 20);
  const re = calculateReynoldsNumber({
    rho: airDensity,
    speedMps: relativeSpeed,
    diameterM: arrow?.diameterM,
    mu
  });
  return getDragCoefficient({
    re,
    attackAngleDeg: aoaRad * 180 / Math.PI,
    model: 'conservative'
  }).cd;
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
