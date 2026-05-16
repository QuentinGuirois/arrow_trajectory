import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CONSERVATIVE_FALLBACK_CD,
  calculateAirDensity,
  calculateDynamicViscosity,
  calculateReynoldsNumber,
  getDragCoefficient
} from '../aero-models.js';

test('aero helpers expose density, viscosity and Reynolds with stable SI units', () => {
  const rho = calculateAirDensity(20, 1013.25);
  const mu20 = calculateDynamicViscosity(20);
  const mu30 = calculateDynamicViscosity(30);
  const re = calculateReynoldsNumber({
    rho,
    speedMps: 60,
    diameterM: 0.007,
    mu: mu20
  });

  assert.ok(Math.abs(rho - 1.204) < 0.002);
  assert.ok(mu20 > 1.7e-5 && mu20 < 1.9e-5);
  assert.ok(mu30 > mu20);
  assert.ok(re > 25000 && re < 30000);
});

test('conservative drag model stays explicit about rough confidence and transition warnings', () => {
  const result = getDragCoefficient({ re: 50000 });

  assert.equal(result.cd, CONSERVATIVE_FALLBACK_CD);
  assert.equal(result.regime, 'transition');
  assert.equal(result.confidence, 'rough');
  assert.deepEqual(result.warnings, ['Zone de transition aérodynamique : Cd plus incertain.']);
});
