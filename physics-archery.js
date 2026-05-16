// physics-archery.js
// Compatibilité avec l’ancien modèle: conversions, énergie et adaptateur Cd legacy.

import {
  calculateAirDensity as calculateDryAirDensity,
  calculateDynamicViscosity,
  calculateReynoldsNumber,
  getDragCoefficient
} from './aero-models.js';

export {
  fpsToMetersPerSecond,
  metersPerSecondToFPS
} from './units.js';

export function calculateEnergy(massKg, velocityMps) {
  return 0.5 * massKg * velocityMps * velocityMps;
}

export { calculateDryAirDensity as calculateAirDensity };

// Adaptateur temporaire pour les anciens appels `computeCd(plumeType, ...)`.
// `plumeType` est accepté mais ignoré : il ne pilote plus la physique.
export function computeCd(_plumeType, diameterM, velocityMps, tempC = 20, pressureHpa = 1013.25) {
  const rho = calculateDryAirDensity(tempC, pressureHpa);
  const mu = calculateDynamicViscosity(tempC);
  const re = calculateReynoldsNumber({
    rho,
    speedMps: velocityMps,
    diameterM,
    mu
  });
  return getDragCoefficient({ re, model: 'conservative' }).cd;
}
