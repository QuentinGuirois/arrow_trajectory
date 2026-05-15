// spine-display.js
// Helpers purs pour garder l'affichage spine compact et français côté front.

import { normalizeBowType } from './bow-utils.js';

export const SPINE_STATUS_LABELS_FR = {
  table: 'Table fabricant',
  'manufacturer-table': 'Table fabricant vérifiée',
  'no-data': 'Donnée indisponible',
  available: 'Disponible',
  unavailable: 'Indisponible'
};

export function translateSpineStatusFr(value) {
  return SPINE_STATUS_LABELS_FR[value] || value;
}

export function normalizeUiBowType(value = '') {
  return normalizeBowType(value);
}

export function formatPrintedSpineLabel(label = '') {
  return label.replaceAll('-', '–');
}
