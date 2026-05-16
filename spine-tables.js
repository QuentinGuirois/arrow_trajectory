// spine-tables.js
// Façade de compatibilité autour de la nouvelle base normalisée.

import { SPINE_CHART_INDEX } from './spine-database.js';

const MANIFEST_ONLY_TABLES = {
  easton_target: {
    manufacturer: 'Easton',
    chartId: 'easton_target',
    tableId: 'easton_target',
    sourceName: 'Target Arrow Size Selection',
    sourceUrl: '',
    status: 'metadata-only',
    integrationRole: 'direct-spine-table',
    bowTypes: ['compound', 'recurve'],
    rows: []
  },
  easton_hunting_301055A: {
    manufacturer: 'Easton',
    chartId: 'easton_hunting_301055A',
    tableId: 'easton_hunting_301055A',
    sourceName: '301055-A Arrow Shaft Selection Hunting',
    status: 'manifest-only',
    integrationRole: 'direct-spine-table',
    bowTypes: ['compound'],
    rows: []
  },
  skylon_target_chart: {
    manufacturer: 'Skylon',
    chartId: 'skylon_target_chart',
    tableId: 'skylon_target_chart',
    sourceName: 'Skylon target chart',
    status: 'manifest-only',
    integrationRole: 'direct-spine-table',
    bowTypes: ['compound', 'recurve'],
    rows: []
  }
};

const chartEntries = Object.values(SPINE_CHART_INDEX).map(chart => [chart.chartId, toLegacyCompatibleTable(chart)]);

export const SPINE_TABLES = {
  ...MANIFEST_ONLY_TABLES,
  ...Object.fromEntries(chartEntries),
  // Alias historiques conservés pour les appels déjà présents.
  goldtip_compound_315_plus: toLegacyCompatibleTable(SPINE_CHART_INDEX.gold_tip_compound_315_plus),
  goldtip_compound_315_minus: toLegacyCompatibleTable(SPINE_CHART_INDEX.gold_tip_compound_315_minus),
  goldtip_recurve: toLegacyCompatibleTable(SPINE_CHART_INDEX.gold_tip_recurve),
  blackeagle_compound_2023: toLegacyCompatibleTable(SPINE_CHART_INDEX.black_eagle_compound_2023),
  victory_recurve_spine_chart: toLegacyCompatibleTable(SPINE_CHART_INDEX.victory_recurve_2024),
  easton_target_301055A_ac_all_carbon: toLegacyCompatibleTable(SPINE_CHART_INDEX.easton_target_301055A_ac_all_carbon),
  victory_vf_rip_xv_rvl_spine_chart: toLegacyCompatibleTable(SPINE_CHART_INDEX.victory_vf_rip_xv_rvl_compound_2026),
  victory_hlr_vlr_vap_family_spine_chart: toLegacyCompatibleTable(SPINE_CHART_INDEX.victory_hlr_family_compound_2026),
  carbonexpress_light_recurve_target_selection: toLegacyCompatibleTable(SPINE_CHART_INDEX.carbon_express_light_recurve_target_official),
  carbonexpress_hunting_trispine_shaft_selection: toLegacyCompatibleTable(SPINE_CHART_INDEX.carbon_express_hunting_trispine_official)
};

function toLegacyCompatibleTable(chart) {
  if (!chart) return null;
  return {
    ...chart,
    tableId: chart.chartId,
    sourceName: chart.chartTitle || chart.chartSection || chart.chartId,
    documentType: 'chart spine',
    integrationRole: 'direct-spine-table',
    status: chart.status === 'fully_transcribed' ? 'verified' : chart.status
  };
}
