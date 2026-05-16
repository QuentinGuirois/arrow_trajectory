// simulation-params.js
// Frontière d'entrée physique : convertit les paramètres historiques du formulaire
// vers un contrat SI stable sans encore imposer ce format à tout le moteur.

import { buildArrow } from './arrow-builder.js';
import { resolveLaunch } from './calibration.js';
import {
  PHYSICS_CONSTANTS,
  calculateAirDensityAdvanced,
  windVector
} from './physics-advanced.js';
import { DEFAULT_PARAMS } from './state.js';
import {
  cmToMeters,
  degreesToRadians,
  finiteOr,
  hPaToPascals,
  kmhToMps,
  metersToMillimeters,
  mmToMeters,
  pascalsToHPa,
  radiansToDegrees
} from './units.js';

// Les champs historiques `diameter` et `scopeOffset` existent déjà en SI dans
// l'application, mais d'anciens appels ou hashes peuvent encore fournir 7 mm / 5 cm.
// Ces adaptateurs gardent la migration douce et déterministe.
export function normalizeLegacySimulationParams(input = {}) {
  const merged = { ...DEFAULT_PARAMS, ...input };
  return {
    ...merged,
    fps: finiteNumber(merged.fps, DEFAULT_PARAMS.fps),
    angleDeg: resolveAngleDeg(input, merged),
    shootingHeight: finiteNumber(
      input.heightM ?? input.shootingHeight ?? merged.shootingHeight,
      DEFAULT_PARAMS.shootingHeight
    ),
    scopeOffset: resolveSightOffsetM(input, merged),
    scopeAngleDeg: resolveSightAngleDeg(input, merged),
    poidsGr: finiteNumber(merged.poidsGr, DEFAULT_PARAMS.poidsGr),
    diameter: resolveDiameterM(input, merged),
    arrowLengthIn: finiteNumber(merged.arrowLengthIn, DEFAULT_PARAMS.arrowLengthIn),
    pressureHpa: resolvePressureHpa(input, merged),
    temperatureCelsius: finiteNumber(
      input.temperatureC ?? input.temperatureCelsius ?? merged.temperatureCelsius,
      DEFAULT_PARAMS.temperatureCelsius
    ),
    windSpeedKmh: finiteNumber(merged.windSpeedKmh, DEFAULT_PARAMS.windSpeedKmh),
    windDirectionDeg: finiteNumber(merged.windDirectionDeg, DEFAULT_PARAMS.windDirectionDeg)
  };
}

export function normalizeSimulationParams(input = {}, precomputed = {}) {
  const params = normalizeLegacySimulationParams(input);
  const arrow = precomputed.arrow ?? buildArrow(params);
  const launch = precomputed.launch ?? resolveLaunch(params);
  const wind = windVector(params);

  return {
    launch: {
      // m/s, rad, m, m, rad
      speedMps: launch.speedMps,
      angleRad: degreesToRadians(params.angleDeg),
      heightM: params.shootingHeight,
      sightOffsetM: params.scopeOffset,
      sightAngleRad: degreesToRadians(params.scopeAngleDeg)
    },
    arrow: {
      // kg, grains, m, m, m²
      massKg: arrow.totalMassKg,
      massGrains: arrow.totalMassGrains,
      diameterM: arrow.diameterM,
      lengthM: arrow.lengthM,
      frontalAreaM2: arrow.frontalAreaM2
    },
    atmosphere: {
      // °C, Pa, kg/m³, Pa·s
      temperatureC: params.temperatureCelsius,
      pressurePa: hPaToPascals(params.pressureHpa),
      densityKgM3: calculateAirDensityAdvanced(params),
      dynamicViscosityPaS: PHYSICS_CONSTANTS.airViscosity
    },
    wind: {
      // `speedMps` est la vitesse météo de base ; `vectorMps` inclut la rafale simplifiée existante.
      speedMps: kmhToMps(params.windSpeedKmh),
      directionDeg: params.windDirectionDeg,
      vectorMps: wind
    },
    raw: {
      // Valeurs proches du formulaire historique, utiles pour affichage/debug/partage.
      fps: finiteNumber(input.fps ?? params.fps, DEFAULT_PARAMS.fps),
      poidsGr: finiteNumber(input.poidsGr ?? params.poidsGr, DEFAULT_PARAMS.poidsGr),
      diameterMm: resolveRawDiameterMm(input, params)
    }
  };
}

function finiteNumber(value, fallback) {
  const numeric = typeof value === 'number' ? value : Number(value);
  return finiteOr(numeric, fallback);
}

function resolveDiameterM(input, merged) {
  if (Number.isFinite(input.diameterM)) return input.diameterM;
  if (Number.isFinite(input.diameterMm)) return mmToMeters(input.diameterMm);
  const diameter = finiteNumber(merged.diameter, DEFAULT_PARAMS.diameter);
  return diameter > 0.05 ? mmToMeters(diameter) : diameter;
}

function resolveRawDiameterMm(input, params) {
  if (Number.isFinite(input.diameterMm)) return input.diameterMm;
  if (Number.isFinite(input.diameter) && input.diameter > 0.05) return input.diameter;
  return metersToMillimeters(params.diameter);
}

function resolveSightOffsetM(input, merged) {
  if (Number.isFinite(input.sightOffsetM)) return input.sightOffsetM;
  if (Number.isFinite(input.scopeOffsetM)) return input.scopeOffsetM;
  if (Number.isFinite(input.scopeOffsetCm)) return cmToMeters(input.scopeOffsetCm);
  const scopeOffset = finiteNumber(merged.scopeOffset, DEFAULT_PARAMS.scopeOffset);
  return Math.abs(scopeOffset) >= 1 ? cmToMeters(scopeOffset) : scopeOffset;
}

function resolveAngleDeg(input, merged) {
  if (Number.isFinite(input.angleRad)) return radiansToDegrees(input.angleRad);
  return finiteNumber(merged.angleDeg, DEFAULT_PARAMS.angleDeg);
}

function resolveSightAngleDeg(input, merged) {
  if (Number.isFinite(input.sightAngleRad)) return radiansToDegrees(input.sightAngleRad);
  return finiteNumber(merged.scopeAngleDeg, DEFAULT_PARAMS.scopeAngleDeg);
}

function resolvePressureHpa(input, merged) {
  if (Number.isFinite(input.pressurePa)) return pascalsToHPa(input.pressurePa);
  return finiteNumber(merged.pressureHpa, DEFAULT_PARAMS.pressureHpa);
}
