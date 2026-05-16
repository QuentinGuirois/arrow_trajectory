import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('simple UI keeps pressure and initial momentum visible', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(html, /id="pressureHpa"/);
  assert.match(html, /id="momentumInit"/);
});

test('fields without visible effect are no longer exposed', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.doesNotMatch(html, /id="letOffPercent"/);
  assert.doesNotMatch(html, /id="camAggressiveness"/);
  assert.doesNotMatch(html, /id="calibrationPanel"/);
});

test('oscillation chart returns as an advanced tab while AoA stays out of the primary tabs', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(html, /class="[^"]*advanced-tab[^"]*" id="tabTuning">Oscillations<\/button>/);
  assert.doesNotMatch(html, /id="tabAoa"/);
  assert.match(html, /id="tuningChart"/);
  assert.match(html, /Diagnostic qualitatif, pas simulation flexible complète\./);
});

test('conditional fields update immediately while trajectory recalculation stays debounced', async () => {
  const source = await readFile(new URL('../script-archery.js', import.meta.url), 'utf8');

  assert.match(source, /\$\('bowType'\)\.addEventListener\('change', handleConditionalFieldChange\)/);
  assert.match(source, /\$\('massMode'\)\.addEventListener\('change', handleConditionalFieldChange\)/);
  assert.match(source, /const scheduleRecalc = debounce\([\s\S]*?, 200\);/);
  assert.match(source, /!advanced && appState\.activeTab === 'tuningChart'/);
  const handler = source.match(/function handleImmediateSpineInput\(\)\s*{([\s\S]*?)\n}/)?.[1] || '';
  assert.match(handler, /updateSpineRecommendation\(\);/);
  assert.doesNotMatch(handler, /runSim\(\);/);
});
