// units.js
// Conversions et helpers numériques centralisés pour éviter les unités implicites.
// Convention : chaque fonction nomme explicitement son unité source et son unité cible.

export const GRAINS_PER_GRAM = 15.4323584;
export const FPS_TO_MPS = 0.3048;
export const INCH_TO_M = 0.0254;
export const INCH_TO_MM = 25.4;
export const HPA_TO_PA = 100;

export function fpsToMetersPerSecond(fps) {
  return fps * FPS_TO_MPS;
}

export function metersPerSecondToFPS(mps) {
  return mps / FPS_TO_MPS;
}

export function grainsToGrams(grains) {
  return grains / GRAINS_PER_GRAM;
}

export function gramsToGrains(grams) {
  return grams * GRAINS_PER_GRAM;
}

export function inchesToMeters(inches) {
  return inches * INCH_TO_M;
}

export function metersToInches(meters) {
  return meters / INCH_TO_M;
}

export function inchesToMillimeters(inches) {
  return inches * INCH_TO_MM;
}

export function millimetersToInches(mm) {
  return mm / INCH_TO_MM;
}

export function mmToMeters(mm) {
  return mm / 1000;
}

export function metersToMillimeters(meters) {
  return meters * 1000;
}

export function cmToMeters(cm) {
  return cm / 100;
}

export function metersToCentimeters(meters) {
  return meters * 100;
}

export function hPaToPascals(hPa) {
  return hPa * HPA_TO_PA;
}

export function pascalsToHPa(pa) {
  return pa / HPA_TO_PA;
}

export function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}

export function radiansToDegrees(radians) {
  return radians * 180 / Math.PI;
}

export function kmhToMps(kmh) {
  return kmh / 3.6;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function finiteOr(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

export function readNumber(id, fallback = 0) {
  const el = document.getElementById(id);
  if (!el) return fallback;
  const value = parseFloat(el.value);
  return Number.isFinite(value) ? value : fallback;
}

export function readBool(id) {
  return Boolean(document.getElementById(id)?.checked);
}

export function formatNumber(value, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : 'n/a';
}
