import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('trajectory charts expose the requested physical hover fields', async () => {
  const source = await readFile(new URL('../plotly-charts.js', import.meta.url), 'utf8');

  assert.match(source, /function trace2d[\s\S]*Vitesse:[\s\S]*Énergie:[\s\S]*Temps:/);
  assert.match(source, /function trace3d[\s\S]*Dérive:[\s\S]*Vitesse:[\s\S]*Énergie:/);
});

test('distance-derived charts are sampled through interpolation', async () => {
  const source = await readFile(new URL('../plotly-charts.js', import.meta.url), 'utf8');
  const calibration = await readFile(new URL('../calibration.js', import.meta.url), 'utf8');

  assert.match(source, /function sampleAtDistances[\s\S]*interpolatePointAtDistance\(points, distance\)/);
  assert.match(source, /energy\.push\(traceDistance/);
  assert.match(source, /time\.push\(traceDistance/);
  assert.match(source, /drift\.push\(traceDistance/);
  assert.match(source, /hasNumericField\(curveData, 'aoaDeg'\)[\s\S]*aoa\.push\(traceDistance/);
  assert.match(calibration, /const p = interpolatePointAtDistance\(points, distance\);/);
});

test('3D view keeps physical proportions instead of forcing a cube', async () => {
  const source = await readFile(new URL('../plotly-charts.js', import.meta.url), 'utf8');
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(source, /aspectmode: 'data'/);
  assert.doesNotMatch(source, /aspectratio:\s*\{\s*x:\s*3\.8,\s*y:\s*0\.9,\s*z:\s*1\.15\s*\}/);
  assert.match(source, /showline: true/);
  assert.match(html, /3D = centre de masse de la flèche\./);
});

test('3D scene stays transparent without opaque axis planes or oversized dispersion markers', async () => {
  const source = await readFile(new URL('../plotly-charts.js', import.meta.url), 'utf8');

  assert.match(source, /paper_bgcolor: 'rgba\(0,0,0,0\)'/);
  assert.match(source, /plot_bgcolor: 'rgba\(0,0,0,0\)'/);
  assert.match(source, /bgcolor: 'rgba\(0,0,0,0\)'/);
  assert.match(source, /showbackground: false/);
  assert.match(source, /backgroundcolor: 'rgba\(0,0,0,0\)'/);
  assert.match(source, /opacity: 0\.18/);
  assert.match(source, /Math\.min\(10, Math\.max\(2, p\.dispersionRadiusCm\)\)/);
  assert.doesNotMatch(source, /surfaceaxis|type:\s*'mesh3d'|type:\s*'surface'/);
});

test('mobile chart rendering stays touch-friendly and lazy', async () => {
  const source = await readFile(new URL('../plotly-charts.js', import.meta.url), 'utf8');

  assert.match(source, /dragmode: isMobileLayout\(\) \? 'pan' : 'zoom'/);
  assert.match(source, /displayModeBar: false/);
  assert.match(source, /scrollZoom: false/);
  assert.match(source, /export function renderActiveChart/);
  assert.match(source, /sampleForDisplay\(points/);
  assert.match(source, /document\.body\.dataset\.mobilePanel === 'graphs'/);
});
