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

export function computeCd(plumeType = 'moyenne') {
  switch (plumeType) {
    case 'petite': return 1.5;
    case 'moyenne': return 1.7;
    case 'grande': return 2.0;
    case 'helicoidale': return 2.1;
    default: return 1.7;
  }
}
