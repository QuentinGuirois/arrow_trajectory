import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_PARAMS } from '../state.js';
import { normalizeSimulationParams } from '../simulation-params.js';
import { calculateTrajectory3D } from '../trajectory.worker-archery.js';
import {
  POINT_MASS_3D_MODEL_VERSION,
  interpolatePointAtDistance,
  pointDriftM,
  pointHeightM
} from '../util.js';

test('point-mass 3D worker exposes the canonical contract without non-finite values', () => {
  const result = calculateTrajectory3D(DEFAULT_PARAMS);
  const first = result.positions[0];
  const last = result.positions.at(-1);

  assert.equal(result.modelVersion, POINT_MASS_3D_MODEL_VERSION);
  assert.equal(first.modelVersion, POINT_MASS_3D_MODEL_VERSION);
  assert.equal(first.x, 0);
  assert.equal(first.y, 0);
  assert.equal(first.z, DEFAULT_PARAMS.shootingHeight);
  assert.equal(last.z, 0);

  const requiredNumericKeys = [
    'x', 'y', 'z', 'time', 'speedMps', 'fps', 'energyJ',
    'momentum', 'driftM', 'dropM', 're', 'cd'
  ];
  assert.ok(result.positions.every(point => requiredNumericKeys.every(key => Number.isFinite(point[key]))));
  assert.ok(result.positions.every(point => ['low-re', 'transition', 'high-re', 'unknown'].includes(point.aeroRegime)));
  assert.ok(result.positions.every(point => point.aeroConfidence === 'rough'));
  assert.ok(result.positions.every(point => Array.isArray(point.aeroWarnings)));
});

test('crosswind produces lateral drift through y, not an artificial vertical perturbation', () => {
  const calm = calculateTrajectory3D(DEFAULT_PARAMS);
  const crosswindParams = { ...DEFAULT_PARAMS, windSpeedKmh: 18, windDirectionDeg: 90 };
  const crosswind = calculateTrajectory3D({
    params: crosswindParams,
    simulation: normalizeSimulationParams(crosswindParams)
  });

  const calmImpact = calm.positions.at(-1);
  const crosswindImpact = crosswind.positions.at(-1);

  assert.equal(calmImpact.y, 0);
  assert.ok(Math.abs(crosswindImpact.y) > 0.001);
  assert.equal(crosswindImpact.z, 0);
});

test('trajectory helpers keep new and legacy point layouts readable by existing charts', () => {
  const result = calculateTrajectory3D(DEFAULT_PARAMS);
  const interpolated = interpolatePointAtDistance(result.positions, 10);
  const legacyPoint = { x: 10, y: 1.25, z: -0.04 };

  assert.equal(interpolated.modelVersion, POINT_MASS_3D_MODEL_VERSION);
  assert.equal(pointHeightM(interpolated), interpolated.z);
  assert.equal(pointDriftM(interpolated), interpolated.y);
  assert.equal(pointHeightM(legacyPoint), legacyPoint.y);
  assert.equal(pointDriftM(legacyPoint), legacyPoint.z);
});
