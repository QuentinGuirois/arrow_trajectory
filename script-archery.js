import { computeCd, calculateAirDensity, calculateEnergy, fpsToMetersPerSecond, metersPerSecondToFPS } from './physics-archery.js';

const Plotly = window.Plotly;
const trajWorker = new Worker('./trajectory.worker-archery.js', { type: 'module' });

const COLORS = [
  "#43b0f1", "#bd00ff", "#00ff9d", "#ffbe0b", "#f94144", "#0ef6cc", "#1d3557", "#f3722c"
];

let savedCurves = [];
let activeTab = 'trajectory2D';

const $ = id => document.getElementById(id);

// Récupère tous les paramètres du formulaire
function getFormValues() {
  return {
    fps: parseFloat($('fps').value) || 200,
    poidsGr: parseFloat($('poidsGr').value) || 25,
    diameter: (parseFloat($('diameter').value) || 7) / 1000,
    plumeType: $('plumeType').value,
    angleDeg: parseFloat($('angleDeg').value) || 3,
    shootingHeight: 1.5,
    pressureHpa: parseFloat($('pressureHpa').value) || 1020,
    temperatureCelsius: parseFloat($('temperatureCelsius').value) || 20,
    scopeOffset: (parseFloat($('scopeOffset').value) || 5) / 100,
    scopeAngleDeg: parseFloat($('scopeAngleDeg').value) || 0
  };
}

function updateEnergyDisplay() {
  const poidsGr = parseFloat($('poidsGr').value) || 25;
  const fps = parseFloat($('fps').value) || 200;
  const v = fpsToMetersPerSecond(fps);
  const m = poidsGr / 1000;
  const energy = 0.5 * m * v * v;
  $('energyInit').textContent = energy.toFixed(1) + ' J';
}

// Génère le label d'une config (pour légende)
function getCurveLabel(params) {
  return `${params.poidsGr}g @ ${params.fps}fps, ${params.angleDeg}°, ${params.plumeType}`;
}

// ----------- Plotly/Graphique -----------

// Courbe 2D trajectoire
function build2DTraceSplit(dataPoints, color, label) {
  return {
    x: dataPoints.map(p => p.x),
    y: dataPoints.map(p => p.y),
    mode: 'lines',
    type: 'scattergl',
    name: label,
    line: { width: 1.5, color },
    text: dataPoints.map(p =>
      `<b>${label}</b><br>Distance: ${p.x.toFixed(2)} m<br>Hauteur: ${p.y.toFixed(2)} m<br>Énergie: ${p.energy.toFixed(2)} J`
    ),
    hoverinfo: 'text'
  };
}

function buildCanonLineTrace(angleDeg, maxRange, color = 'grey', label = 'Axe du tir') {
  const rad = angleDeg * Math.PI / 180;
  const N = 40, step = maxRange / (N - 1);
  let xArr = [], yArr = [];
  for (let i = 0; i < N; i++) {
    const d = i * step;
    xArr.push(d);
    yArr.push(1.5 + d * Math.tan(rad));
  }
  return {
    x: xArr,
    y: yArr,
    mode: 'lines',
    type: 'scattergl',
    name: label,
    line: { width: 1, dash: 'dash', color },
    hoverinfo: 'none',
    showlegend: false
  };
}

function buildScopeLineTrace(scopeOffsetM, scopeAngleDeg, maxRange, color = 'white', label = 'Axe de visée') {
  const rad = scopeAngleDeg * Math.PI / 180;
  const N = 40, step = maxRange / (N - 1);
  let xArr = [], yArr = [];
  for (let i = 0; i < N; i++) {
    const d = i * step;
    const yVal = (1.5 + scopeOffsetM) + d * Math.tan(rad);
    xArr.push(d);
    yArr.push(yVal);
  }
  return {
    x: xArr,
    y: yArr,
    mode: 'lines',
    type: 'scattergl',
    name: label,
    line: { width: 1, dash: 'dot', color },
    hoverinfo: 'none',
    showlegend: false
  };
}

function plotTabsShow(tab) {
  ['trajectory2D', 'energyChart', 'timeChart', 'holdoverChart'].forEach(id => {
    $(id).style.display = id === tab ? '' : 'none';
  });
  activeTab = tab;
  document.querySelectorAll('.tabs button').forEach(btn => btn.classList.remove('tab-active'));
  if(tab === 'trajectory2D') $('tab2d').classList.add('tab-active');
  if(tab === 'energyChart') $('tabEnergy').classList.add('tab-active');
  if(tab === 'timeChart') $('tabTime').classList.add('tab-active');
  if(tab === 'holdoverChart') $('tabHoldover').classList.add('tab-active');
}

// ----------- TABLES -----------

// -- Energy Table
function calculateEnergyAtDistances(data) {
  const targets = Array.from({ length: 21 }, (_, i) => i * 5);
  let results = [];
  let idx = 0;
  for (let i = 0; i < data.length; i++) {
    const p = data[i];
    while (idx < targets.length && p.x >= targets[idx]) {
      results.push({ distance: targets[idx], energy: p.energy });
      idx++;
    }
    if (idx >= targets.length) break;
  }
  return results;
}
function buildImpactChartTrace(points, color, label) {
  return {
    x: points.map(p => p.distance),
    y: points.map(p => p.energy),
    mode: 'lines+markers',
    type: 'scattergl',
    name: label,
    line: { width: 2, color },
    text: points.map(p =>
      `<b>${label}</b><br>Distance: ${p.distance} m<br>Énergie: ${p.energy.toFixed(2)} J`
    ),
    hoverinfo: 'text'
  };
}

// -- Time Table
function calculateTimesAtDistances(data) {
  const targetDistances = Array.from({ length: 21 }, (_, i) => i * 5);
  let results = [];
  let idx = 0;
  for (let i = 0; i < data.length; i++) {
    const p = data[i];
    const dist = Math.abs(p.x);
    while (idx < targetDistances.length && dist >= targetDistances[idx]) {
      results.push({
        distance: targetDistances[idx],
        time: p.time,
        energy: p.energy
      });
      idx++;
    }
    if (idx >= targetDistances.length) break;
  }
  return results;
}
function buildTimeChartTrace(points, color, label) {
  return {
    x: points.map(p => p.distance),
    y: points.map(p => p.time),
    mode: 'lines+markers',
    type: 'scattergl',
    name: label,
    line: { width: 2, color },
    text: points.map(p =>
      `<b>${label}</b><br>Distance: ${p.distance} m<br>Temps: ${p.time.toFixed(2)} s<br>Énergie: ${p.energy.toFixed(2)} J`
    ),
    hoverinfo: 'text'
  };
}

// -- Holdover Table
function buildHoldoverData(data, scopeAngleDeg, scopeOffsetM) {
  const rad = scopeAngleDeg * Math.PI / 180;
  function scopeLineY(x) {
    return (1.5 + scopeOffsetM) + x * Math.tan(rad);
  }
  const stepDist = [0, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100];
  let results = [], idx = 0;
  for (let i = 0; i < data.length; i++) {
    const p = data[i];
    while (idx < stepDist.length && p.x >= stepDist[idx]) {
      const diffM = p.y - scopeLineY(p.x);
      results.push({
        distance: stepDist[idx],
        holdOverCm: diffM * 100,
        energy: p.energy
      });
      idx++;
    }
    if (idx >= stepDist.length) break;
  }
  return results;
}

function buildHoldoverChart(points, color, label) {
  return {
    x: points.map(p => p.distance),
    y: points.map(p => p.holdOverCm),
    mode: 'lines+markers',
    type: 'scattergl',
    name: label,
    line: { width: 2, color },
    text: points.map(p =>
      `<b>${label}</b><br>Distance: ${p.distance} m<br>Holdover: ${p.holdOverCm.toFixed(1)} cm<br>Énergie: ${p.energy.toFixed(2)} J`
    ),
    hoverinfo: 'text'
  };
}

// ----------- COURBES & STATS -----------

function calculateStats(data) {
  let maxY = -Infinity, maxYat = 0, maxX = 0, tfinal = 0, vfinal = 0;
  data.forEach(p => {
    if (p.y > maxY) { maxY = p.y; maxYat = p.x; }
    if (p.x > maxX) { maxX = p.x; tfinal = p.time; vfinal = p.fps; }
  });
  return {
    portée: maxX,
    hauteur: maxY,
    tvol: tfinal,
    vfinal: vfinal
  };
}
function updateStatsPanel(stats) {
  $('statsPanel').innerHTML = `
    <div class="card-glass p-4 text-center">
      <div class="text-cyan-400 text-sm">PORTÉE MAX</div>
      <div class="text-2xl font-bold mt-1">${stats.portée.toFixed(2)}m</div>
    </div>
    <div class="card-glass p-4 text-center">
      <div class="text-green-400 text-sm">HAUTEUR MAX</div>
      <div class="text-2xl font-bold mt-1">${stats.hauteur.toFixed(2)}m</div>
    </div>
    <div class="card-glass p-4 text-center">
      <div class="text-purple-400 text-sm">TEMPS VOL</div>
      <div class="text-2xl font-bold mt-1">${stats.tvol.toFixed(2)}s</div>
    </div>
    <div class="card-glass p-4 text-center">
      <div class="text-yellow-400 text-sm">VITESSE FINALE</div>
      <div class="text-2xl font-bold mt-1">${stats.vfinal.toFixed(1)} fps</div>
    </div>
  `;
}

// ---------- ENREGISTREMENT ET COMPARAISON COURBES -----------

function addCurveToHistory(params, label, color, stats, curveData) {
  savedCurves.push({ params, label, color, stats, curveData });
  updateSavedCurves();
  updateCurvesPlot();
}
function updateSavedCurves() {
  const list = $('savedCurves');
  list.innerHTML = '';
  savedCurves.forEach((curve, i) => {
    const card = document.createElement('div');
    card.className = 'trajectory-card card-glass p-4 border border-cyan-500/30 rounded-lg mb-2';
    card.innerHTML = `
      <div class="flex justify-between items-center">
        <div>
          <div class="font-bold" style="color:${curve.color}">${curve.label}</div>
          <div class="text-sm text-gray-400">${curve.params.fps} fps, ${curve.params.poidsGr}g, ${curve.params.angleDeg}°</div>
        </div>
        <div class="flex space-x-2">
          <button class="p-2 text-cyan-400 hover:text-cyan-300" data-index="${i}" data-action="show"><i class="fas fa-eye"></i></button>
          <button class="p-2 text-red-400 hover:text-red-300" data-index="${i}" data-action="delete"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;
    list.appendChild(card);
  });
  list.querySelectorAll('button[data-action="delete"]').forEach(btn => {
    btn.onclick = e => {
      const idx = parseInt(btn.dataset.index, 10);
      savedCurves.splice(idx, 1);
      updateSavedCurves();
      updateCurvesPlot();
    };
  });
  list.querySelectorAll('button[data-action="show"]').forEach(btn => {
    btn.onclick = e => {
      const idx = parseInt(btn.dataset.index, 10);
      // Réaffiche la courbe sélectionnée
      focusCurve(idx);
    };
  });
}
function updateCurvesPlot() {
  // Pour chaque tab
  if (!savedCurves.length) return;
  let allTraces2d = [];
  let allEnergy = [];
  let allTime = [];
  let allHold = [];
  savedCurves.forEach((curve, i) => {
    if (!curve.curveData) return;
    const label = curve.label;
    const color = curve.color;
    // Trajectoire 2D
    allTraces2d.push(build2DTraceSplit(curve.curveData, color, label));
    if (i === savedCurves.length - 1) {
      allTraces2d.push(buildCanonLineTrace(curve.params.angleDeg, curve.curveData[curve.curveData.length-1].x));
      allTraces2d.push(buildScopeLineTrace(curve.params.scopeOffset, curve.params.scopeAngleDeg, curve.curveData[curve.curveData.length-1].x));
    }
    // Énergie
    allEnergy.push(buildImpactChartTrace(calculateEnergyAtDistances(curve.curveData), color, label));
    // Temps
    allTime.push(buildTimeChartTrace(calculateTimesAtDistances(curve.curveData), color, label));
    // Holdover
    allHold.push(buildHoldoverChart(buildHoldoverData(curve.curveData, curve.params.scopeAngleDeg, curve.params.scopeOffset), color, label));
  });
  // Layout Plotly commun (proportions optimisées)
  const plotLayout = {
    xaxis: { title: 'Distance (m)', color: '#fff', showgrid: false, zeroline: false },
    yaxis: { title: 'Hauteur (m)', color: '#fff', showgrid: false, zeroline: false, scaleanchor: 'x', scaleratio: 1 },
    legend: { orientation: 'h', xanchor: 'center', x: 0.5, y: -0.2, font: { color: 'white', size: 10 } },
    margin: { l: 40, r: 20, b: 60, t: 40 },
    width: null,
    height: 400,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    dragmode: false,
    hovermode: 'closest',
    showlegend: true
  };
  const toolsLayout = {
    displayModeBar: false,
    responsive: true,
    scrollZoom: false,
    doubleClick: false,
    displaylogo: false,
    staticPlot: false
  };
  Plotly.react('trajectory2D', allTraces2d, plotLayout, toolsLayout);
  Plotly.react('energyChart', allEnergy, {...plotLayout, yaxis:{title:'Énergie (J)', automargin:true}}, toolsLayout);
  Plotly.react('timeChart', allTime, {...plotLayout, yaxis:{title:'Temps (s)', automargin:true}}, toolsLayout);
  Plotly.react('holdoverChart', allHold, {...plotLayout, yaxis:{title:'Holdover (cm)', automargin:true}}, toolsLayout);
}
function focusCurve(idx) {
  // Met en avant la courbe choisie (à la façon "eye" du projet d'airsoft)
  const curve = savedCurves[idx];
  savedCurves = [curve, ...savedCurves.filter((c,i)=>i!==idx)];
  updateSavedCurves();
  updateCurvesPlot();
  updateStatsPanel(curve.stats);
}

// ----------- PARTAGE -----------

function paramsToUrl(params) {
  const keys = ['fps','poidsGr','diameter','plumeType','angleDeg','pressureHpa','temperatureCelsius','scopeOffset','scopeAngleDeg'];
  return keys.map(k => `${k}=${encodeURIComponent(params[k])}`).join('&');
}
function urlToParams(str) {
  const obj = {};
  str.split('&').forEach(kv=>{
    const [k,v] = kv.split('=');
    obj[k]=decodeURIComponent(v);
  });
  if(obj.diameter) obj.diameter = parseFloat(obj.diameter);
  if(obj.scopeOffset) obj.scopeOffset = parseFloat(obj.scopeOffset);
  if(obj.fps) obj.fps = parseFloat(obj.fps);
  if(obj.poidsGr) obj.poidsGr = parseFloat(obj.poidsGr);
  if(obj.angleDeg) obj.angleDeg = parseFloat(obj.angleDeg);
  if(obj.pressureHpa) obj.pressureHpa = parseFloat(obj.pressureHpa);
  if(obj.temperatureCelsius) obj.temperatureCelsius = parseFloat(obj.temperatureCelsius);
  if(obj.scopeAngleDeg) obj.scopeAngleDeg = parseFloat(obj.scopeAngleDeg);
  return obj;
}
function applyParamsToForm(params) {
  $('fps').value = params.fps || 200;
  $('poidsGr').value = params.poidsGr || 25;
  $('diameter').value = ((params.diameter||0.007)*1000).toFixed(2);
  $('plumeType').value = params.plumeType || "moyenne";
  $('angleDeg').value = params.angleDeg || 0;
  $('pressureHpa').value = params.pressureHpa || 1020;
  $('temperatureCelsius').value = params.temperatureCelsius || 20;
  $('scopeOffset').value = ((params.scopeOffset||0.05)*100).toFixed(2);
  $('scopeAngleDeg').value = params.scopeAngleDeg || 0;
  updateEnergyDisplay();
}
function shareCurrentConfig() {
  const params = getFormValues();
  const url = window.location.origin+window.location.pathname+'#'+paramsToUrl(params);
  navigator.clipboard.writeText(url).then(()=>{
    alert("Lien de simulation copié !");
  });
}
function loadConfigFromUrl() {
  if(window.location.hash && window.location.hash.length>2) {
    const hash = window.location.hash.substring(1);
    const params = urlToParams(hash);
    applyParamsToForm(params);
    runSim(params, true);
  }
}

// ----------- SIMULATION PRINCIPALE -----------
function runSim(params, saveCurve = true) {
  trajWorker.onmessage = (e) => {
    if (!e.data.ok) return;
    const data = e.data.positions;
    const label = getCurveLabel(params);
    const color = COLORS[savedCurves.length % COLORS.length];
    // Stats
    const stats = calculateStats(data);

    if (saveCurve) {
      addCurveToHistory(params, label, color, stats, data);
    }
    updateStatsPanel(stats);
    updateCurvesPlot();
  };
  trajWorker.postMessage({
    type: 'calcTrajArchery',
    fps: params.fps,
    poids: params.poidsGr,
    angleDeg: params.angleDeg,
    diameter: params.diameter,
    plumeType: params.plumeType,
    physParams: {
      pressureHpa: params.pressureHpa,
      temperatureCelsius: params.temperatureCelsius,
      shootingHeight: 1.5
    }
  });
}

// ---------- EVENEMENTS UI ----------
['poidsGr', 'fps', 'diameter', 'plumeType', 'angleDeg', 'pressureHpa', 'temperatureCelsius', 'scopeOffset', 'scopeAngleDeg']
.forEach(id => {
  $(id).addEventListener('input', updateEnergyDisplay);
});
$('runBtn').onclick = () => {
  updateEnergyDisplay();
  plotTabsShow('trajectory2D');
  runSim(getFormValues(), true);
};
$('saveCurve').onclick = () => {
  runSim(getFormValues(), true);
};
$('resetCurves').onclick = () => {
  savedCurves = [];
  updateSavedCurves();
  updateCurvesPlot();
  updateStatsPanel({portée:0, hauteur:0, tvol:0, vfinal:0});
};
$('tab2d').onclick = () => plotTabsShow('trajectory2D');
$('tabEnergy').onclick = () => plotTabsShow('energyChart');
$('tabTime').onclick = () => plotTabsShow('timeChart');
$('tabHoldover').onclick = () => plotTabsShow('holdoverChart');

// PARTAGE bouton
const footerShare = document.querySelector('.fa-share-alt');
if(footerShare) footerShare.parentElement.onclick = shareCurrentConfig;

// Auto init
updateEnergyDisplay();
loadConfigFromUrl();
if (!window.location.hash) runSim(getFormValues(), true);

// Disable scroll zoom/pinch
['trajectory2D','energyChart','timeChart','holdoverChart'].forEach(id => {
  const el = $(id);
  el && el.addEventListener('wheel', e => e.preventDefault(), { passive:false });
});
