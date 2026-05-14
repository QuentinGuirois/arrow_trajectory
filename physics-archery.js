// physics-archery.js
// Compatibilité avec l’ancien modèle: conversions et énergie. Le Cd avancé vit dans physics-advanced.js.

export {
  fpsToMetersPerSecond,
  metersPerSecondToFPS
} from './units.js';

export function calculateEnergy(massKg, velocityMps) {
  return 0.5 * massKg * velocityMps * velocityMps;
}

export function calculateAirDensity(tempC, pHpa) {
  const rSpecific = 287.058;
  const tempK = tempC + 273.15;
  const pressurePa = pHpa * 100;
  return pressurePa / (rSpecific * tempK);
}
