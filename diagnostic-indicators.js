// Modèle unique des indicateurs affichés dans statsPanel.
// Les diagnostics restent qualitatifs et séparés de la trajectoire COM.

import { clamp } from './units.js';

export function evaluateFoc(focPercent, bowType = 'recurve') {
  if (!Number.isFinite(focPercent)) {
    return { value: null, status: 'unknown', colorKey: 'unknown', label: 'non disponible', note: 'FOC non disponible.', score: 50 };
  }
  if (focPercent < 0 || focPercent > 35) {
    return { value: focPercent, status: 'bad', colorKey: 'bad', label: 'FOC incohérent', note: 'Hors domaine réaliste.', score: 0 };
  }

  let score;
  let status;
  let label;
  let note;

  if (focPercent < 5) {
    score = interpolate(focPercent, 0, 5, 12, 34);
    status = focPercent < 3 ? 'bad' : 'warning';
    label = 'FOC bas';
    note = 'Stabilité avant faible.';
  } else if (focPercent < 8) {
    score = interpolate(focPercent, 5, 8, 35, 58);
    status = 'warning';
    label = 'FOC faible';
    note = 'À surveiller au tir.';
  } else if (focPercent < 12) {
    score = interpolate(focPercent, 8, 12, 60, 79);
    status = focPercent < 10 ? 'medium' : 'good';
    label = 'FOC exploitable';
    note = 'Équilibre cohérent.';
  } else if (focPercent < 16) {
    score = interpolate(focPercent, 12, 16, 80, 89);
    status = 'good';
    label = 'FOC bon';
    note = 'Équilibre favorable.';
  } else if (focPercent <= 20) {
    score = interpolate(focPercent, 16, 20, 90, 100);
    status = 'good';
    label = 'FOC très bon';
    note = 'Avant bien stabilisé.';
  } else if (focPercent <= 25) {
    const compoundFriendly = bowType === 'compound';
    score = interpolate(focPercent, 20, 25, compoundFriendly ? 84 : 72, compoundFriendly ? 66 : 54);
    status = compoundFriendly ? 'medium' : 'warning';
    label = 'FOC élevé';
    note = compoundFriendly ? 'Encore exploitable.' : 'Réglage plus sensible.';
  } else {
    score = interpolate(focPercent, 25, 35, 48, 18);
    status = focPercent < 30 ? 'warning' : 'bad';
    label = 'FOC très élevé';
    note = 'Très élevé / expérimental.';
  }

  return { value: focPercent, status, colorKey: status, label, note, score: Math.round(clamp(score, 0, 100)) };
}

export function evaluateSpine(comparison = {}, mismatchSeverity = 0) {
  const severity = clamp(Number.isFinite(mismatchSeverity) ? mismatchSeverity : 0, 0, 1);
  if (comparison.status === 'in-range') {
    return { status: 'good', colorKey: 'good', label: 'dans la plage', note: 'rigidité du tube', score: 92 };
  }
  if (comparison.status === 'too-soft' || comparison.status === 'too-stiff') {
    const score = Math.round(clamp(78 - severity * 58, 20, 78));
    const status = severity > 0.55 ? 'bad' : 'warning';
    return {
      status,
      colorKey: status,
      label: comparison.status === 'too-soft' ? 'trop souple' : 'trop raide',
      note: 'rigidité du tube',
      score
    };
  }
  return { status: 'unknown', colorKey: 'unknown', label: 'indisponible', note: 'rigidité du tube', score: 50 };
}

export function evaluateAoa(aoa = {}) {
  const value = Number.isFinite(aoa.maxEstimatedDeg) ? aoa.maxEstimatedDeg : null;
  if (value === null) {
    return { value, status: 'unknown', colorKey: 'unknown', label: 'non disponible', note: 'angle d’attaque', score: 50 };
  }
  const score = Math.round(clamp(100 - value * 22, 0, 100));
  const status = getIndicatorStatus('aoa', value);
  return { value, status, colorKey: status, label: `${value.toFixed(2)}°`, note: 'angle d’attaque', score };
}

export function evaluateOscillation(channel = {}, kind = 'porpoising') {
  const value = Number.isFinite(channel.amplitudeCm) ? channel.amplitudeCm : null;
  const note = kind === 'porpoising' ? 'oscillation verticale' : 'oscillation latérale';
  if (value === null) {
    return { value, status: 'unknown', colorKey: 'unknown', label: 'non disponible', note, score: 50 };
  }
  const scoreThreshold = kind === 'porpoising' ? 4 : 4.5;
  const score = Math.round(clamp(100 - (value / scoreThreshold) * 70, 0, 100));
  const status = getIndicatorStatus(kind, value);
  return { value, status, colorKey: status, label: `${value.toFixed(2)} cm`, note, score };
}

export function getIndicatorStatus(metricName, value) {
  if (!Number.isFinite(value)) return 'unknown';
  if (metricName === 'aoa') {
    return value > 4 ? 'bad' : value > 3 ? 'warning' : value > 2 ? 'medium' : 'good';
  }
  if (metricName === 'porpoising') {
    return value > 4 ? 'bad' : value > 2.5 ? 'warning' : value > 1.2 ? 'medium' : 'good';
  }
  if (metricName === 'fishtailing') {
    return value > 4.5 ? 'bad' : value > 3 ? 'warning' : value > 1.4 ? 'medium' : 'good';
  }
  if (metricName === 'stability') {
    return value <= 35 ? 'bad' : value <= 55 ? 'warning' : value <= 70 ? 'medium' : 'good';
  }
  return 'unknown';
}

export function getIndicatorStyle(status = 'unknown') {
  const styles = {
    bad: ['indicator-bad', 'indicator-border-bad', 'indicator-glow-bad'],
    warning: ['indicator-warning', 'indicator-border-warning', 'indicator-glow-warning'],
    medium: ['indicator-medium', 'indicator-border-medium', 'indicator-glow-medium'],
    good: ['indicator-good', 'indicator-border-good', 'indicator-glow-good'],
    unknown: ['indicator-unknown', 'indicator-border-unknown', 'indicator-glow-unknown']
  };
  const uxStatus = status === 'excellent' ? 'good' : status;
  const [textClass, borderClass, glowClass] = styles[uxStatus] || styles.unknown;
  return { textClass, borderClass, glowClass };
}

export function computeStabilityScore({ foc, spine, aoa, porpoising, fishtailing }) {
  const weightedScore =
    scoreOf(foc) * 0.2 +
    scoreOf(spine) * 0.25 +
    scoreOf(aoa) * 0.15 +
    scoreOf(porpoising) * 0.2 +
    scoreOf(fishtailing) * 0.2;
  const score = Math.round(clamp(weightedScore, 0, 100));
  const status = getIndicatorStatus('stability', score);
  const label = status === 'bad'
    ? 'instable'
    : status === 'warning'
      ? 'à corriger'
      : status === 'medium'
        ? 'correct'
        : score > 85
          ? 'très bon'
          : 'bon';
  return { score, status, colorKey: status, label };
}

export function buildStatsCardsModel({ stats = {}, arrow = {}, tuning = {}, comparison = {}, bowType = 'recurve' } = {}) {
  const foc = arrow.focEvaluation || evaluateFoc(arrow.focPercent, bowType);
  const spine = evaluateSpine(comparison, comparison.severity);
  const aoa = evaluateAoa(tuning.aoa);
  const porpoising = evaluateOscillation(tuning.porpoising, 'porpoising');
  const fishtailing = evaluateOscillation(tuning.fishtailing, 'fishtailing');
  const stability = computeStabilityScore({ foc, spine, aoa, porpoising, fishtailing });

  return {
    evaluations: { foc, spine, aoa, porpoising, fishtailing, stability },
    ballisticCards: [
      { label: 'PORTÉE', value: format(stats.portée, 1, 'm'), hint: '' },
      { label: 'HAUTEUR MAX', value: format(stats.hauteur, 2, 'm'), hint: '' },
      { label: 'TEMPS VOL', value: format(stats.tvol, 2, 's'), hint: '' },
      { label: 'VITESSE IMPACT', value: format(stats.vfinal, 1, 'fps'), hint: '' },
      { label: 'ÉNERGIE IMPACT', value: format(stats.energyImpact, 1, 'J'), hint: '' },
      { label: 'MOMENTUM', value: format(stats.momentumImpact, 2, 'kg·m/s'), hint: 'quantité de mouvement' }
    ],
    diagnosticCards: [
      { label: 'FOC', value: foc.value === null ? '—' : `${foc.value.toFixed(1)}%`, hint: 'équilibre avant/arrière', status: foc.status, sublabel: foc.label },
      { label: 'SPINE', value: spine.label, hint: 'rigidité du tube', status: spine.status, sublabel: '' },
      { label: 'AOA', value: aoa.value === null ? '—' : `${aoa.value.toFixed(2)}°`, hint: 'angle d’attaque', status: aoa.status, sublabel: '' },
      { label: 'PORPOISING', value: porpoising.value === null ? '—' : `${porpoising.value.toFixed(2)} cm`, hint: 'oscillation verticale', status: porpoising.status, sublabel: '' },
      { label: 'FISHTAILING', value: fishtailing.value === null ? '—' : `${fishtailing.value.toFixed(2)} cm`, hint: 'oscillation latérale', status: fishtailing.status, sublabel: '' },
      { label: 'STABILITÉ', value: `${stability.score}/100`, hint: stability.label, status: stability.status, sublabel: '' }
    ]
  };
}

function interpolate(value, min, max, start, end) {
  if (max === min) return end;
  return start + (end - start) * clamp((value - min) / (max - min), 0, 1);
}

function scoreOf(indicator = {}) {
  return Number.isFinite(indicator.score) ? indicator.score : 50;
}

function format(value, digits, unit) {
  return `${Number.isFinite(value) ? value.toFixed(digits) : (0).toFixed(digits)} ${unit}`;
}
