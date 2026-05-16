import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  lookupRecommendedSpine,
  lookupRecommendedSpineForUser,
  lookupManufacturerSpineForUser
} from '../spine-lookup.js';
import { getGeneralizedSpineEstimate } from '../spine-generalized.js';
import { resolveSpineRecommendation } from '../spine-recommendation.js';
import {
  compareCurrentSpineToRecommendation,
  compareCurrentSpineToRange,
  computeSpineMismatch
} from '../spine-evaluation.js';
import { translateSpineStatusFr } from '../spine-display.js';
import { compareSpineStiffness, getSpineQualitativeTrends } from '../spine-trends.js';
import { buildArrow } from '../arrow-builder.js';
import {
  calculateTuningModel,
  computeDynamicTuningInputs
} from '../tuning-diagnostics.js';
import { DEFAULT_PARAMS } from '../state.js';
import { resolveEffectiveDrawWeight } from '../draw-weight.js';

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

test('Victory strict lookup keeps compound charts separated and returns verified cells', () => {
  const vf = lookupRecommendedSpine(
    {
      bowType: 'compound',
      drawWeightLbs: 42,
      arrowLengthIn: 29,
      fps: 320
    },
    'victory_vf_rip_xv_rvl_spine_chart'
  );
  const hlr = lookupRecommendedSpine(
    {
      bowType: 'compound',
      drawWeightLbs: 79,
      arrowLengthIn: 28,
      fps: 320
    },
    'victory_hlr_vlr_vap_family_spine_chart'
  );

  assert.equal(vf.confidence, 'table');
  assert.equal(vf.recommendedSpinesLabel, '500');
  assert.equal(hlr.confidence, 'table');
  assert.equal(hlr.recommendedSpinesLabel, '250/235');
});

test('Victory strict lookup returns verified recurve cells and no-data outside partial transcription', () => {
  const first = lookupRecommendedSpine(
    {
      bowType: 'recurve',
      drawWeightLbs: 40,
      arrowLengthIn: 29,
      pointWeightGrains: 100
    },
    'victory_recurve_spine_chart'
  );
  const second = lookupRecommendedSpine(
    {
      bowType: 'recurve',
      drawWeightLbs: 52,
      arrowLengthIn: 30,
      pointWeightGrains: 125
    },
    'victory_recurve_spine_chart'
  );
  const outsidePartialRows = lookupRecommendedSpine(
    {
      bowType: 'recurve',
      drawWeightLbs: 40,
      arrowLengthIn: 28,
      pointWeightGrains: 100
    },
    'victory_recurve_spine_chart'
  );

  assert.equal(first.recommendedSpinesLabel, '500');
  assert.equal(second.recommendedSpinesLabel, '400');
  assert.equal(outsidePartialRows.confidence, 'no-data');
});

test('Carbon Express strict lookup returns hunting and target cells while adjustment chart stays non-direct', () => {
  const hunting = lookupRecommendedSpine(
    {
      bowType: 'recurve',
      drawWeightLbs: 40,
      arrowLengthIn: 29
    },
    'carbonexpress_hunting_shaft_selection'
  );
  const target = lookupRecommendedSpine(
    {
      bowType: 'recurve',
      drawWeightLbs: 24,
      arrowLengthIn: 29
    },
    'carbonexpress_target_arrow_selection'
  );
  const adjustmentOnly = lookupRecommendedSpine(
    {
      bowType: 'compound',
      drawWeightLbs: 40,
      arrowLengthIn: 29
    },
    'carbonexpress_adjustable_weight_chart'
  );

  assert.equal(hunting.recommendedSpinesLabel, '500 / XSD 500');
  assert.equal(target.recommendedSpinesLabel, 'XB700');
  assert.equal(adjustmentOnly.confidence, 'no-data');
});

test('Carbon Express strict lookup returns trispine verified rows and no-data outside partial transcription', () => {
  const first = lookupRecommendedSpine(
    {
      bowType: 'compound',
      drawWeightLbs: 40,
      arrowLengthIn: 29
    },
    'carbonexpress_hunting_trispine_shaft_selection'
  );
  const second = lookupRecommendedSpine(
    {
      bowType: 'compound',
      drawWeightLbs: 48,
      arrowLengthIn: 32
    },
    'carbonexpress_hunting_trispine_shaft_selection'
  );
  const noData = lookupRecommendedSpine(
    {
      bowType: 'compound',
      drawWeightLbs: 40,
      arrowLengthIn: 28
    },
    'carbonexpress_hunting_trispine_shaft_selection'
  );

  assert.equal(first.recommendedSpinesLabel, '400 / SD 400 / TR 400');
  assert.equal(second.recommendedSpinesLabel, '350 / SD 350 / TR350');
  assert.equal(noData.confidence, 'no-data');
});

test('Carbon Express user lookup does not apply compound adjusted-weight rules implicitly', () => {
  const rawCompoundInput = lookupRecommendedSpineForUser(
    {
      bowType: 'compound',
      drawWeightLbs: 40,
      arrowLengthIn: 29
    },
    'carbonexpress_hunting_trispine_shaft_selection'
  );

  assert.equal(rawCompoundInput.confidence, 'no-data');
});

test('Gold Tip numeric charts are usable where manually verified', () => {
  const compound = lookupRecommendedSpine(
    {
      bowType: 'compound',
      drawWeightLbs: 40,
      arrowLengthIn: 29,
      pointWeightGrains: 100,
      fps: 320
    },
    'goldtip_compound_315_plus'
  );
  const recurve = lookupRecommendedSpine(
    {
      bowType: 'recurve',
      drawWeightLbs: 40,
      arrowLengthIn: 29,
      pointWeightGrains: 100
    },
    'goldtip_recurve'
  );

  assert.equal(compound.recommendedSpinesLabel, '400');
  assert.equal(recurve.recommendedSpinesLabel, '500');
});

test('Easton user lookup rounds documented fractional lengths but strict lookup remains exact', () => {
  const strict = lookupRecommendedSpine(
    {
      bowType: 'compound',
      drawWeightLbs: 40,
      arrowLengthIn: 28.5,
      pointWeightGrains: 100,
      releaseType: 'mechanical',
      fps: 310
    },
    'easton_target_301055A_ac_all_carbon'
  );
  const userExact = lookupRecommendedSpineForUser(
    {
      bowType: 'compound',
      drawWeightLbs: 40,
      arrowLengthIn: 29,
      pointWeightGrains: 100,
      releaseType: 'mechanical',
      fps: 310
    },
    'easton_target_301055A_ac_all_carbon'
  );
  const userAbove = lookupRecommendedSpineForUser(
    {
      bowType: 'compound',
      drawWeightLbs: 40,
      arrowLengthIn: 29.1,
      pointWeightGrains: 100,
      releaseType: 'mechanical',
      fps: 310
    },
    'easton_target_301055A_ac_all_carbon'
  );
  const userBelow = lookupRecommendedSpineForUser(
    {
      bowType: 'compound',
      drawWeightLbs: 40,
      arrowLengthIn: 28.9,
      pointWeightGrains: 100,
      releaseType: 'mechanical',
      fps: 310
    },
    'easton_target_301055A_ac_all_carbon'
  );
  const userHalf = lookupRecommendedSpineForUser(
    {
      bowType: 'compound',
      drawWeightLbs: 40,
      arrowLengthIn: 28.5,
      pointWeightGrains: 100,
      releaseType: 'mechanical',
      fps: 310
    },
    'easton_target_301055A_ac_all_carbon'
  );

  assert.equal(strict.confidence, 'no-data');
  assert.equal(userExact.recommendedSpinesLabel, '575-500');
  assert.equal(userAbove.recommendedSpinesLabel, '575-500');
  assert.equal(userBelow.recommendedSpinesLabel, '575-500');
  assert.equal(userHalf.recommendedSpinesLabel, '575-500');
  assert.equal(userAbove.resolvedInputs.chartArrowLengthIn, 29);
});

test('Easton user lookup matches intermediate draw weight and refuses extrapolation beyond chart columns', () => {
  const intermediate = lookupRecommendedSpineForUser(
    {
      bowType: 'compound',
      drawWeightLbs: 40.5,
      arrowLengthIn: 29,
      pointWeightGrains: 100,
      releaseType: 'mechanical',
      fps: 310
    },
    'easton_target_301055A_ac_all_carbon'
  );
  const tooShort = lookupRecommendedSpineForUser(
    {
      bowType: 'compound',
      drawWeightLbs: 40,
      arrowLengthIn: 20.4,
      pointWeightGrains: 100,
      releaseType: 'mechanical',
      fps: 310
    },
    'easton_target_301055A_ac_all_carbon'
  );
  const tooLong = lookupRecommendedSpineForUser(
    {
      bowType: 'compound',
      drawWeightLbs: 40,
      arrowLengthIn: 34.6,
      pointWeightGrains: 100,
      releaseType: 'mechanical',
      fps: 310
    },
    'easton_target_301055A_ac_all_carbon'
  );
  const nearUpper = lookupRecommendedSpineForUser(
    {
      bowType: 'compound',
      drawWeightLbs: 70,
      arrowLengthIn: 34.4,
      pointWeightGrains: 100,
      releaseType: 'mechanical',
      fps: 310
    },
    'easton_target_301055A_ac_all_carbon'
  );

  assert.equal(intermediate.recommendedSpinesLabel, '575-500');
  assert.equal(intermediate.resolvedInputs.matchedDrawWeightRangeLabel, '40-44');
  assert.equal(nearUpper.recommendedSpinesLabel, '200-150');
  assert.equal(nearUpper.resolvedInputs.chartArrowLengthIn, 34);
  assert.equal(tooShort.confidence, 'no-data');
  assert.equal(tooLong.confidence, 'no-data');
});

test('Easton user lookup preserves open-bound behavior', () => {
  const compoundBelow = lookupRecommendedSpineForUser(
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
  const compoundAt = lookupRecommendedSpineForUser(
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
  const recurveBelow = lookupRecommendedSpineForUser(
    {
      bowType: 'recurve',
      drawWeightLbs: 19.9,
      arrowLengthIn: 21,
      pointWeightGrains: 100,
      releaseType: 'finger'
    },
    'easton_target_301055A_ac_all_carbon'
  );
  const recurveAt = lookupRecommendedSpineForUser(
    {
      bowType: 'recurve',
      drawWeightLbs: 20,
      arrowLengthIn: 21,
      pointWeightGrains: 100,
      releaseType: 'finger'
    },
    'easton_target_301055A_ac_all_carbon'
  );

  assert.equal(compoundBelow.matchedRow.drawWeightLabel, '<17');
  assert.equal(compoundAt.matchedRow.drawWeightLabel, '17-23');
  assert.equal(recurveBelow.matchedRow.drawWeightLabel, '<20 lbs.');
  assert.equal(recurveAt.confidence, 'no-data');
});

test('generalized spine uses several integrated manufacturers and keeps an indicative fallback outside exact shared coverage', () => {
  const available = getGeneralizedSpineEstimate({
    bowType: 'recurve',
    drawWeightLbs: 40,
    arrowLengthIn: 29,
    pointWeightGrains: 100,
    releaseType: 'finger',
    fps: 310
  });
  const fallback = getGeneralizedSpineEstimate({
    bowType: 'compound',
    drawWeightLbs: 100,
    arrowLengthIn: 34,
    pointWeightGrains: 100,
    releaseType: 'mechanical',
    fps: 320
  });

  assert.equal(available.status, 'available');
  assert.equal(typeof available.suggestedSpine, 'number');
  assert.ok(available.rangeLabel.length > 0);
  assert.ok(available.sourceManufacturers.includes('Easton'));
  assert.ok(available.sourceManufacturers.includes('Victory Archery'));
  assert.ok(available.sourceManufacturers.includes('Carbon Express'));
  assert.equal(fallback.status, 'available');
  assert.equal(fallback.basis, 'nearest');
});

test('strict manufacturer lookup stays distinct from generalized estimate', () => {
  const manufacturer = lookupRecommendedSpine(
    {
      bowType: 'recurve',
      drawWeightLbs: 40,
      arrowLengthIn: 29,
      pointWeightGrains: 100,
      releaseType: 'finger'
    },
    'easton_target_301055A_ac_all_carbon'
  );
  const generalized = getGeneralizedSpineEstimate({
    bowType: 'recurve',
    drawWeightLbs: 40,
    arrowLengthIn: 29,
    pointWeightGrains: 100,
    releaseType: 'finger',
    fps: 310
  });

  assert.equal(manufacturer.recommendedSpinesLabel, '575-500');
  assert.equal(generalized.status, 'available');
  assert.notEqual(generalized.rangeLabel, manufacturer.recommendedSpinesLabel);
});

test('front-facing status mapper stays in French', () => {
  assert.equal(translateSpineStatusFr('manufacturer-table'), 'Table fabricant vérifiée');
  assert.equal(translateSpineStatusFr('no-data'), 'Donnée indisponible');
});

test('advanced arrow UI contains one compact spine reference selector and no separate spine panel', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /Référence spine/);
  assert.match(html, /Spine généralisé/);
  assert.doesNotMatch(html, /<summary>Spine fabricant<\/summary>/);
  assert.doesNotMatch(html, /id="spinePanel"/);
});

test('default generalized spine returns an available suggestion and current range', () => {
  const result = getGeneralizedSpineEstimate(DEFAULT_PARAMS);
  assert.equal(result.status, 'available');
  assert.equal(typeof result.suggestedSpine, 'number');
  assert.ok(result.rangeLabel.length > 0);
});

test('current spine comparison follows lower-number-is-stiffer convention', () => {
  assert.deepEqual(compareCurrentSpineToRange(430, 450, 500), {
    status: 'too-stiff',
    label: 'plus raide que la fourchette'
  });
  assert.deepEqual(compareCurrentSpineToRange(600, 450, 500), {
    status: 'too-soft',
    label: 'plus souple que la fourchette'
  });
  assert.deepEqual(compareCurrentSpineToRange(500, 450, 500), {
    status: 'in-range',
    label: 'dans la fourchette'
  });
});

test('spine mismatch exposes direction and severity', () => {
  assert.equal(computeSpineMismatch(430, 475, 450, 500).status, 'too-stiff');
  assert.equal(computeSpineMismatch(600, 475, 450, 500).status, 'too-soft');
  assert.equal(computeSpineMismatch(500, 475, 450, 500).status, 'in-range');
  assert.ok(computeSpineMismatch(430, 475, 450, 500).severity > 0);
  assert.ok(computeSpineMismatch(600, 475, 450, 500).severity > 0);
});

test('spine mismatch increases fishtailing while in-range keeps spine-related risk lower', () => {
  const common = {
    ...DEFAULT_PARAMS,
    bowType: 'recurve',
    arrowLengthIn: 29,
    pointWeightGrains: 100,
    insertWeightGrains: 12,
    spineReference: 'generalized',
    plungerStiffness: 0.5,
    centerShotMm: 0,
    releaseErrorLateralMm: 0,
    nockingPointOffsetMm: 0,
    releaseErrorVerticalMm: 0
  };
  const recommendation = resolveSpineRecommendation(common);
  const arrow = buildArrow(common);
  const inRange = calculateTuningModel(
    {
      ...common,
      spineStatic: recommendation.rangeMax,
      spineRecommendation: recommendation
    },
    arrow
  );
  const tooStiff = calculateTuningModel(
    {
      ...common,
      spineStatic: recommendation.rangeMin - 100,
      spineRecommendation: recommendation
    },
    arrow
  );
  const tooSoft = calculateTuningModel(
    {
      ...common,
      spineStatic: recommendation.rangeMax + 100,
      spineRecommendation: recommendation
    },
    arrow
  );

  assert.ok(tooStiff.lateralAmplitudeCm > inRange.lateralAmplitudeCm);
  assert.ok(tooSoft.lateralAmplitudeCm > inRange.lateralAmplitudeCm);
  assert.equal(inRange.spineMismatch.status, 'in-range');
  assert.equal(tooStiff.spineMismatch.status, 'too-stiff');
  assert.equal(tooSoft.spineMismatch.status, 'too-soft');
  assert.match(tooSoft.diagnostics.find(item => item.label === 'Spine').detail, /plus souple/);
  assert.match(tooStiff.diagnostics.find(item => item.label === 'Spine').detail, /plus raide/);
});

test('advanced mode wiring updates immediately without waiting for the debounced trajectory path', () => {
  const source = readFileSync(new URL('../script-archery.js', import.meta.url), 'utf8');
  assert.match(source, /\$\('uiMode'\)\.addEventListener\('change', handleUiModeChange\)/);
  assert.match(
    source,
    /function handleUiModeChange\(\)\s*{\s*updateConditionalFields\(\);\s*updateSpineRecommendation\(\);\s*updateDerivedPanels\(\);\s*resizeCharts\(\);/s
  );
});

test('visible arc labels are French and release type is no longer exposed', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /Puissance \(lbs\)/);
  assert.match(html, /Allonge \(in\)/);
  assert.match(html, /Spine saisi/);
  assert.match(html, /Référence spine/);
  assert.doesNotMatch(html, /Draw weight/);
  assert.doesNotMatch(html, /Draw length/);
  assert.doesNotMatch(html, /id="releaseType"/);
});

test('changing spine reference does not change physical arrow outputs', () => {
  const common = {
    arrowLengthIn: 29,
    shaftGpi: 7.4,
    vaneCount: 3,
    vaneLengthIn: 1.75,
    vaneProfile: 'medium',
    pointWeightGrains: 100,
    insertWeightGrains: 12,
    nockWeightGrains: 10,
    massMode: 'components',
    poidsGr: 25,
    balancePointIn: 0,
    diameter: 0.007,
    fletchingOrientation: 'straight',
    fletchingAngleDeg: 0
  };
  const generalized = buildArrow({
    ...common,
    spineReference: 'generalized',
    spineStatic: 600
  });
  const easton = buildArrow({
    ...common,
    spineReference: 'easton',
    spineStatic: 340
  });

  assert.equal(generalized.totalMassKg, easton.totalMassKg);
  assert.equal(generalized.lengthM, easton.lengthM);
  assert.equal(generalized.frontalAreaM2, easton.frontalAreaM2);
  assert.equal(generalized.vaneDragFactor, easton.vaneDragFactor);
});

test('effective draw weight uses draw length for recurve/traditional but not for compound', () => {
  const recurve = resolveEffectiveDrawWeight({
    bowType: 'recurve',
    drawWeightLbs: 40,
    drawLengthIn: 30,
    drawWeightBasis: 'at-28'
  });
  const compound = resolveEffectiveDrawWeight({
    bowType: 'compound',
    drawWeightLbs: 40,
    drawLengthIn: 30,
    drawWeightBasis: 'at-28'
  });

  assert.equal(recurve.effectiveDrawWeightLbs, 45);
  assert.equal(compound.effectiveDrawWeightLbs, 40);
});

test('manufacturer recommendations expose numeric ranges for covered user setups', () => {
  const easton = resolveSpineRecommendation({
    ...DEFAULT_PARAMS,
    bowType: 'compound',
    drawWeightLbs: 40,
    drawLengthIn: 29,
    drawWeightBasis: 'actual',
    arrowLengthIn: 29.1,
    pointWeightGrains: 100,
    fps: 310,
    spineReference: 'easton'
  });
  const victory = resolveSpineRecommendation({
    ...DEFAULT_PARAMS,
    bowType: 'recurve',
    drawWeightLbs: 40,
    drawWeightBasis: 'actual',
    arrowLengthIn: 29.1,
    pointWeightGrains: 100,
    spineReference: 'victory'
  });
  const carbonExpress = resolveSpineRecommendation({
    ...DEFAULT_PARAMS,
    bowType: 'recurve',
    drawWeightLbs: 40,
    drawWeightBasis: 'actual',
    arrowLengthIn: 29.1,
    pointWeightGrains: 100,
    spineReference: 'carbonexpress'
  });

  assert.equal(easton.status, 'available');
  assert.equal(easton.rangeMin, 500);
  assert.equal(easton.rangeMax, 575);
  assert.equal(victory.status, 'available');
  assert.equal(victory.rangeMin, 500);
  assert.equal(victory.rangeMax, 500);
  assert.equal(carbonExpress.status, 'available');
  assert.ok(Number.isFinite(carbonExpress.rangeMin));
  assert.ok(Number.isFinite(carbonExpress.rangeMax));
});

test('manufacturer lookup returns unavailable only when setup is outside covered table area', () => {
  const outside = resolveSpineRecommendation({
    ...DEFAULT_PARAMS,
    bowType: 'compound',
    drawWeightLbs: 120,
    drawWeightBasis: 'actual',
    arrowLengthIn: 36,
    pointWeightGrains: 100,
    fps: 310,
    spineReference: 'easton'
  });

  assert.equal(outside.status, 'unavailable');
});

test('generic user lookup snaps non-Easton lengths to the nearest in-range column', () => {
  const victory = lookupManufacturerSpineForUser(
    {
      bowType: 'recurve',
      drawWeightLbs: 40,
      arrowLengthIn: 29.1,
      pointWeightGrains: 100
    },
    'victory_recurve_spine_chart'
  );

  assert.equal(victory.confidence, 'manufacturer-table');
  assert.equal(victory.resolvedInputs.chartArrowLengthIn, 29);
});

test('generalized recommendation reacts to draw length through effective draw weight', () => {
  const shortDraw = resolveSpineRecommendation({
    ...DEFAULT_PARAMS,
    bowType: 'recurve',
    drawWeightLbs: 35,
    drawLengthIn: 28,
    drawWeightBasis: 'at-28'
  });
  const longDraw = resolveSpineRecommendation({
    ...DEFAULT_PARAMS,
    bowType: 'recurve',
    drawWeightLbs: 35,
    drawLengthIn: 30,
    drawWeightBasis: 'at-28'
  });

  assert.notEqual(shortDraw.notes[0], longDraw.notes[0]);
  assert.notEqual(shortDraw.suggestedSpine, longDraw.suggestedSpine);
});

test('comparison alias follows the same range semantics', () => {
  assert.deepEqual(compareCurrentSpineToRecommendation(430, 450, 500), {
    status: 'too-stiff',
    label: 'plus raide que la fourchette'
  });
});

test('dynamic tuning inputs and porpoising react to front mass, power and spine mismatch', () => {
  const common = {
    ...DEFAULT_PARAMS,
    bowType: 'recurve',
    drawWeightLbs: 35,
    drawLengthIn: 28,
    drawWeightBasis: 'at-28',
    arrowLengthIn: 29,
    spineStatic: 600
  };
  const baseRecommendation = resolveSpineRecommendation(common);
  const baseArrow = buildArrow(common);
  const base = calculateTuningModel(
    { ...common, spineRecommendation: baseRecommendation },
    baseArrow
  );
  const heavierFront = {
    ...common,
    pointWeightGrains: 175,
    insertWeightGrains: 45
  };
  const heavier = calculateTuningModel(
    { ...heavierFront, spineRecommendation: resolveSpineRecommendation(heavierFront) },
    buildArrow(heavierFront)
  );
  const morePower = {
    ...common,
    drawWeightLbs: 42
  };
  const inputsBase = computeDynamicTuningInputs(common, baseRecommendation);
  const inputsPower = computeDynamicTuningInputs(
    morePower,
    resolveSpineRecommendation(morePower)
  );

  assert.notEqual(heavier.porpoising.amplitudeCm, base.porpoising.amplitudeCm);
  assert.notEqual(inputsBase.effectiveDrawWeightFactor, inputsPower.effectiveDrawWeightFactor);
  assert.ok(heavier.fishtailing.amplitudeCm !== base.fishtailing.amplitudeCm);
});

test('total arrow mass changes bounded tuning inertia without needing a FOC change', () => {
  const common = {
    ...DEFAULT_PARAMS,
    bowType: 'recurve',
    massMode: 'total',
    poidsGr: 25,
    pointWeightGrains: 100,
    insertWeightGrains: 12,
    spineStatic: 600
  };
  const lightRecommendation = resolveSpineRecommendation(common);
  const heavyParams = { ...common, poidsGr: 35 };
  const light = calculateTuningModel(
    { ...common, spineRecommendation: lightRecommendation },
    buildArrow(common)
  );
  const heavy = calculateTuningModel(
    { ...heavyParams, spineRecommendation: resolveSpineRecommendation(heavyParams) },
    buildArrow(heavyParams)
  );

  assert.notEqual(light.dynamicInputs.massInertiaFactor, heavy.dynamicInputs.massInertiaFactor);
  assert.notEqual(light.porpoising.amplitudeCm, heavy.porpoising.amplitudeCm);
});

test('heavier point and insert change porpoising and increase fishtailing under mismatch', () => {
  const common = {
    ...DEFAULT_PARAMS,
    bowType: 'recurve',
    arrowLengthIn: 29,
    spineReference: 'generalized',
    pointWeightGrains: 100,
    insertWeightGrains: 12
  };
  const baseRecommendation = resolveSpineRecommendation(common);
  const mismatchSpine = baseRecommendation.rangeMax + 120;
  const base = calculateTuningModel(
    {
      ...common,
      spineStatic: mismatchSpine,
      spineRecommendation: baseRecommendation
    },
    buildArrow(common)
  );
  const heavierFront = {
    ...common,
    spineStatic: mismatchSpine,
    pointWeightGrains: 175,
    insertWeightGrains: 45
  };
  const heavy = calculateTuningModel(
    {
      ...heavierFront,
      spineRecommendation: resolveSpineRecommendation(heavierFront)
    },
    buildArrow(heavierFront)
  );

  assert.notEqual(base.porpoising.amplitudeCm, heavy.porpoising.amplitudeCm);
  assert.ok(heavy.fishtailing.amplitudeCm > base.fishtailing.amplitudeCm);
});

test('worker keeps tuning oscillations out of the center-of-mass trajectory integration', () => {
  const source = readFileSync(new URL('../trajectory.worker-archery.js', import.meta.url), 'utf8');
  assert.match(source, /const aero = evaluateAero\(/);
  assert.match(source, /attackAngleDeg: 0,/);
  assert.match(source, /porpoiseCm: tune\.verticalCm,/);
  assert.match(source, /fishtailCm: tune\.lateralCm,/);
  assert.doesNotMatch(source, /const a[xyz] = .*tune\./);
});
