// script-archery.js
// Contrôleur UI: lecture formulaire, worker, panels, comparaison, partage et Three optionnel.

import { appState, COLORS, DEFAULT_PARAMS, PRESETS } from './state.js';
import { buildArrow } from './arrow-builder.js';
import { resolveLaunch, buildSightMarks } from './calibration.js';
import { calculateTuningModel } from './tuning-diagnostics.js';
import { renderAllCharts, purgeCharts, showTab } from './plotly-charts.js';
import { decodeShare, encodeShare, loadSetups, saveSetups } from './share-schema.js';
import { toggleThreeOverlay, scrubThree, setThreePlaying } from './three-overlay.js';
import { formatNumber, readBool, readNumber } from './units.js';

const trajWorker = new Worker('./trajectory.worker-archery.js', { type: 'module' });
let threeEnabled = false;
let threePlaying = true;

const $ = id => document.getElementById(id);

const numericFields = {
  fps: 200,
  poidsGr: 25,
  diameter: 7,
  angleDeg: 0,
  scopeOffset: 5,
  scopeAngleDeg: 0,
  arrowLengthIn: 29,
  spineStatic: 600,
  shaftGpi: 7.4,
  pointWeightGrains: 100,
  insertWeightGrains: 12,
  nockWeightGrains: 10,
  vaneCount: 3,
  vaneLengthIn: 1.75,
  fletchingAngleDeg: 0,
  balancePointIn: 17,
  focPercent: 10,
  drawWeightLbs: 38,
  drawLengthIn: 28,
  braceHeightIn: 8.5,
  letOffPercent: 0,
  camAggressiveness: 0.4,
  pressureHpa: 1020,
  temperatureCelsius: 20,
  humidityPercent: 50,
  altitudeM: 0,
  windSpeedKmh: 0,
  windDirectionDeg: 0,
  gustPercent: 0,
  chronoFps: 200,
  sightDistance1M: 20,
  sightHold1Cm: 0,
  sightDistance2M: 50,
  sightHold2Cm: -80,
  referenceDistanceM: 30,
  referenceDropCm: -25,
  nockingPointOffsetMm: 0,
  centerShotMm: 0,
  plungerStiffness: 0.5,
  releaseErrorVerticalMm: 0,
  releaseErrorLateralMm: 0,
  dispersionShots: 12,
  forcePoint1DrawIn: 10,
  forcePoint1Lbs: 12,
  forcePoint2DrawIn: 20,
  forcePoint2Lbs: 32,
  forcePoint3DrawIn: 28,
  forcePoint3Lbs: 38
};

const selectFields = [
  'uiMode', 'massMode', 'plumeType', 'vaneProfile', 'fletchingOrientation',
  'bowType', 'releaseType', 'handedness', 'calibrationMode', 'forceProfile'
];

function getFormValues() {
  const params = { ...DEFAULT_PARAMS };
  params.setupName = $('setupName')?.value?.trim() || DEFAULT_PARAMS.setupName;
  Object.entries(numericFields).forEach(([id, fallback]) => {
    params[id] = readNumber(id, fallback);
  });
  selectFields.forEach(id => {
    if ($(id)) params[id] = $(id).value;
  });
  params.dispersionEnabled = readBool('dispersionEnabled');
  params.forceCurveEnabled = readBool('forceCurveEnabled');
  params.diameter = readNumber('diameter', 7) / 1000;
  params.scopeOffset = readNumber('scopeOffset', 5) / 100;
  params.shootingHeight = DEFAULT_PARAMS.shootingHeight;
  return params;
}

function applyParamsToForm(params) {
  const merged = { ...DEFAULT_PARAMS, ...params };
  Object.entries(numericFields).forEach(([id, fallback]) => {
    if (!$(id)) return;
    let value = Number.isFinite(merged[id]) ? merged[id] : fallback;
    if (id === 'diameter' && value < 0.05) value *= 1000;
    if (id === 'scopeOffset' && Math.abs(value) < 1) value *= 100;
    $(id).value = value;
  });
  selectFields.forEach(id => {
    if ($(id)) $(id).value = merged[id] ?? DEFAULT_PARAMS[id];
  });
  if ($('setupName')) $('setupName').value = merged.setupName || DEFAULT_PARAMS.setupName;
  if ($('dispersionEnabled')) $('dispersionEnabled').checked = Boolean(merged.dispersionEnabled);
  if ($('forceCurveEnabled')) $('forceCurveEnabled').checked = Boolean(merged.forceCurveEnabled);
  updateMode();
  updateDerivedPanels();
}

function updateDerivedPanels() {
  const params = getFormValues();
  const arrow = buildArrow(params);
  const launch = resolveLaunch(params, arrow);
  const tuning = calculateTuningModel(params, arrow);
  updateEnergyDisplay(arrow, launch);
  renderArrowBuilderPanel(arrow);
  renderCalibrationPanel(launch);
  renderDiagnosticsPanel(arrow, tuning);
}

function updateEnergyDisplay(arrow = buildArrow(getFormValues()), launch = resolveLaunch(getFormValues(), arrow)) {
  const energy = 0.5 * arrow.totalMassKg * launch.speedMps * launch.speedMps;
  $('energyInit').textContent = `${formatNumber(energy, 1)} J (${formatNumber(launch.fps, 0)} fps)`;
  if (getFormValues().massMode === 'gpi') {
    $('poidsGr').value = formatNumber(arrow.totalMassGr, 1);
  }
}

function renderArrowBuilderPanel(arrow) {
  $('arrowBuilderPanel').innerHTML = `
    <div class="grid grid-cols-2 gap-2">
      <div>Masse: <b>${formatNumber(arrow.totalMassGr, 1)} g</b> / ${formatNumber(arrow.totalMassGrains, 0)} gr</div>
      <div>FOC: <b>${formatNumber(arrow.focPercent, 1)}%</b></div>
      <div>Spine dynamique: <b>${formatNumber(arrow.dynamicSpineFactor, 2)}</b></div>
      <div>Stabilité: <b>${arrow.stabilityScore}/100</b></div>
      <div>Surface frontale: <b>${(arrow.frontalAreaM2 * 1e6).toFixed(1)} mm²</b></div>
      <div>Spin damping: <b>${formatNumber(arrow.spinStabilization, 2)}</b></div>
    </div>
    ${arrow.warnings.length ? `<ul class="mt-2 text-yellow-300 list-disc pl-5">${arrow.warnings.map(w => `<li>${w}</li>`).join('')}</ul>` : '<div class="mt-2 text-green-300">Aucun avertissement majeur.</div>'}
  `;
}

function renderCalibrationPanel(launch) {
  $('calibrationPanel').innerHTML = `
    <div>Vitesse utilisée: <b>${formatNumber(launch.fps, 0)} fps</b> via ${launch.source}${launch.experimental ? ' <span class="text-yellow-300">(expérimental)</span>' : ''}</div>
    ${launch.notes.length ? `<ul class="mt-2 text-yellow-300 list-disc pl-5">${launch.notes.map(n => `<li>${n}</li>`).join('')}</ul>` : '<div class="mt-2 text-gray-400">Hypothèse principale: vitesse chronographe ou saisie directe.</div>'}
  `;
}

function renderDiagnosticsPanel(arrow, tuning) {
  $('diagnosticsPanel').innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
      ${tuning.diagnostics.map(item => `
        <div>
          <div class="text-cyan-300 font-bold">${item.label}: ${item.level}</div>
          <div class="text-gray-400">${item.detail}</div>
        </div>
      `).join('')}
    </div>
    <div class="mt-2 text-gray-400">Spin utilisé comme stabilisation/amortissement, pas comme cause directe du porpoising.</div>
  `;
}

function updateStatsPanel(stats = {}) {
  const cards = [
    ['PORTÉE', `${formatNumber(stats.portée || 0, 1)} m`, 'text-cyan-400'],
    ['HAUTEUR MAX', `${formatNumber(stats.hauteur || 0, 2)} m`, 'text-green-400'],
    ['TEMPS VOL', `${formatNumber(stats.tvol || 0, 2)} s`, 'text-purple-400'],
    ['VITESSE IMPACT', `${formatNumber(stats.vfinal || 0, 1)} fps`, 'text-yellow-400'],
    ['ÉNERGIE IMPACT', `${formatNumber(stats.energyImpact || 0, 1)} J`, 'text-cyan-400'],
    ['MOMENTUM', `${formatNumber(stats.momentumImpact || 0, 2)} kg·m/s`, 'text-green-400'],
    ['DÉRIVE IMPACT', `${formatNumber(stats.driftImpactCm || 0, 1)} cm`, 'text-purple-400'],
    ['ANGLE IMPACT', `${formatNumber(stats.impactAngleDeg || 0, 1)}°`, 'text-yellow-400']
  ];
  $('statsPanel').innerHTML = cards.map(([label, value, color]) => `
    <div class="card-glass p-4 text-center">
      <div class="${color} text-sm">${label}</div>
      <div class="text-xl font-bold mt-1">${value}</div>
    </div>
  `).join('');
}

function updateSavedCurves() {
  const list = $('savedCurves');
  list.innerHTML = '';
  appState.savedCurves.forEach((curve, i) => {
    const card = document.createElement('div');
    card.className = 'trajectory-card card-glass p-4 border border-cyan-500/30 rounded-lg mb-2';
    card.innerHTML = `
      <div class="flex justify-between items-center gap-3">
        <div>
          <div class="font-bold" style="color:${curve.color}">${curve.label}</div>
          <div class="text-sm text-gray-400">${formatNumber(curve.params.fps, 0)} fps, ${formatNumber(curve.arrow.totalMassGr, 1)} g, FOC ${formatNumber(curve.arrow.focPercent, 1)}%</div>
        </div>
        <div class="flex space-x-2">
          <button class="p-2 text-cyan-400 hover:text-cyan-300" data-index="${i}" data-action="load" title="Charger"><i class="fas fa-eye"></i></button>
          <button class="p-2 text-red-400 hover:text-red-300" data-index="${i}" data-action="delete" title="Supprimer"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll('button[data-action="delete"]').forEach(btn => {
    btn.onclick = () => {
      appState.savedCurves.splice(parseInt(btn.dataset.index, 10), 1);
      saveSetups(appState.savedCurves);
      updateSavedCurves();
      renderAllCharts(appState.savedCurves);
    };
  });
  list.querySelectorAll('button[data-action="load"]').forEach(btn => {
    btn.onclick = () => {
      const curve = appState.savedCurves[parseInt(btn.dataset.index, 10)];
      applyParamsToForm(curve.params);
      updateStatsPanel(curve.stats);
      appState.savedCurves = [curve, ...appState.savedCurves.filter(c => c !== curve)];
      updateSavedCurves();
      renderAllCharts(appState.savedCurves);
    };
  });
}

function renderSightTable(curve) {
  if (!curve) {
    $('sightTablePanel').innerHTML = '';
    return;
  }
  const marks = buildSightMarks(curve.curveData, curve.params).slice(0, 10);
  $('sightTablePanel').innerHTML = `
    <div class="text-cyan-300 font-bold mb-2">Sight marks / holdover</div>
    <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
      ${marks.map(m => `<div class="bg-slate-950/40 rounded p-2">${m.distance} m<br><b>${formatNumber(m.holdoverCm, 1)} cm</b><br><span class="text-gray-400">drift ${formatNumber(m.driftCm, 1)} cm</span></div>`).join('')}
    </div>
  `;
}

function runSim(saveCurve = true) {
  const params = getFormValues();
  const arrow = buildArrow(params);
  const launch = resolveLaunch(params, arrow);
  params.fps = launch.fps;
  const requestId = ++appState.requestSeq;
  trajWorker.onmessage = async (e) => {
    if (e.data.requestId !== requestId) return;
    if (!e.data.ok) {
      console.error('Erreur de simulation:', e.data.error);
      return;
    }
    const color = COLORS[appState.savedCurves.length % COLORS.length];
    const label = params.setupName || `${formatNumber(params.fps, 0)} fps, ${formatNumber(arrow.totalMassGr, 1)} g`;
    const curve = {
      params,
      label,
      color,
      stats: e.data.stats,
      curveData: e.data.positions,
      arrow: e.data.arrow,
      launch: e.data.launch,
      tuning: e.data.tuning
    };
    appState.lastResult = curve;
    if (saveCurve) appState.savedCurves.push(curve);
    saveSetups(appState.savedCurves);
    updateSavedCurves();
    updateStatsPanel(curve.stats);
    renderSightTable(curve);
    renderAllCharts(appState.savedCurves.length ? appState.savedCurves : [curve]);
    if (threeEnabled) await refreshThree(curve);
  };
  trajWorker.postMessage({ type: 'calcTrajArchery', requestId, params });
}

async function refreshThree(curve = appState.lastResult) {
  const result = await toggleThreeOverlay('threeOverlay', curve?.curveData || [], threeEnabled);
  $('threeStatus').textContent = result.ok ? result.message : 'Three.js indisponible, fallback Plotly.';
}

function shareCurrentConfig() {
  const hash = encodeShare(getFormValues());
  const url = `${window.location.origin}${window.location.pathname}#${hash}`;
  navigator.clipboard.writeText(url).then(() => {
    alert('Lien de simulation copié.');
  });
}

function loadConfigFromUrl() {
  if (!window.location.hash) return false;
  const params = decodeShare(window.location.hash);
  if (!params) return false;
  applyParamsToForm(params);
  runSim(true);
  return true;
}

function updateMode() {
  const advanced = $('uiMode')?.value === 'advanced';
  document.querySelectorAll('.advanced-field').forEach(el => {
    el.classList.toggle('advanced-hidden', !advanced);
  });
}

function bindEvents() {
  document.querySelectorAll('#params input, #params select').forEach(el => {
    el.addEventListener('input', () => {
      updateMode();
      updateDerivedPanels();
    });
    el.addEventListener('change', () => {
      updateMode();
      updateDerivedPanels();
    });
  });

  $('presetSelect').onchange = () => {
    const preset = PRESETS[$('presetSelect').value];
    if (preset) applyParamsToForm(preset.values);
  };
  $('runBtn').onclick = () => {
    showTab('trajectory2D');
    runSim(true);
  };
  $('saveCurve').onclick = () => runSim(true);
  $('resetCurves').onclick = () => {
    appState.savedCurves = [];
    saveSetups([]);
    updateSavedCurves();
    purgeCharts();
    updateStatsPanel();
    renderSightTable(null);
  };
  $('shareConfig').onclick = shareCurrentConfig;
  document.querySelectorAll('footer .fa-share-alt').forEach(icon => {
    icon.parentElement.onclick = shareCurrentConfig;
  });

  const tabs = {
    tab2d: 'trajectory2D',
    tabEnergy: 'energyChart',
    tabTime: 'timeChart',
    tabHoldover: 'holdoverChart',
    tab3d: 'trajectory3D',
    tabDrift: 'driftChart',
    tabTuning: 'tuningChart',
    tabAoa: 'aoaChart'
  };
  Object.entries(tabs).forEach(([buttonId, tabId]) => {
    $(buttonId).onclick = () => showTab(tabId);
  });

  $('threeToggle').onclick = async () => {
    threeEnabled = !threeEnabled;
    await refreshThree();
  };
  $('threePlay').onclick = () => {
    threePlaying = !threePlaying;
    setThreePlaying(threePlaying);
    $('threePlay').innerHTML = threePlaying ? '<i class="fas fa-pause mr-2"></i>Pause' : '<i class="fas fa-play mr-2"></i>Play';
  };
  $('threeScrub').oninput = () => scrubThree(readNumber('threeScrub', 0) / 100);

  ['trajectory2D', 'energyChart', 'timeChart', 'holdoverChart', 'trajectory3D', 'driftChart', 'tuningChart', 'aoaChart'].forEach(id => {
    const el = $(id);
    el?.addEventListener('wheel', e => e.preventDefault(), { passive: false });
  });
}

function bootstrap() {
  bindEvents();
  const persisted = loadSetups();
  if (Array.isArray(persisted) && persisted.length) {
    appState.savedCurves = persisted.filter(c => c?.curveData?.length);
    updateSavedCurves();
    renderAllCharts(appState.savedCurves);
    const last = appState.savedCurves[appState.savedCurves.length - 1];
    if (last) {
      updateStatsPanel(last.stats);
      renderSightTable(last);
    }
  }
  updateMode();
  updateDerivedPanels();
  if (!loadConfigFromUrl() && !appState.savedCurves.length) runSim(true);
}

bootstrap();
