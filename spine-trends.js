// spine-trends.js
// Tendances qualitatives autorisées. Aucun "spine optimal", aucun score dynamique numérique.

const BASE_QUALITATIVE_TRENDS = [
  'Le spine statique est une mesure de déflexion.',
  'Nombre de spine plus bas = tube plus raide ; nombre plus haut = tube plus souple.'
];

export function compareSpineStiffness(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 'unknown';
  if (a === b) return 'equal';
  return a < b ? 'stiffer' : 'softer';
}

export function getSpineQualitativeTrends(params = {}) {
  const trends = [...BASE_QUALITATIVE_TRENDS];
  const reference = params.reference || {};

  addDrawWeightTrend(trends, params.drawWeightLbs, reference.drawWeightLbs);
  addArrowLengthTrend(trends, params.arrowLengthIn, reference.arrowLengthIn);
  addFrontWeightTrend(trends, resolveFrontWeight(params), resolveFrontWeight(reference));

  return trends;
}

function addDrawWeightTrend(trends, current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || current === previous) return;
  if (current > previous) {
    trends.push('Puissance plus élevée : demande généralement un tube plus raide, donc un numéro de spine plus bas.');
  } else {
    trends.push('Puissance plus faible : demande généralement moins de raideur.');
  }
}

function addArrowLengthTrend(trends, current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || current === previous) return;
  if (current > previous) {
    trends.push('Flèche plus longue : tendance à se comporter plus souple dynamiquement.');
  } else {
    trends.push('Flèche plus courte : tendance à se comporter plus raide dynamiquement.');
  }
}

function addFrontWeightTrend(trends, current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || current === previous) return;
  if (current > previous) {
    trends.push('Pointe / insert plus lourds : tendance à se comporter plus souple dynamiquement.');
  } else {
    trends.push('Pointe / insert plus légers : tendance à se comporter plus raide dynamiquement.');
  }
}

function resolveFrontWeight(params = {}) {
  const point = Number.isFinite(params.pointWeightGrains) ? params.pointWeightGrains : 0;
  const insert = Number.isFinite(params.insertWeightGrains) ? params.insertWeightGrains : 0;
  if (!Number.isFinite(params.pointWeightGrains) && !Number.isFinite(params.insertWeightGrains)) {
    return NaN;
  }
  return point + insert;
}
