import test from 'node:test';
import assert from 'node:assert/strict';

import { buildArrow } from '../arrow-builder.js';
import { DEFAULT_PARAMS } from '../state.js';
import { calculateTuningModel } from '../tuning-diagnostics.js';
import { resolveSpineRecommendation } from '../spine-recommendation.js';
import { calculateTrajectory3D } from '../trajectory.worker-archery.js';

function tuningFor(params) {
  return calculateTuningModel(
    { ...params, spineRecommendation: resolveSpineRecommendation(params) },
    buildArrow(params)
  );
}

test('FOC, front mass and total mass all influence bounded tuning inputs', () => {
  const base = { ...DEFAULT_PARAMS, arrowLengthIn: 29, balancePointIn: 17 };
  const frontHeavy = { ...base, pointWeightGrains: 175, insertWeightGrains: 40 };
  const totalHeavy = { ...base, poidsGr: 35 };
  const lowFoc = { ...base, arrowLengthIn: 26, balancePointIn: 14 };

  const baseTune = tuningFor(base);
  const frontTune = tuningFor(frontHeavy);
  const totalTune = tuningFor(totalHeavy);
  const lowFocTune = tuningFor(lowFoc);

  assert.notEqual(frontTune.verticalAmplitudeCm, baseTune.verticalAmplitudeCm);
  assert.notEqual(totalTune.dynamicInputs.massInertiaFactor, baseTune.dynamicInputs.massInertiaFactor);
  assert.ok(lowFocTune.dynamicInputs.focQualityScore < baseTune.dynamicInputs.focQualityScore);
  assert.ok(lowFocTune.verticalAmplitudeCm > baseTune.verticalAmplitudeCm);
  assert.ok(lowFocTune.verticalAmplitudeCm <= 5.2);
});

test('porpoising reacts mainly to vertical parameters while fishtailing reacts to lateral and spine mismatch', () => {
  const base = { ...DEFAULT_PARAMS, arrowLengthIn: 29, balancePointIn: 17 };
  const vertical = { ...base, nockingPointOffsetMm: 4 };
  const lateral = { ...base, centerShotMm: 4, releaseErrorLateralMm: 6 };
  const recommendation = resolveSpineRecommendation(base);
  const mismatch = { ...base, spineStatic: recommendation.rangeMax + 180 };

  const baseTune = tuningFor(base);
  const verticalTune = tuningFor(vertical);
  const lateralTune = tuningFor(lateral);
  const mismatchTune = tuningFor(mismatch);

  assert.ok(verticalTune.verticalAmplitudeCm > baseTune.verticalAmplitudeCm);
  assert.ok(lateralTune.lateralAmplitudeCm > baseTune.lateralAmplitudeCm);
  assert.ok(mismatchTune.lateralAmplitudeCm > baseTune.lateralAmplitudeCm);
});

test('changing tuning inputs never changes the ballistic COM trajectory', () => {
  const base = calculateTrajectory3D(DEFAULT_PARAMS);
  const tuned = calculateTrajectory3D({
    ...DEFAULT_PARAMS,
    balancePointIn: 1,
    nockingPointOffsetMm: 6,
    centerShotMm: 6,
    releaseErrorVerticalMm: 8,
    releaseErrorLateralMm: 8
  });

  assert.deepEqual(
    tuned.positions.map(point => [point.x, point.y, point.z]),
    base.positions.map(point => [point.x, point.y, point.z])
  );
});
