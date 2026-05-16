import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_PARAMS } from '../state.js';
import {
  degreesToRadians,
  fpsToMetersPerSecond,
  gramsToGrains
} from '../units.js';
import {
  normalizeLegacySimulationParams,
  normalizeSimulationParams
} from '../simulation-params.js';

test('normalized simulation contract exposes SI values from current defaults', () => {
  const simulation = normalizeSimulationParams(DEFAULT_PARAMS);

  assert.equal(simulation.launch.speedMps, fpsToMetersPerSecond(DEFAULT_PARAMS.fps));
  assert.equal(simulation.launch.angleRad, degreesToRadians(DEFAULT_PARAMS.angleDeg));
  assert.equal(simulation.launch.heightM, DEFAULT_PARAMS.shootingHeight);
  assert.equal(simulation.arrow.massKg, DEFAULT_PARAMS.poidsGr / 1000);
  assert.equal(simulation.arrow.massGrains, gramsToGrains(DEFAULT_PARAMS.poidsGr));
  assert.equal(simulation.arrow.diameterM, DEFAULT_PARAMS.diameter);
  assert.equal(simulation.atmosphere.pressurePa, DEFAULT_PARAMS.pressureHpa * 100);
  assert.deepEqual(simulation.raw, {
    fps: DEFAULT_PARAMS.fps,
    poidsGr: DEFAULT_PARAMS.poidsGr,
    diameterMm: 7
  });
});

test('legacy form-shaped mm/cm values are normalized without changing behavior', () => {
  const params = normalizeLegacySimulationParams({
    diameter: 7,
    scopeOffset: 5
  });
  const simulation = normalizeSimulationParams({
    diameter: 7,
    scopeOffset: 5
  });

  assert.equal(params.diameter, 0.007);
  assert.equal(params.scopeOffset, 0.05);
  assert.equal(simulation.arrow.diameterM, 0.007);
  assert.equal(simulation.launch.sightOffsetM, 0.05);
  assert.equal(simulation.raw.diameterMm, 7);
});

test('normalized aliases can feed the legacy adapter during migration', () => {
  const params = normalizeLegacySimulationParams({
    diameterMm: 6.2,
    sightOffsetM: 0.045,
    angleRad: Math.PI / 6,
    sightAngleRad: Math.PI / 180,
    pressurePa: 100000,
    temperatureC: 12
  });

  assert.equal(params.diameter, 0.0062);
  assert.equal(params.scopeOffset, 0.045);
  assert.ok(Math.abs(params.angleDeg - 30) < 1e-12);
  assert.ok(Math.abs(params.scopeAngleDeg - 1) < 1e-12);
  assert.equal(params.pressureHpa, 1000);
  assert.equal(params.temperatureCelsius, 12);
});
