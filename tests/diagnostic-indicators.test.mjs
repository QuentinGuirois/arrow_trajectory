import test from 'node:test';
import assert from 'node:assert/strict';

import { buildArrow } from '../arrow-builder.js';
import { DEFAULT_PARAMS } from '../state.js';
import { computeTuningDiagnostics } from '../tuning-diagnostics.js';
import { resolveSpineRecommendation } from '../spine-recommendation.js';
import { compareCurrentSpineToRange, computeSpineMismatch } from '../spine-evaluation.js';
import {
  buildStatsCardsModel,
  computeStabilityScore,
  evaluateFoc,
  getIndicatorStatus,
  getIndicatorStyle
} from '../diagnostic-indicators.js';

function cleanCompoundParams(overrides = {}) {
  return {
    ...DEFAULT_PARAMS,
    bowType: 'compound',
    spineReference: 'generalized',
    drawWeightLbs: 55,
    drawLengthIn: 28.5,
    arrowLengthIn: 28.5,
    balancePointIn: 18,
    pointWeightGrains: 100,
    insertWeightGrains: 12,
    poidsGr: 28,
    spineStatic: null,
    plungerStiffness: 0.5,
    centerShotMm: 0,
    releaseErrorLateralMm: 0,
    nockingPointOffsetMm: 0,
    releaseErrorVerticalMm: 0,
    ...overrides
  };
}

function buildDiagnosticsModel(params) {
  const initialRecommendation = resolveSpineRecommendation(params);
  const setup = {
    ...params,
    spineStatic: Number.isFinite(params.spineStatic)
      ? params.spineStatic
      : initialRecommendation.suggestedSpine
  };
  const recommendation = resolveSpineRecommendation(setup);
  const withRecommendation = { ...setup, spineRecommendation: recommendation };
  const arrow = buildArrow(withRecommendation);
  const tuning = computeTuningDiagnostics(withRecommendation, []);
  const mismatch = computeSpineMismatch(
    withRecommendation.spineStatic,
    recommendation.suggestedSpine,
    recommendation.rangeMin,
    recommendation.rangeMax
  );
  const comparison = {
    ...compareCurrentSpineToRange(
      withRecommendation.spineStatic,
      recommendation.rangeMin,
      recommendation.rangeMax
    ),
    severity: mismatch.severity
  };
  return {
    params: withRecommendation,
    recommendation,
    arrow,
    tuning,
    model: buildStatsCardsModel({
      arrow,
      tuning,
      comparison,
      bowType: withRecommendation.bowType
    })
  };
}

test('FOC evaluation keeps the preferred bands green without exposing a blue tier', () => {
  assert.equal(evaluateFoc(-46, 'recurve').status, 'bad');
  assert.equal(evaluateFoc(-46, 'recurve').label, 'FOC incohérent');
  assert.equal(evaluateFoc(14, 'recurve').status, 'good');
  assert.equal(evaluateFoc(18, 'recurve').status, 'good');
  assert.ok(evaluateFoc(18, 'recurve').score > evaluateFoc(14, 'recurve').score);
});

test('changing balance point changes the FOC score progressively', () => {
  const low = buildArrow({ ...DEFAULT_PARAMS, arrowLengthIn: 26, balancePointIn: 14 });
  const better = buildArrow({ ...DEFAULT_PARAMS, arrowLengthIn: 26, balancePointIn: 17 });

  assert.ok(better.focEvaluation.score > low.focEvaluation.score);
});

test('common indicator thresholds reserve green for clean oscillations and map excellent to green', () => {
  assert.equal(getIndicatorStatus('porpoising', 1.2), 'good');
  assert.equal(getIndicatorStatus('porpoising', 2), 'medium');
  assert.equal(getIndicatorStatus('porpoising', 3), 'warning');
  assert.equal(getIndicatorStatus('fishtailing', 1.4), 'good');
  assert.equal(getIndicatorStatus('fishtailing', 2), 'medium');
  assert.equal(getIndicatorStatus('fishtailing', 4), 'warning');
  assert.deepEqual(getIndicatorStyle('excellent'), getIndicatorStyle('good'));
});

test('global stability score uses only red orange yellow green tiers', () => {
  const good = computeStabilityScore({
    foc: { score: 90 },
    spine: { score: 90 },
    aoa: { score: 90 },
    porpoising: { score: 90 },
    fishtailing: { score: 90 }
  });
  const badFoc = computeStabilityScore({
    foc: { score: 0 },
    spine: { score: 90 },
    aoa: { score: 90 },
    porpoising: { score: 90 },
    fishtailing: { score: 90 }
  });

  assert.equal(good.status, 'good');
  assert.equal(good.label, 'très bon');
  assert.ok(badFoc.score < good.score);
});

test('clean compound setup reaches green diagnostics and a green stability score', () => {
  const clean = buildDiagnosticsModel(cleanCompoundParams());
  const { evaluations } = clean.model;

  assert.equal(evaluations.foc.status, 'good');
  assert.equal(evaluations.spine.status, 'good');
  assert.equal(evaluations.aoa.status, 'good');
  assert.equal(evaluations.porpoising.status, 'good');
  assert.equal(evaluations.fishtailing.status, 'good');
  assert.equal(evaluations.stability.status, 'good');
});

test('soft and stiff spine setups degrade fishtailing and global stability', () => {
  const clean = buildDiagnosticsModel(cleanCompoundParams());
  const tooSoft = buildDiagnosticsModel(cleanCompoundParams({ spineStatic: clean.recommendation.rangeMax + 180 }));
  const tooStiff = buildDiagnosticsModel(cleanCompoundParams({ spineStatic: clean.recommendation.rangeMin - 180 }));

  assert.notEqual(tooSoft.model.evaluations.fishtailing.status, 'good');
  assert.notEqual(tooStiff.model.evaluations.fishtailing.status, 'good');
  assert.ok(tooSoft.model.evaluations.stability.score < clean.model.evaluations.stability.score);
  assert.ok(tooStiff.model.evaluations.stability.score < clean.model.evaluations.stability.score);
});

test('incoherent FOC lowers stability while keeping tuning amplitudes bounded', () => {
  const clean = buildDiagnosticsModel(cleanCompoundParams());
  const badFoc = buildDiagnosticsModel(cleanCompoundParams({ arrowLengthIn: 26, balancePointIn: 1 }));

  assert.equal(badFoc.model.evaluations.foc.status, 'bad');
  assert.ok(badFoc.model.evaluations.stability.score < clean.model.evaluations.stability.score);
  assert.ok(badFoc.tuning.porpoising.amplitudeCm <= 5.2);
  assert.ok(badFoc.tuning.fishtailing.amplitudeCm <= 6);
});

test('bad vertical and lateral exits degrade their matching diagnostic channel', () => {
  const vertical = buildDiagnosticsModel(cleanCompoundParams({
    nockingPointOffsetMm: 8,
    releaseErrorVerticalMm: 12
  }));
  const lateral = buildDiagnosticsModel(cleanCompoundParams({
    centerShotMm: 8,
    releaseErrorLateralMm: 12
  }));

  assert.equal(vertical.model.evaluations.porpoising.status, 'bad');
  assert.equal(lateral.model.evaluations.fishtailing.status, 'bad');
});

test('stats cards expose readable diagnostics and color states', () => {
  const model = buildStatsCardsModel({
    stats: {
      portée: 70,
      hauteur: 2.1,
      tvol: 1.2,
      vfinal: 150,
      energyImpact: 30,
      momentumImpact: 1.1
    },
    arrow: buildArrow({ ...DEFAULT_PARAMS, arrowLengthIn: 30, balancePointIn: 18 }),
    tuning: {
      aoa: { maxEstimatedDeg: 1.2 },
      porpoising: { amplitudeCm: 0.8 },
      fishtailing: { amplitudeCm: 1.1 }
    },
    comparison: { status: 'in-range' },
    bowType: 'recurve'
  });

  assert.ok(model.diagnosticCards.some(card => card.label === 'FOC'));
  assert.ok(model.diagnosticCards.some(card => card.label === 'SPINE'));
  assert.ok(model.diagnosticCards.some(card => card.label === 'AOA' && card.hint === 'angle d’attaque'));
  assert.ok(model.diagnosticCards.some(card => card.label === 'PORPOISING' && card.hint === 'oscillation verticale'));
  assert.ok(model.diagnosticCards.some(card => card.label === 'FISHTAILING' && card.hint === 'oscillation latérale'));
  assert.ok(model.diagnosticCards.some(card => card.label === 'STABILITÉ'));
  assert.ok(model.ballisticCards.some(card => card.label === 'MOMENTUM' && card.hint === 'quantité de mouvement'));
  assert.deepEqual(getIndicatorStyle('bad'), {
    textClass: 'indicator-bad',
    borderClass: 'indicator-border-bad',
    glowClass: 'indicator-glow-bad'
  });
});
