import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { buildArrow } from '../arrow-builder.js';
import { gramsToGrains } from '../units.js';
import { DEFAULT_PARAMS } from '../state.js';

test('total mass mode keeps entered total mass as the source of truth', () => {
  const arrow = buildArrow({
    ...DEFAULT_PARAMS,
    massMode: 'total',
    poidsGr: 25,
    vaneWeightTotalGrains: null,
    pointWeightGrains: 175,
    insertWeightGrains: 40
  });

  assert.equal(arrow.totalMassGr, 25);
  assert.equal(arrow.totalMassGrains, gramsToGrains(25));
});

test('components mode sums only explicit component masses and does not invent vane mass', () => {
  const withoutVanes = buildArrow({
    ...DEFAULT_PARAMS,
    massMode: 'components',
    shaftGpi: 7,
    arrowLengthIn: 30,
    pointWeightGrains: 100,
    insertWeightGrains: 12,
    nockWeightGrains: 10,
    vaneWeightTotalGrains: null
  });
  const withVanes = buildArrow({
    ...DEFAULT_PARAMS,
    massMode: 'components',
    shaftGpi: 7,
    arrowLengthIn: 30,
    pointWeightGrains: 100,
    insertWeightGrains: 12,
    nockWeightGrains: 10,
    vaneWeightTotalGrains: 18.5
  });

  assert.equal(withoutVanes.totalMassGrains, 332);
  assert.equal(withoutVanes.vaneMassGrains, null);
  assert.equal(withoutVanes.componentMassComplete, false);
  assert.ok(withoutVanes.warnings.some(warning => warning.includes('empennage')));
  assert.equal(withVanes.totalMassGrains, 350.5);
  assert.equal(withVanes.vaneMassGrains, 18.5);
  assert.equal(withVanes.componentMassComplete, true);
});

test('FOC is measured when a balance point is provided', () => {
  const arrow = buildArrow({
    ...DEFAULT_PARAMS,
    arrowLengthIn: 30,
    balancePointIn: 18,
    vaneWeightTotalGrains: null
  });

  assert.equal(arrow.focSource, 'measured');
  assert.equal(arrow.focPercent, 10);
});

test('FOC measured from the nock matches the standard formula', () => {
  const arrow = buildArrow({
    ...DEFAULT_PARAMS,
    arrowLengthIn: 26,
    balancePointIn: 14
  });

  assert.ok(Math.abs(arrow.focPercent - 3.8461538461538463) < 1e-12);
});

test('FOC is estimated only when component distribution is explicit', () => {
  const estimated = buildArrow({
    ...DEFAULT_PARAMS,
    massMode: 'components',
    balancePointIn: 0,
    vaneWeightTotalGrains: 18
  });
  const unavailable = buildArrow({
    ...DEFAULT_PARAMS,
    massMode: 'components',
    balancePointIn: 0,
    vaneWeightTotalGrains: null
  });

  assert.equal(estimated.focSource, 'estimated');
  assert.ok(Number.isFinite(estimated.focPercent));
  assert.equal(unavailable.focSource, 'unavailable');
  assert.equal(unavailable.focPercent, null);
});

test('advanced arrow UI asks for explicit total vane weight', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(html, /id="vaneWeightTotalGrains"/);
  assert.match(html, /Poids total empennage/);
});

test('component mode does not overwrite the entered total-mass field', async () => {
  const source = await readFile(new URL('../script-archery.js', import.meta.url), 'utf8');

  assert.match(source, /\$\('massGrains'\)\.disabled = componentsMode/);
  assert.doesNotMatch(source, /\$\('poidsGr'\)\.value = formatNumber\(arrow\.totalMassGr/);
});
