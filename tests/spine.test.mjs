import test from 'node:test';
import assert from 'node:assert/strict';

import { lookupRecommendedSpine } from '../spine-lookup.js';
import { compareSpineStiffness, getSpineQualitativeTrends } from '../spine-trends.js';

test('lookup on metadata-only table returns no-data', () => {
  const result = lookupRecommendedSpine({}, 'easton_target');
  assert.equal(result.confidence, 'no-data');
  assert.deepEqual(result.recommendedSpines, []);
  assert.equal(result.matchedRow, null);
});

test('340 is stiffer than 500', () => {
  assert.equal(compareSpineStiffness(340, 500), 'stiffer');
});

test('700 is softer than 500', () => {
  assert.equal(compareSpineStiffness(700, 500), 'softer');
});

test('heavier front weight adds a softer dynamic trend', () => {
  const trends = getSpineQualitativeTrends({
    pointWeightGrains: 125,
    insertWeightGrains: 20,
    reference: {
      pointWeightGrains: 100,
      insertWeightGrains: 20
    }
  });

  assert.ok(trends.some(trend => trend.includes('plus souple dynamiquement')));
});

test('shorter arrow adds a stiffer dynamic trend', () => {
  const trends = getSpineQualitativeTrends({
    arrowLengthIn: 28,
    reference: {
      arrowLengthIn: 29
    }
  });

  assert.ok(trends.some(trend => trend.includes('plus raide dynamiquement')));
});
