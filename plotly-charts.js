// plotly-charts.js
// Construction et rendu des graphes Plotly: 2D, énergie, temps, holdover, 3D, dérive, tuning et AoA.

import { buildSightMarks } from './calibration.js';
import {
  interpolatePointAtDistance,
  pointDriftM,
  pointEnergyJ,
  pointHeightM
} from './util.js';

const Plotly = window.Plotly;
const chartIds = ['trajectory2D', 'energyChart', 'timeChart', 'holdoverChart', 'trajectory3D', 'driftChart', 'tuningChart', 'aoaChart'];
const mobileLayoutQuery = window.matchMedia('(max-width: 767px)');
const DEFAULT_3D_CAMERA = {
  eye: { x: 1.7, y: 1.45, z: 0.85 },
  projection: { type: 'orthographic' }
};
let activeTab = 'trajectory2D';
let chartState = null;
let renderedChartIds = new Set();
let legendVisible = true;

export function showTab(tab) {
  activeTab = tab;
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
  document.getElementById('chart')?.classList.toggle('is-3d-active', tab === 'trajectory3D');
  renderActiveChart();
  resizeCharts();
}

export function resizeCharts() {
  renderedChartIds.forEach(id => {
    const el = document.getElementById(id);
    if (el?.data) {
      const resize = Plotly.Plots.resize(el);
      if (resize?.catch) resize.catch(() => {});
    }
  });
}

export function purgeCharts() {
  chartIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) Plotly.purge(id);
  });
  renderedChartIds = new Set();
  chartState = null;
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
    energy.push(traceDistance(curveData, color, label, pointEnergyJ, 'Énergie', 'J'));
    time.push(traceDistance(curveData, color, label, p => p.time, 'Temps', 's'));
    hold.push(traceHoldover(curveData, params, color, label));
    traces3d.push(trace3d(curveData, color, label));
    if (params.dispersionEnabled) traces3d.push(traceDispersion3d(curveData, color, `${label} cône`));
    drift.push(traceDistance(curveData, color, label, p => pointDriftM(p) * 100, 'Dérive', 'cm'));
    tuning.push(...traceTuning(curveData, color, label));
    if (hasNumericField(curveData, 'aoaDeg')) {
      aoa.push(traceDistance(curveData, color, label, p => p.aoaDeg, 'AoA proxy', '°'));
    }
  });

  const common = buildCommonLayout();
  chartState = {
    trajectory2D: {
      traces: traces2d,
      layout: {
        ...common,
        dragmode: isMobileLayout() ? 'pan' : 'zoom',
        xaxis: axis('Distance (m)'),
        yaxis: { ...axis('Hauteur (m)'), scaleanchor: 'x', scaleratio: 1 }
      }
    },
    energyChart: {
      traces: energy,
      layout: {
        ...common,
        dragmode: isMobileLayout() ? 'pan' : 'zoom',
        xaxis: axis('Distance (m)'),
        yaxis: axis('Énergie (J)')
      }
    },
    timeChart: {
      traces: time,
      layout: {
        ...common,
        dragmode: isMobileLayout() ? 'pan' : 'zoom',
        xaxis: axis('Distance (m)'),
        yaxis: axis('Temps (s)')
      }
    },
    holdoverChart: {
      traces: hold,
      layout: {
        ...common,
        dragmode: isMobileLayout() ? 'pan' : 'zoom',
        xaxis: axis('Distance (m)'),
        yaxis: axis('Compensation (cm)')
      }
    },
    trajectory3D: {
      traces: traces3d,
      layout: {
        ...common,
        scene: {
          xaxis: axis3d('Distance (m)'),
          yaxis: axis3d('Dérive y (m)'),
          zaxis: axis3d('Hauteur (m)'),
          aspectmode: 'data',
          camera: DEFAULT_3D_CAMERA,
          bgcolor: 'rgba(0,0,0,0)'
        }
      }
    },
    driftChart: {
      traces: drift,
      layout: {
        ...common,
        dragmode: isMobileLayout() ? 'pan' : 'zoom',
        xaxis: axis('Distance (m)'),
        yaxis: axis('Dérive latérale (cm)')
      }
    },
    tuningChart: {
      traces: tuning,
      layout: {
        ...common,
        dragmode: isMobileLayout() ? 'pan' : 'zoom',
        xaxis: axis('Distance (m)'),
        yaxis: axis('Oscillation (cm)')
      }
    },
    aoaChart: {
      traces: aoa,
      layout: {
        ...common,
        dragmode: isMobileLayout() ? 'pan' : 'zoom',
        xaxis: axis('Distance (m)'),
        yaxis: axis('Angle d’attaque proxy diagnostic (°)')
      }
    }
  };

  if (shouldRenderAllCharts()) {
    chartIds.forEach(renderChart);
  } else if (shouldRenderActiveChart()) {
    renderActiveChart();
  }
  resizeCharts();
}

export function renderActiveChart() {
  if (!chartState || !shouldRenderActiveChart()) return;
  renderChart(activeTab);
}

export function setLegendVisibility(visible) {
  legendVisible = visible;
  if (!chartState) return;
  Object.values(chartState).forEach(({ layout }) => {
    layout.showlegend = visible;
  });
  if (shouldRenderAllCharts()) {
    chartIds.forEach(renderChart);
  } else if (shouldRenderActiveChart()) {
    renderActiveChart();
  }
}

export function resetThreeDView() {
  const el = document.getElementById('trajectory3D');
  if (!el?.data) return;
  Plotly.relayout(el, { 'scene.camera': DEFAULT_3D_CAMERA });
}

function isMobileLayout() {
  return mobileLayoutQuery.matches;
}

function shouldRenderAllCharts() {
  return !isMobileLayout();
}

function shouldRenderActiveChart() {
  return !isMobileLayout() || document.body.dataset.mobilePanel === 'graphs';
}

function renderChart(id) {
  const chart = chartState?.[id];
  if (!chart) return;
  Plotly.react(id, chart.traces, chart.layout, chartConfig());
  renderedChartIds.add(id);
}

function buildCommonLayout() {
  const mobile = isMobileLayout();
  return {
    margin: mobile ? { l: 42, r: 16, b: 58, t: 20 } : { l: 44, r: 20, b: 60, t: 30 },
    height: chartHeight(),
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    legend: {
      orientation: 'h',
      xanchor: 'center',
      x: 0.5,
      y: mobile ? -0.23 : -0.2,
      font: { color: 'white', size: mobile ? 9 : 10 }
    },
    hovermode: 'closest',
    showlegend: legendVisible
  };
}

function chartConfig() {
  return {
    displayModeBar: false,
    responsive: true,
    scrollZoom: false,
    displaylogo: false
  };
}

function chartHeight() {
  if (isMobileLayout()) return Math.max(420, Math.min(Math.round(window.innerHeight * 0.7), 560));
  return window.innerWidth >= 1280 ? 560 : 420;
}

function axis(title) {
  return { title, color: '#fff', showgrid: false, zeroline: false, automargin: true };
}

function axis3d(title) {
  return {
    title,
    color: '#fff',
    showbackground: false,
    backgroundcolor: 'rgba(0,0,0,0)',
    showgrid: true,
    gridcolor: 'rgba(255,255,255,0.12)',
    zeroline: true,
    zerolinecolor: 'rgba(255,255,255,0.25)',
    showline: true,
    linecolor: 'rgba(255,255,255,0.35)'
  };
}

function trace2d(points, color, label) {
  const sampled = sampleForDisplay(points);
  return {
    x: sampled.map(p => p.x),
    y: sampled.map(pointHeightM),
    mode: 'lines',
    type: 'scattergl',
    name: label,
    line: { width: 1.8, color },
    text: sampled.map(p => `<b>${label}</b><br>Distance: ${formatHoverNumber(p.x, 1)} m<br>Hauteur: ${formatHoverNumber(pointHeightM(p), 2)} m<br>Vitesse: ${formatHoverNumber(p.fps, 1)} fps<br>Énergie: ${formatHoverNumber(pointEnergyJ(p), 1)} J<br>Temps: ${formatHoverNumber(p.time, 2)} s`),
    hoverinfo: 'text'
  };
}

function trace3d(points, color, label) {
  const sampled = sampleForDisplay(points);
  return {
    x: sampled.map(p => p.x),
    y: sampled.map(pointDriftM),
    z: sampled.map(pointHeightM),
    mode: 'lines',
    type: 'scatter3d',
    name: label,
    line: { width: 4, color },
    text: sampled.map(p => `<b>${label}</b><br>Distance: ${formatHoverNumber(p.x, 1)} m<br>Hauteur: ${formatHoverNumber(pointHeightM(p), 2)} m<br>Dérive: ${formatHoverNumber(pointDriftM(p) * 100, 1)} cm<br>Vitesse: ${formatHoverNumber(p.fps, 1)} fps<br>Énergie: ${formatHoverNumber(pointEnergyJ(p), 1)} J`),
    hoverinfo: 'text'
  };
}

function traceDispersion2d(points, color, label) {
  const sampled = sampleForDisplay(points, 80);
  const upper = sampled.map(p => pointHeightM(p) + p.dispersionRadiusCm / 100);
  const lower = sampled.map(p => pointHeightM(p) - p.dispersionRadiusCm / 100).reverse();
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
    y: sampled.map(pointDriftM),
    z: sampled.map(pointHeightM),
    mode: 'markers',
    type: 'scatter3d',
    name: label,
    marker: {
      color,
      opacity: 0.18,
      size: sampled.map(p => Math.min(10, Math.max(2, p.dispersionRadiusCm))),
      line: { width: 0 }
    },
    hoverinfo: 'skip'
  };
}

function traceDistance(points, color, label, valueForPoint, title, unit) {
  const sampled = sampleAtDistances(points);
  return {
    x: sampled.map(p => p.distance),
    y: sampled.map(valueForPoint),
    mode: 'lines+markers',
    type: 'scattergl',
    name: label,
    line: { width: 2, color },
    text: sampled.map(p => `<b>${label}</b><br>Distance: ${p.distance} m<br>${title}: ${formatHoverNumber(valueForPoint(p), 2)} ${unit}`),
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
    text: marks.map(p => `<b>${label}</b><br>Distance: ${p.distance} m<br>Compensation: ${p.holdoverCm.toFixed(1)} cm<br>Dérive: ${p.driftCm.toFixed(1)} cm`),
    hoverinfo: 'text'
  };
}

function traceTuning(points, color, label) {
  const sampled = sampleForDisplay(points);
  return [
    {
      x: sampled.map(p => p.x),
      y: sampled.map(p => p.porpoiseCm),
      mode: 'lines',
      type: 'scattergl',
      name: `${label} oscillation verticale`,
      line: { width: 1.5, color }
    },
    {
      x: sampled.map(p => p.x),
      y: sampled.map(p => p.fishtailCm),
      mode: 'lines',
      type: 'scattergl',
      name: `${label} oscillation latérale`,
      line: { width: 1.5, color, dash: 'dot' }
    }
  ];
}

function sampleForDisplay(points, maxPoints = 320) {
  if (!isMobileLayout() || points.length <= maxPoints) return points;
  const step = Math.ceil(points.length / maxPoints);
  const sampled = points.filter((_, index) => index % step === 0);
  const last = points[points.length - 1];
  if (sampled[sampled.length - 1] !== last) sampled.push(last);
  return sampled;
}

function sampleAtDistances(points) {
  const distances = Array.from({ length: 21 }, (_, i) => i * 5);
  return distances
    .map(distance => interpolatePointAtDistance(points, distance))
    .filter(Boolean);
}

function hasNumericField(points, key) {
  return points.some(point => Number.isFinite(point?.[key]));
}

function formatHoverNumber(value, digits) {
  return Number.isFinite(value) ? value.toFixed(digits) : '—';
}
