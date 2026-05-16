// script-archery.js
// Contrôleur UI: formulaire, recalcul automatique, worker, comparaison et partage.

import { appState, COLORS, DEFAULT_PARAMS, PRESETS } from './state.js';
import { buildArrow } from './arrow-builder.js';
import { resolveLaunch, buildSightMarks } from './calibration.js';
import { computeTuningDiagnostics } from './tuning-diagnostics.js';
import { renderAllCharts, purgeCharts, showTab, resizeCharts } from './plotly-charts.js';
import { decodeShare, encodeShare, loadSetups, saveSetups } from './share-schema.js';
import { resolveSpineRecommendation } from './spine-recommendation.js';
import { compareCurrentSpineToRange, computeSpineMismatch } from './spine-evaluation.js';
import { deriveInternalReleaseType, normalizeBowType } from './bow-utils.js';
import { formatPrintedSpineLabel } from './spine-display.js';
import { resolveEffectiveDrawWeight } from './draw-weight.js';
import { normalizeSimulationParams } from './simulation-params.js';
import { debounce } from './util.js';
import { buildStatsCardsModel, getIndicatorStyle } from './diagnostic-indicators.js';
import { cmToMeters, formatNumber, gramsToGrains, grainsToGrams, mmToMeters, readBool, readNumber } from './units.js';

const trajWorker = new Worker('./trajectory.worker-archery.js', { type: 'module' });
const $ = id => document.getElementById(id);

const numericFields = {
  fps: 190,
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
  balancePointIn: 0,
  drawWeightLbs: 35,
  drawLengthIn: 28,
  pressureHpa: 1020,
  temperatureCelsius: 20,
  humidityPercent: 50,
  altitudeM: 0,
  windSpeedKmh: 0,
  windDirectionDeg: 0,
  gustPercent: 0,
  nockingPointOffsetMm: 0,
  centerShotMm: 0,
  plungerStiffness: 0.5,
  releaseErrorVerticalMm: 0,
  releaseErrorLateralMm: 0
};

const selectFields = [
  'uiMode', 'massMode', 'vaneProfile', 'fletchingOrientation',
  'bowType', 'spineReference', 'drawWeightBasis'
];

const SPINE_RELEVANT_FIELD_IDS = new Set([
  'bowType',
  'drawWeightLbs',
  'drawLengthIn',
  'drawWeightBasis',
  'arrowLengthIn',
  'pointWeightGrains',
  'insertWeightGrains',
  'massGrains',
  'massMode',
  'spineStatic',
  'spineReference',
  'balancePointIn',
  'nockingPointOffsetMm',
  'centerShotMm',
  'plungerStiffness',
  'releaseErrorVerticalMm',
  'releaseErrorLateralMm'
]);

const formHash = params => JSON.stringify(params);

function getFormValues() {
  const params = { ...DEFAULT_PARAMS };
  params.setupName = $('setupName')?.value?.trim() || DEFAULT_PARAMS.setupName;
  Object.entries(numericFields).forEach(([id, fallback]) => {
    params[id] = readNumber(id, fallback);
  });
  params.massGrains = readNumber('massGrains', gramsToGrains(params.poidsGr));
  params.poidsGr = grainsToGrams(params.massGrains);
  params.vaneWeightTotalGrains = readOptionalNumber('vaneWeightTotalGrains');
  selectFields.forEach(id => {
    if ($(id)) params[id] = $(id).value;
  });
  params.dispersionEnabled = readBool('dispersionEnabled');
  // Les ids HTML historiques restent en mm / cm ; le contrat legacy interne garde le SI.
  params.diameter = mmToMeters(readNumber('diameter', 7));
  params.scopeOffset = cmToMeters(readNumber('scopeOffset', 5));
  params.shootingHeight = DEFAULT_PARAMS.shootingHeight;
  params.releaseType = deriveInternalReleaseType(params.bowType);
  return params;
}

function applyParamsToForm(params) {
  const merged = { ...DEFAULT_PARAMS, ...params };
  merged.bowType = normalizeBowType(merged.bowType) || DEFAULT_PARAMS.bowType;
  Object.entries(numericFields).forEach(([id, fallback]) => {
    if (!$(id)) return;
    let value = Number.isFinite(merged[id]) ? merged[id] : fallback;
    if (id === 'diameter' && value < 0.05) value *= 1000;
    if (id === 'scopeOffset' && Math.abs(value) < 1) value *= 100;
    $(id).value = value;
  });
  if ($('massGrains')) {
    const visibleMassGrains = Number.isFinite(merged.massGrains)
      ? merged.massGrains
      : gramsToGrains(Number.isFinite(merged.poidsGr) ? merged.poidsGr : DEFAULT_PARAMS.poidsGr);
    $('massGrains').value = Math.round(visibleMassGrains);
  }
  if ($('vaneWeightTotalGrains')) {
    $('vaneWeightTotalGrains').value = Number.isFinite(merged.vaneWeightTotalGrains)
      ? merged.vaneWeightTotalGrains
      : '';
  }
  selectFields.forEach(id => {
    if (!$(id)) return;
    const value = merged[id] !== undefined && merged[id] !== null
      ? merged[id]
      : DEFAULT_PARAMS[id];
  
    if (value !== undefined && value !== null) {
      $(id).value = value;
    }
  });
  if ($('setupName')) $('setupName').value = merged.setupName || DEFAULT_PARAMS.setupName;
  if ($('dispersionEnabled')) $('dispersionEnabled').checked = Boolean(merged.dispersionEnabled);
  updateConditionalFields();
  updateSpineRecommendation();
  updateDerivedPanels();
}

function updateConditionalFields() {
  const params = getFormValues();
  const advanced = params.uiMode === 'advanced';
  const componentsMode = params.massMode === 'components';

  document.querySelectorAll('.advanced-field').forEach(el => el.classList.toggle('advanced-hidden', !advanced));
  document.querySelectorAll('.advanced-tab').forEach(el => el.classList.toggle('advanced-hidden', !advanced));
  document.querySelectorAll('.component-only').forEach(el => el.classList.toggle('advanced-hidden', !(advanced && componentsMode)));
  document.querySelectorAll('.mass-total-note').forEach(el => el.classList.toggle('advanced-hidden', !(advanced && !componentsMode)));
  if ($('massGrains')) $('massGrains').disabled = componentsMode;

  if ((!advanced && appState.activeTab === 'tuningChart') || appState.activeTab === 'aoaChart') {
    appState.activeTab = 'trajectory2D';
    showTab('trajectory2D');
  }
  resizeCharts();
}

function updateDerivedPanels() {
  const params = getFormValues();
  const arrow = buildArrow(params);
  const launch = resolveLaunch(params);
  updateSpineRecommendation(params, arrow);
  updateEnergyDisplay(arrow, launch);
}

function updateEnergyDisplay(arrow = buildArrow(getFormValues()), launch = resolveLaunch(getFormValues())) {
  const energy = 0.5 * arrow.totalMassKg * launch.speedMps * launch.speedMps;
  const momentum = arrow.totalMassKg * launch.speedMps;
  $('energyInit').textContent = `${formatNumber(energy, 1)} J`;
  $('momentumInit').textContent = `${formatNumber(momentum, 3)} kg·m/s`;
}

function updateSpineRecommendation(params = getFormValues(), arrow = buildArrow(params)) {
  const recommendation = resolveSpineRecommendation(params);
  const comparison = buildSpineComparison(params, recommendation);
  appState.currentSpineRecommendation = recommendation;
  const tuning = computeTuningDiagnostics({ ...params, spineRecommendation: recommendation }, []);
  renderArrowBuilderPanel(arrow, params, recommendation, comparison);
  renderDiagnosticsPanel(arrow, tuning);
  updateStatsPanel(appState.lastResult?.stats, arrow, tuning, recommendation, comparison, params);
  return { recommendation, comparison, tuning };
}

function renderArrowBuilderPanel(arrow, params, recommendation, comparison) {
  const spineSummary = buildArrowSpineSummary(params, recommendation, comparison);
  const effectiveDrawWeight = resolveEffectiveDrawWeight(params);
  const launch = resolveLaunch(params);
  const energyInitJ = 0.5 * arrow.totalMassKg * launch.speedMps * launch.speedMps;
  const momentumInit = arrow.totalMassKg * launch.speedMps;

  $('arrowBuilderPanel').innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
      <div>Masse totale: <b>${formatNumber(arrow.totalMassGrains, 0)} gr</b> / ${formatNumber(arrow.totalMassGr, 1)} g</div>
      <div>Longueur: <b>${formatNumber(params.arrowLengthIn, 1)} in</b></div>
      <div>Diam&egrave;tre: <b>${formatNumber(params.diameter * 1000, 1)} mm</b></div>
      <div>FOC: <b>${formatFocSummary(arrow)}</b></div>
      <div>Point weight total: <b>${formatNumber(arrow.pointWeightTotalGrains, 0)} gr</b></div>
      <div>&Eacute;nergie initiale: <b>${formatNumber(energyInitJ, 1)} J</b></div>
      <div>Momentum initial: <b>${formatNumber(momentumInit, 3)} kg&middot;m/s</b></div>
      <div>Spine saisi: <b>${params.spineStatic || '&mdash;'}</b> &mdash; nombre bas = plus raide.</div>
      <div>Puissance utilis&eacute;e : <b>${formatNumber(effectiveDrawWeight.effectiveDrawWeightLbs, 1)} lbs</b></div>
      <div>Surface frontale: <b>${(arrow.frontalAreaM2 * 1e6).toFixed(1)} mm&sup2;</b></div>
      <div>Stabilit&eacute;: <b>${arrow.stabilityLabel}</b></div>
    </div>
    <div class="mt-3 border-t border-cyan-400/15 pt-3 space-y-1">
      ${spineSummary.lines.map(line => `<div>${line}</div>`).join('')}
    </div>
    ${params.massMode === 'total' ? '<div class="mt-2 text-gray-400">Mode masse totale: GPI/composants ne pilotent pas la masse.</div>' : ''}
    ${arrow.warnings.length ? `<ul class="mt-2 text-yellow-300 list-disc pl-5">${arrow.warnings.map(w => `<li>${w}</li>`).join('')}</ul>` : ''}
  `;
}

function formatFocSummary(arrow) {
  if (!Number.isFinite(arrow.focPercent)) return 'non disponible';
  if (arrow.focEvaluation?.note === 'Hors domaine réaliste.') {
    return `${formatNumber(arrow.focPercent, 1)}% (hors domaine réaliste)`;
  }
  const sourceLabel = arrow.focSource === 'measured'
    ? 'mesur&eacute;'
    : arrow.focSource === 'estimated'
      ? 'estim&eacute;'
      : 'non disponible';
  return `${formatNumber(arrow.focPercent, 1)}% (${sourceLabel})`;
}

function readOptionalNumber(id) {
  const el = $(id);
  if (!el || el.value.trim() === '') return null;
  const value = Number(el.value);
  return Number.isFinite(value) ? value : null;
}

function buildArrowSpineSummary(params, recommendation, comparison) {
  if (recommendation.mode === 'generalized') {
    return buildGeneralizedSpineSummary(params, recommendation, comparison);
  }
  return buildManufacturerSpineSummary(params, recommendation, comparison);
}

function buildSpineComparison(params, recommendation) {
  const comparison = compareCurrentSpineToRange(
    params.spineStatic,
    recommendation.rangeMin,
    recommendation.rangeMax
  );
  const mismatch = computeSpineMismatch(
    params.spineStatic,
    recommendation.suggestedSpine,
    recommendation.rangeMin,
    recommendation.rangeMax
  );
  return { ...comparison, severity: mismatch.severity };
}

function buildGeneralizedSpineSummary(params, recommendation, comparison) {
  if (recommendation.status !== 'available') {
    return {
      lines: [
        '<b>Spine conseill&eacute; indisponible</b>',
        '<span class="text-gray-400">Nombre bas = plus raide.</span>'
      ]
    };
  }

  return {
    lines: [
      `Spine conseill&eacute; : <b>${recommendation.suggestedSpine}</b>`,
      `Fourchette courante : <b>${recommendation.rangeLabel}</b>`,
      `Votre spine : <b>${params.spineStatic || '&mdash;'}</b> &mdash; ${comparison.label}`,
      '<span class="text-gray-400">Nombre bas = plus raide.</span>',
      '<span class="text-gray-400">&Agrave; valider au tuning r&eacute;el.</span>'
    ]
  };
}

function buildManufacturerSpineSummary(params, recommendation, comparison) {
  if (recommendation.status !== 'available') {
    return {
      lines: [
        '<b>Recommandation indisponible pour ce setup.</b>'
      ]
    };
  }

  const row = recommendation.matchedRow;
  const sourceLabel = [
    row.manufacturer,
    row.chartTitle || row.sourceSection
  ].filter(Boolean).join(' ');
  const lines = [
    `Recommandation ${recommendation.manufacturer} : <b>${formatPrintedSpineLabel(recommendation.displayLabel)}</b>`,
    `Votre spine : <b>${params.spineStatic || '&mdash;'}</b> &mdash; ${comparison.label}`,
    `<span class="text-gray-400">Source : ${sourceLabel || row.manufacturer}</span>`,
    '<span class="text-gray-400">Nombre bas = plus raide.</span>'
  ];

  if (recommendation.resolvedInputs?.chartArrowLengthIn !== recommendation.resolvedInputs?.originalArrowLengthIn) {
    lines.push(`<span class="text-gray-400">Longueur utilis&eacute;e dans le tableau : ${recommendation.resolvedInputs.chartArrowLengthIn}"</span>`);
  }
  if (recommendation.resolvedInputs?.matchedDrawWeightRangeLabel) {
    lines.push(`<span class="text-gray-400">Puissance : plage ${recommendation.resolvedInputs.matchedDrawWeightRangeLabel} lbs</span>`);
  }
  lines.push('<span class="text-gray-400">&Agrave; valider au tuning r&eacute;el.</span>');

  return { lines };
}


function renderDiagnosticsPanel(arrow, tuning) {
  const missingData = tuning.confidence.missingData || [];
  $('diagnosticsPanel').innerHTML = `
    <div class="text-yellow-300 font-bold mb-2">${tuning.confidence.disclaimer}</div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
      <div>
        <div class="text-cyan-300 font-bold">Confiance: ${tuning.confidence.level}</div>
        <div class="text-gray-400">${tuning.confidence.mode} — ${tuning.confidence.trajectoryBasis}.</div>
      </div>
      <div>
        <div class="text-cyan-300 font-bold">AoA: ${tuning.aoa.level}</div>
        <div class="text-gray-400">${formatNumber(tuning.aoa.maxEstimatedDeg, 2)}&deg; max — ${tuning.aoa.status}.</div>
      </div>
      <div>
        <div class="text-cyan-300 font-bold">Porpoising: ${tuning.porpoising.level}</div>
        <div class="text-gray-400">${formatOscillatorSummary(tuning.porpoising)}</div>
      </div>
      <div>
        <div class="text-cyan-300 font-bold">Fishtailing: ${tuning.fishtailing.level}</div>
        <div class="text-gray-400">${formatOscillatorSummary(tuning.fishtailing)}</div>
      </div>
    </div>
    <div class="mt-3 text-gray-400">${tuning.aoa.note}</div>
    ${missingData.length ? `
      <div class="mt-3">
        <div class="text-cyan-300 font-bold">Donn&eacute;es &agrave; renseigner pour fiabiliser</div>
        <ul class="text-gray-400 list-disc pl-5">
          ${missingData.map(item => `<li>${item.label} — valeur utilis&eacute;e : ${item.defaultUsed}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
    <div class="mt-3">
      <div class="text-cyan-300 font-bold">Recommandations</div>
      <ul class="text-gray-400 list-disc pl-5">
        ${tuning.recommendations.map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>
    <div class="mt-3 text-gray-400">${arrow.qualitativeTrends.join(' ')}</div>
  `;
}

function formatOscillatorSummary(channel) {
  const o = channel.oscillator;
  return `${formatNumber(o.A0Cm, 2)} cm ; λ ${formatNumber(o.lambdaM, 1)} m ; longueur d’onde ${formatNumber(o.wavelengthM, 1)} m.`;
}

function updateStatsPanel(
  stats = {},
  arrow = buildArrow(getFormValues()),
  tuning = computeTuningDiagnostics(getFormValues(), []),
  recommendation = appState.currentSpineRecommendation || resolveSpineRecommendation(getFormValues()),
  comparison = buildSpineComparison(getFormValues(), recommendation),
  params = getFormValues()
) {
  const model = buildStatsCardsModel({
    stats,
    arrow,
    tuning,
    comparison,
    bowType: params.bowType
  });
  const ballisticMarkup = model.ballisticCards.map(card => `
    <div class="card-glass stat-card p-4 text-center">
      <div class="text-cyan-300 text-sm">${card.label}</div>
      <div class="text-xl font-bold mt-1">${card.value}</div>
      ${card.hint ? `<div class="text-xs text-gray-400 mt-1">${card.hint}</div>` : ''}
    </div>
  `).join('');
  const diagnosticMarkup = model.diagnosticCards.map(card => {
    const style = getIndicatorStyle(card.status);
    return `
      <div class="card-glass stat-card p-4 text-center border ${style.borderClass} ${style.glowClass}">
        <div class="${style.textClass} text-sm">${card.label}</div>
        <div class="text-xl font-bold mt-1">${card.value}</div>
        <div class="text-xs text-gray-400 mt-1">${card.hint}</div>
        ${card.sublabel ? `<div class="${style.textClass} text-xs mt-1">${card.sublabel}</div>` : ''}
      </div>
    `;
  }).join('');
  $('statsPanel').innerHTML = ballisticMarkup + diagnosticMarkup;
}

function curvesForDisplay() {
  const curves = appState.lastResult ? [appState.lastResult] : [];
  appState.savedCurves.forEach(curve => {
    if (!appState.lastResult || !isSameSetup(curve, appState.lastResult)) curves.push(curve);
  });
  return curves;
}

function isSameSetup(a, b) {
  return formHash(a.params) === formHash(b.params);
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
          <div class="text-sm text-gray-400">${formatNumber(curve.params.fps, 0)} fps, ${formatNumber(curve.arrow.totalMassGrains, 0)} gr / ${formatNumber(curve.arrow.totalMassGr, 1)} g</div>
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
      renderAllCharts(curvesForDisplay());
    };
  });
  list.querySelectorAll('button[data-action="load"]').forEach(btn => {
    btn.onclick = () => {
      const curve = appState.savedCurves[parseInt(btn.dataset.index, 10)];
      applyParamsToForm(curve.params);
      appState.lastResult = curve;
      const recommendation = resolveSpineRecommendation(curve.params);
      const comparison = buildSpineComparison(curve.params, recommendation);
      updateStatsPanel(curve.stats, curve.arrow, curve.tuning, recommendation, comparison, curve.params);
      renderSightTable(curve);
      renderAllCharts(curvesForDisplay());
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
    <div class="text-cyan-300 font-bold mb-2">Rep&egrave;res de vis&eacute;e / compensation</div>
    <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
      ${marks.map(m => `<div class="bg-slate-950/40 rounded p-2">${m.distance} m<br><b>${formatNumber(m.holdoverCm, 1)} cm</b><br><span class="text-gray-400">dérive ${formatNumber(m.driftCm, 1)} cm</span></div>`).join('')}
    </div>
  `;
}

function saveCurrentResult() {
  const params = getFormValues();
  if (!appState.lastResult || formHash(appState.lastResult.params) !== formHash(params)) {
    appState.pendingSave = true;
    runSim(false);
    return;
  }
  const existing = appState.savedCurves.find(curve => isSameSetup(curve, appState.lastResult));
  if (!existing) {
    const saved = {
      ...appState.lastResult,
      label: params.setupName || appState.lastResult.label.replace(' (courant)', ''),
      color: COLORS[appState.savedCurves.length % COLORS.length]
    };
    appState.savedCurves.push(saved);
    appState.lastResult = saved;
    saveSetups(appState.savedCurves);
  }
  updateSavedCurves();
  renderAllCharts(curvesForDisplay());
}

function runSim() {
  const formParams = getFormValues();
  const arrow = buildArrow(formParams);
  const launch = resolveLaunch(formParams);
  const spineRecommendation = resolveSpineRecommendation(formParams);
  const params = { ...formParams, fps: launch.fps };
  const workerParams = { ...params, spineRecommendation };
  const simulation = normalizeSimulationParams(formParams, { arrow, launch });
  const requestId = ++appState.requestSeq;
  trajWorker.onmessage = (e) => {
    if (e.data.requestId !== requestId) return;
    if (!e.data.ok) {
      console.error('Erreur de simulation:', e.data.error);
      return;
    }
    const baseLabel = params.setupName || `${formatNumber(params.fps, 0)} fps, ${formatNumber(arrow.totalMassGr, 1)} g`;
    const curve = {
      params,
      label: `${baseLabel} (courant)`,
      color: '#ffffff',
      modelVersion: e.data.modelVersion,
      stats: e.data.stats,
      curveData: e.data.positions,
      arrow: e.data.arrow,
      launch: e.data.launch,
      tuning: e.data.tuning,
      simulation: e.data.simulation
    };
    appState.lastResult = curve;
    const comparison = buildSpineComparison(params, spineRecommendation);
    updateStatsPanel(curve.stats, curve.arrow, curve.tuning, spineRecommendation, comparison, params);
    renderDiagnosticsPanel(curve.arrow, curve.tuning);
    renderSightTable(curve);
    renderAllCharts(curvesForDisplay());
    if (appState.pendingSave) {
      appState.pendingSave = false;
      saveCurrentResult();
    }
  };
  trajWorker.postMessage({ type: 'calcTrajArchery', requestId, params: workerParams, simulation });
}

const scheduleRecalc = debounce(() => {
  updateConditionalFields();
  updateDerivedPanels();
  runSim();
}, 200);

function shareCurrentConfig() {
  const hash = encodeShare({
    currentParams: getFormValues(),
    currentCurve: appState.lastResult,
    savedCurves: appState.savedCurves,
    activeTab: appState.activeTab
  });
  const url = `${window.location.origin}${window.location.pathname}#${hash}`;
  navigator.clipboard.writeText(url).then(() => {
    alert('Lien de simulation copié.');
  });
}

function loadConfigFromUrl() {
  if (!window.location.hash) return false;
  const shared = decodeShare(window.location.hash);
  if (!shared?.currentParams) return false;

  applyParamsToForm(shared.currentParams);

  if (Array.isArray(shared.savedCurves)) {
    appState.savedCurves = shared.savedCurves.filter(isRenderableCurve);
    saveSetups(appState.savedCurves);
    updateSavedCurves();
  }

  if (isRenderableCurve(shared.currentCurve)) {
    appState.lastResult = appState.savedCurves.find(curve => isSameSetup(curve, shared.currentCurve))
      || shared.currentCurve;
  } else if (!appState.lastResult && appState.savedCurves.length) {
    appState.lastResult = appState.savedCurves[appState.savedCurves.length - 1];
  }

  if (shared.activeTab) appState.activeTab = shared.activeTab;
  updateConditionalFields();

  if (appState.lastResult && isSameSetup(appState.lastResult, { params: getFormValues() })) {
    const recommendation = resolveSpineRecommendation(appState.lastResult.params);
    const comparison = buildSpineComparison(appState.lastResult.params, recommendation);
    updateStatsPanel(appState.lastResult.stats, appState.lastResult.arrow, appState.lastResult.tuning, recommendation, comparison, appState.lastResult.params);
    renderSightTable(appState.lastResult);
    renderAllCharts(curvesForDisplay());
    showTab(appState.activeTab);
  } else {
    runSim();
  }
  return true;
}

function isRenderableCurve(curve) {
  return Boolean(curve?.params && Array.isArray(curve.curveData) && curve.curveData.length);
}

function bindEvents() {
  document.querySelectorAll('#params input, #params select').forEach(el => {
    if (el.id === 'uiMode') return;
    el.addEventListener('input', scheduleRecalc);
    el.addEventListener('change', scheduleRecalc);
    if (SPINE_RELEVANT_FIELD_IDS.has(el.id)) {
      el.addEventListener('input', handleImmediateSpineInput);
      el.addEventListener('change', handleImmediateSpineInput);
    }
  });

  $('uiMode').addEventListener('change', handleUiModeChange);
  $('bowType').addEventListener('change', handleConditionalFieldChange);
  $('massMode').addEventListener('change', handleConditionalFieldChange);

  $('presetSelect').onchange = () => {
    const preset = PRESETS[$('presetSelect').value];
    if (preset) {
      applyParamsToForm(preset.values);
      updateConditionalFields();
      scheduleRecalc();
    }
  };
  $('saveCurve').onclick = saveCurrentResult;
  $('resetCurves').onclick = () => {
    appState.savedCurves = [];
    appState.lastResult = null;
    saveSetups([]);
    updateSavedCurves();
    purgeCharts();
    updateStatsPanel();
    renderSightTable(null);
    runSim();
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
    const button = $(buttonId);
    if (!button) return;
    button.onclick = () => {
      appState.activeTab = tabId;
      showTab(tabId);
      resizeCharts();
    };
  });

  window.addEventListener('resize', debounce(resizeCharts, 150));
}

function handleUiModeChange() {
  updateConditionalFields();
  updateSpineRecommendation();
  updateDerivedPanels();
  resizeCharts();
}

function handleConditionalFieldChange() {
  updateConditionalFields();
}

function handleImmediateSpineInput() {
  updateSpineRecommendation();
}

function bootstrap() {
  bindEvents();
  const persisted = loadSetups();
  if (Array.isArray(persisted) && persisted.length) {
    appState.savedCurves = persisted.filter(c => c?.curveData?.length);
    updateSavedCurves();
    const last = appState.savedCurves[appState.savedCurves.length - 1];
    if (last) {
      appState.lastResult = last;
      const recommendation = resolveSpineRecommendation(last.params);
      const comparison = buildSpineComparison(last.params, recommendation);
      updateStatsPanel(last.stats, last.arrow, last.tuning, recommendation, comparison, last.params);
      renderSightTable(last);
    }
    renderAllCharts(curvesForDisplay());
  }
  updateConditionalFields();
  updateSpineRecommendation();
  updateDerivedPanels();
  if (!loadConfigFromUrl()) runSim();
}

bootstrap();

