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

const eastonAcAllCarbonCases = [
  {
    name: 'compound 40 lbs / 29 in => 575-500',
    params: {
      bowType: 'compound',
      drawWeightLbs: 40,
      arrowLengthIn: 29,
      pointWeightGrains: 100,
      releaseType: 'mechanical',
      fps: 310
    },
    expectedRecommendedSpinesLabel: '575-500',
    sourceSection: 'A/C • ALL-CARBON ARROW CUT LENGTH',
    sourcePageLabel: '1'
  },
  {
    name: 'compound 70 lbs / 34 in => 200-150',
    params: {
      bowType: 'compound',
      drawWeightLbs: 70,
      arrowLengthIn: 34,
      pointWeightGrains: 100,
      releaseType: 'mechanical',
      fps: 310
    },
    expectedRecommendedSpinesLabel: '200-150',
    sourceSection: 'A/C • ALL-CARBON ARROW CUT LENGTH',
    sourcePageLabel: '1'
  },
  {
    name: 'recurve 21 lbs / 22 in => 2000-1800',
    params: {
      bowType: 'recurve',
      drawWeightLbs: 21,
      arrowLengthIn: 22,
      pointWeightGrains: 100,
      releaseType: 'finger'
    },
    expectedRecommendedSpinesLabel: '2000-1800',
    sourceSection: 'A/C • ALL-CARBON ARROW CUT LENGTH',
    sourcePageLabel: '1'
  },
  {
    name: 'recurve 63 lbs / 31 in => 300-250',
    params: {
      bowType: 'recurve',
      drawWeightLbs: 63,
      arrowLengthIn: 31,
      pointWeightGrains: 100,
      releaseType: 'finger'
    },
    expectedRecommendedSpinesLabel: '300-250',
    sourceSection: 'A/C • ALL-CARBON ARROW CUT LENGTH',
    sourcePageLabel: '1'
  }
];

for (const manualCase of eastonAcAllCarbonCases) {
  test(`Easton A/C all-carbon manual cell: ${manualCase.name}`, () => {
    const result = lookupRecommendedSpine(
      manualCase.params,
      'easton_target_301055A_ac_all_carbon'
    );

    assert.equal(result.confidence, 'table');
    assert.equal(result.recommendedSpinesLabel, manualCase.expectedRecommendedSpinesLabel);
    assert.equal(result.matchedRow.sourceSection, manualCase.sourceSection);
    assert.equal(result.matchedRow.sourcePageLabel, manualCase.sourcePageLabel);
    assert.equal(result.matchedRow.bowType, manualCase.params.bowType);
    assert.equal(result.matchedRow.arrowLengthMinIn, manualCase.params.arrowLengthIn);
    assert.equal(result.matchedRow.arrowLengthMaxIn, manualCase.params.arrowLengthIn);
  });
}

test('Easton A/C all-carbon manual no-data case: compound 40 lbs / 28.5 in => "" on page 1', () => {
  const manualCase = {
    params: {
      bowType: 'compound',
      drawWeightLbs: 40,
      arrowLengthIn: 28.5,
      pointWeightGrains: 100,
      releaseType: 'mechanical',
      fps: 310
    },
    expectedRecommendedSpinesLabel: '',
    sourceSection: 'A/C • ALL-CARBON ARROW CUT LENGTH',
    sourcePageLabel: '1'
  };

  const result = lookupRecommendedSpine(
    manualCase.params,
    'easton_target_301055A_ac_all_carbon'
  );

  assert.equal(result.confidence, 'no-data');
  assert.deepEqual(result.recommendedSpines, []);
  assert.equal(result.recommendedSpinesLabel, manualCase.expectedRecommendedSpinesLabel);
  assert.equal(result.matchedRow, null);
});

test('Easton compound open lower band: 16.9 lbs matches printed <17 row', () => {
  const result = lookupRecommendedSpine(
    {
      bowType: 'compound',
      drawWeightLbs: 16.9,
      arrowLengthIn: 21,
      pointWeightGrains: 100,
      releaseType: 'mechanical',
      fps: 310
    },
    'easton_target_301055A_ac_all_carbon'
  );

  assert.equal(result.confidence, 'table');
  assert.equal(result.recommendedSpinesLabel, '2000');
  assert.equal(result.matchedRow.drawWeightLabel, '<17');
  assert.equal(result.matchedRow.drawWeightMaxExclusive, true);
});

test('Easton compound open lower band: 17.0 lbs does not match <17 and matches next printed row', () => {
  const result = lookupRecommendedSpine(
    {
      bowType: 'compound',
      drawWeightLbs: 17,
      arrowLengthIn: 21,
      pointWeightGrains: 100,
      releaseType: 'mechanical',
      fps: 310
    },
    'easton_target_301055A_ac_all_carbon'
  );

  assert.equal(result.confidence, 'table');
  assert.equal(result.recommendedSpinesLabel, '2000');
  assert.equal(result.matchedRow.drawWeightLabel, '17-23');
  assert.equal(result.matchedRow.drawWeightMaxExclusive, false);
});

test('Easton recurve open lower band: 19.9 lbs matches printed <20 lbs. row', () => {
  const result = lookupRecommendedSpine(
    {
      bowType: 'recurve',
      drawWeightLbs: 19.9,
      arrowLengthIn: 21,
      pointWeightGrains: 100,
      releaseType: 'finger'
    },
    'easton_target_301055A_ac_all_carbon'
  );

  assert.equal(result.confidence, 'table');
  assert.equal(result.recommendedSpinesLabel, '2000');
  assert.equal(result.matchedRow.drawWeightLabel, '<20 lbs.');
  assert.equal(result.matchedRow.drawWeightMaxExclusive, true);
});

test('Easton recurve open lower band: 20.0 lbs does not match <20 lbs. and returns no-data', () => {
  const result = lookupRecommendedSpine(
    {
      bowType: 'recurve',
      drawWeightLbs: 20,
      arrowLengthIn: 21,
      pointWeightGrains: 100,
      releaseType: 'finger'
    },
    'easton_target_301055A_ac_all_carbon'
  );

  assert.equal(result.confidence, 'no-data');
  assert.equal(result.recommendedSpinesLabel, '');
  assert.equal(result.matchedRow, null);
});
