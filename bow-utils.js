// bow-utils.js
// Normalisation légère des familles d'arc visibles et des anciennes valeurs sauvegardées.

export function normalizeBowType(value = '') {
  if (value === 'compound' || value.startsWith('compound_')) return 'compound';
  if (
    value === 'recurve' ||
    value.startsWith('recurve_') ||
    value === 'barebow_field'
  ) {
    return 'recurve';
  }
  if (value === 'traditional' || value === 'longbow_traditional') return 'traditional';
  return '';
}

export function deriveInternalReleaseType(value = '') {
  return normalizeBowType(value) === 'compound' ? 'mechanical' : 'fingers';
}
