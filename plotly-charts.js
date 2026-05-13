// plotly-charts.js
// Construction et rendu des graphes Plotly: 2D, énergie, temps, holdover, 3D, dérive, tuning et AoA.

import { buildSightMarks } from './calibration.js';

const Plotly = window.Plotly;

const chartIds = ['trajectory2D', 'energyChart', 'timeChart', 'holdoverChart', 'trajectory3D', 'driftChart', 'tuningChart', 'aoaChart'];

export function showTab(tab) {
  chartIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = id === tab ? '' : 'none';
  });
  document.querySelectorAll('.tabs button').forEach(btn => btn.classList.remove('tab-active'));
  const map = {
    trajectory2D: 'tab2d',
    energyChart: 'tabEnergy',
    timeChart: 'tabTime',
    holdoverChart: 'tabHoldover',
    trajectory3D: 'tab3d',
    driftChart: 'tabDrift',
    tuningChart: 'tabTuning',
    aoaChart: 'tabAoa'
  };
  document.getElementById(map[tab])?.classList.add('tab-active');
}

export function purgeCharts() {
  chartIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) Plotly.purge(id);
  });
}

export function renderAllCharts(curves) {
  if (!curves.length) {
    purgeCharts();
    return;
  }

  const traces2d = [];
  const energy = [];
  const time = [];
  const hold = [];
  const traces3d = [];
  const drift = [];
  const tuning = [];
  const aoa = [];

  curves.forEach(curve => {
    const { curveData, color, label, params } = curve;
    traces2d.push(trace2d(curveData, color, label));
    if (params.dispersionEnabled) traces2d.push(traceDispersion2d(curveData, color, `${label} dispersion`));
    energy.push(traceDistance(curveData, color, label, 'energy', 'Énergie', 'J'));
    time.push(traceDistance(curveData, color, label, 'time', 'Temps', 's'));
    hold.push(traceHoldover(curveData, params, color, label));
    traces3d.push(trace3d(curveData, color, label));
    if (params.dispersionEnabled) traces3d.push(traceDispersion3d(curveData, color, `${label} cône`));
    drift.push(traceDistance(curveData, color, label, 'driftCm', 'Dérive', 'cm'));
    tuning.push(...traceTuning(curveData, color, label));
    aoa.push(traceDistance(curveData, color, label, 'aoaDeg', 'Angle d’attaque', '°'));
  });

  const common = {
    margin: { l: 44, r: 20, b: 60, t: 30 },
    height: 420,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    legend: { orientation: 'h', xanchor: 'center', x: 0.5, y: -0.2, font: { color: 'white', size: 10 } },
    hovermode: 'closest',
    showlegend: true
  };
  const config = { displayModeBar: false, responsive: true, scrollZoom: false, displaylogo: false };

  Plotly.react('trajectory2D', traces2d, {
    ...common,
    xaxis: axis('Distance (m)'),
    yaxis: { ...axis('Hauteur (m)'), scaleanchor: 'x', scaleratio: 1 }
  }, config);
  Plotly.react('energyChart', energy, { ...common, xaxis: axis('Distance (m)'), yaxis: axis('Énergie (J)') }, config);
  Plotly.react('timeChart', time, { ...common, xaxis: axis('Distance (m)'), yaxis: axis('Temps (s)') }, config);
  Plotly.react('holdoverChart', hold, { ...common, xaxis: axis('Distance (m)'), yaxis: axis('Holdover (cm)') }, config);
  Plotly.react('trajectory3D', traces3d, {
    ...common,
    scene: {
      xaxis: axis3d('Distance (m)'),
      yaxis: axis3d('Dérive z (m)'),
      zaxis: axis3d('Hauteur (m)'),
      bgcolor: 'rgba(0,0,0,0)'
    }
  }, config);
  Plotly.react('driftChart', drift, { ...common, xaxis: axis('Distance (m)'), yaxis: axis('Dérive latérale (cm)') }, config);
  Plotly.react('tuningChart', tuning, { ...common, xaxis: axis('Distance (m)'), yaxis: axis('Oscillation (cm)') }, config);
  Plotly.react('aoaChart', aoa, { ...common, xaxis: axis('Distance (m)'), yaxis: axis('Angle d’attaque (°)') }, config);
}

function axis(title) {
  return { title, color: '#fff', showgrid: false, zeroline: false, automargin: true };
}

function axis3d(title) {
  return { title, color: '#fff', gridcolor: 'rgba(255,255,255,0.12)', zerolinecolor: 'rgba(255,255,255,0.25)' };
}

function trace2d(points, color, label) {
  return {
    x: points.map(p => p.x),
    y: points.map(p => p.y),
    mode: 'lines',
    type: 'scattergl',
    name: label,
    line: { width: 1.8, color },
    text: points.map(p => `<b>${label}</b><br>Distance: ${p.x.toFixed(1)} m<br>Hauteur: ${p.y.toFixed(2)} m<br>Dérive: ${(p.z * 100).toFixed(1)} cm<br>Énergie: ${p.energy.toFixed(1)} J`),
    hoverinfo: 'text'
  };
}

function trace3d(points, color, label) {
  return {
    x: points.map(p => p.x),
    y: points.map(p => p.z),
    z: points.map(p => p.y),
    mode: 'lines',
    type: 'scatter3d',
    name: label,
    line: { width: 4, color },
    hoverinfo: 'name+x+y+z'
  };
}

function traceDispersion2d(points, color, label) {
  const sampled = points.filter((_, i) => i % Math.max(1, Math.floor(points.length / 80)) === 0);
  const upper = sampled.map(p => p.y + p.dispersionRadiusCm / 100);
  const lower = sampled.map(p => p.y - p.dispersionRadiusCm / 100).reverse();
  return {
    x: [...sampled.map(p => p.x), ...sampled.map(p => p.x).reverse()],
    y: [...upper, ...lower],
    fill: 'toself',
    type: 'scatter',
    mode: 'lines',
    name: label,
    line: { width: 0, color },
    fillcolor: 'rgba(0,247,255,0.10)',
    hoverinfo: 'skip',
    showlegend: true
  };
}

function traceDispersion3d(points, color, label) {
  const sampled = sampleAtDistances(points).filter((_, i) => i % 2 === 0);
  return {
    x: sampled.map(p => p.x),
    y: sampled.map(p => p.z),
    z: sampled.map(p => p.y),
    mode: 'markers',
    type: 'scatter3d',
    name: label,
    marker: {
      color,
      opacity: 0.25,
      size: sampled.map(p => Math.max(2, p.dispersionRadiusCm))
    },
    hoverinfo: 'skip'
  };
}

function traceDistance(points, color, label, key, title, unit) {
  const sampled = sampleAtDistances(points);
  return {
    x: sampled.map(p => p.distance),
    y: sampled.map(p => key === 'driftCm' ? p.z * 100 : p[key]),
    mode: 'lines+markers',
    type: 'scattergl',
    name: label,
    line: { width: 2, color },
    text: sampled.map(p => `<b>${label}</b><br>Distance: ${p.distance} m<br>${title}: ${(key === 'driftCm' ? p.z * 100 : p[key]).toFixed(2)} ${unit}`),
    hoverinfo: 'text'
  };
}

function traceHoldover(points, params, color, label) {
  const marks = buildSightMarks(points, params);
  return {
    x: marks.map(p => p.distance),
    y: marks.map(p => p.holdoverCm),
    mode: 'lines+markers',
    type: 'scattergl',
    name: label,
    line: { width: 2, color },
    text: marks.map(p => `<b>${label}</b><br>Distance: ${p.distance} m<br>Holdover: ${p.holdoverCm.toFixed(1)} cm<br>Dérive: ${p.driftCm.toFixed(1)} cm`),
    hoverinfo: 'text'
  };
}

function traceTuning(points, color, label) {
  return [
    {
      x: points.map(p => p.x),
      y: points.map(p => p.porpoiseCm),
      mode: 'lines',
      type: 'scattergl',
      name: `${label} porpoising`,
      line: { width: 1.5, color }
    },
    {
      x: points.map(p => p.x),
      y: points.map(p => p.fishtailCm),
      mode: 'lines',
      type: 'scattergl',
      name: `${label} fishtailing`,
      line: { width: 1.5, color, dash: 'dot' }
    }
  ];
}

function sampleAtDistances(points) {
  const distances = Array.from({ length: 21 }, (_, i) => i * 5);
  const out = [];
  let idx = 0;
  for (const p of points) {
    while (idx < distances.length && p.x >= distances[idx]) {
      out.push({ ...p, distance: distances[idx] });
      idx++;
    }
    if (idx >= distances.length) break;
  }
  return out;
}
