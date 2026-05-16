// spine-database.js
// Base applicative : seed JSON vérifié + charts officiels transcrits depuis les assets web lisibles.

import seed from './docs/bdd_spine/bdd_spine_links_codex.json' with { type: 'json' };
import { normalizeSpineChart } from './spine-normalizer.js';
import { SPINE_SOURCE_INDEX } from './spine-sources.js';

const SEED_CHARTS = seed.fully_transcribed_official_charts.map(convertSeedChart);

const WEB_TRANSCRIBED_CHARTS = [
  {
    chartId: 'victory_vf_rip_xv_rvl_compound_2026',
    manufacturer: 'Victory',
    sourceId: 'victory_arrow_guide_page',
    sourceAssetUrl: 'https://victoryarchery.com/wp-content/uploads/2026/01/compound-2.png',
    chartTitle: 'VF/RIP XV/RVL Spine Chart',
    chartVersion: '2026 web asset',
    chartSection: 'VF/RIP XV/RVL SPINE CHART',
    bowTypes: ['compound'],
    lengthMeasure: '',
    inputDimension: 'arrowLengthIn',
    pointWeightDefinition: 'Spine calculation based on standard 30 grains or less.',
    lengthColumnsIn: [23, 24, 25, 26, 27, 28, 29, 30, 31],
    advisoryNotes: [
      'Spine calculation based on standard 30 grains or less.',
      '*RIVAL(X) if 20 grain back weight is NOT used.'
    ],
    speedClass: '300-340 FPS',
    status: 'fully_transcribed',
    confidence: 'high',
    rows: buildSingleBandRows([
      ['32-36', [null, null, null, null, null, '500', '500', '500', '500']],
      ['37-41', [null, null, null, null, '500', '500', '500', '500', '500']],
      ['42-46', [null, null, null, '500', '500', '500', '500', '500', '400']],
      ['47-51', [null, '500', '500', '500', '500', '400', '400', '400', '400']],
      ['52-56', ['500', '500', '500', '400', '400', '400', '400', '400', '350']],
      ['57-61', ['500', '500', '400', '400', '400', '400', '400', '350', '350']],
      ['62-66', ['400', '400', '400', '400', '350', '350', '350', '350', '300']],
      ['67-72', ['400', '400', '400', '350', '350', '350', '350', '300', '300']],
      ['73-78', ['400', '400', '350', '350', '300', '300', '300', '300', '300']],
      ['79-84', ['350', '350', '350', '300', '300', '300', '300', '250', '250']],
      ['85-90', ['350', '350', '300', '300', '300', '250', '250', '250', '250']],
      ['90-95', ['300', '300', '300', '250', '250', '250', '250', '200', '200']],
      ['95-100', ['300', '300', '250', '250', '250', '200', '200', '200', '200']]
    ], [23, 24, 25, 26, 27, 28, 29, 30, 31])
  },
  {
    chartId: 'victory_hlr_family_compound_2026',
    manufacturer: 'Victory',
    sourceId: 'victory_arrow_guide_page',
    sourceAssetUrl: 'https://victoryarchery.com/wp-content/uploads/2026/01/compound-1.png',
    chartTitle: 'HLR/VLR/VAP/VAP TKO/VAP SS/RIP/RIP TKO/RIP SS Spine Chart *RIVAL(X)',
    chartVersion: '2026 web asset',
    chartSection: 'HLR/VLR/VAP/VAP TKO/VAP SS/RIP/RIP TKO/RIP SS SPINE CHART *RIVAL(X)',
    bowTypes: ['compound'],
    lengthMeasure: '',
    inputDimension: 'arrowLengthIn',
    pointWeightDefinition: 'Spine calculation based on standard 50/60 grain insert.',
    lengthColumnsIn: [23, 24, 25, 26, 27, 28, 29, 30, 31],
    advisoryNotes: [
      'Spine calculation based on standard 50/60 grain insert.',
      '*RIVAL(X) if 20 grain back weight IS used.'
    ],
    speedClass: '300-340 FPS',
    status: 'fully_transcribed',
    confidence: 'high',
    rows: buildSingleBandRows([
      ['32-36', [null, null, null, null, '500', '500', '500', '500', '500']],
      ['37-41', [null, null, null, '500', '500', '500', '500', '500', '400']],
      ['42-46', [null, '500', '500', '500', '500', '400', '400', '400', '400']],
      ['47-51', ['500', '500', '500', '400', '400', '400', '400', '400', '350']],
      ['52-56', ['500', '500', '400', '400', '400', '400', '400', '350', '350']],
      ['57-61', ['400', '400', '400', '400', '350', '350', '350', '350', '300']],
      ['62-66', ['400', '400', '400', '350', '350', '350', '350', '300', '300']],
      ['67-72', ['400', '400', '350', '350', '300', '300', '300', '300', '300']],
      ['73-78', ['350', '350', '350', '300', '300', '300', '300', '250/235', '250/235']],
      ['79-84', ['350', '350', '300', '300', '300', '250/235', '250/235', '250/235', '250/235']],
      ['85-90', ['300', '300', '300', '250/235', '250/235', '250/235', '250/235', '200', '200']],
      ['90-95', ['300', '300', '250/235', '250/235', '250/235', '200', '200', '200', '200']],
      ['95-100', ['250/235', '250/235', '250/235', '200', '200', '200', '200', '175', '175']]
    ], [23, 24, 25, 26, 27, 28, 29, 30, 31])
  },
  {
    chartId: 'carbon_express_light_recurve_target_official',
    manufacturer: 'Carbon Express',
    sourceId: 'carbon_express_chart_hub',
    sourceAssetUrl: 'https://feradyne.com/cdn/shop/files/light-recurve-selection-chart.jpg?v=1770817591',
    chartTitle: 'Light Recurve Target Selection Chart',
    chartVersion: 'official web asset',
    chartSection: 'LIGHT RECURVE TARGET SELECTION CHART',
    bowTypes: ['recurve'],
    lengthMeasure: '',
    inputDimension: 'arrowLengthIn',
    lengthColumnsIn: [21, 22, 23, 24, 25, 26, 27],
    advisoryNotes: [
      'Legend: PT = Predator, MXR = Medallion-XR, NS = Nano .166.'
    ],
    status: 'fully_transcribed',
    confidence: 'high',
    rows: buildSingleBandRows([
      ['10-17', ['MXR2000', 'MXR2000', 'MXR2000', 'MXR2000', 'MXR1800', 'MXR1500', 'MXR1300 / NS1200']],
      ['18-23', ['MXR2000', 'MXR2000', 'MXR1800', 'MXR1500', 'MXR1300 / NS1200', 'MXR1100 / NS1100', 'MXR1000 / NS1000']],
      ['24-28', ['MXR2000', 'MXR1800', 'MXR1500', 'MXR1300 / NS1200', 'MXR1100 / NS1100', 'PT1000 / MXR1000 / NS1000', 'PT900 / MXR900']],
      ['29-34', ['MXR1800', 'MXR1500', 'MXR1300 / NS1200', 'MXR1100 / NS1100', 'PT1000 / MXR1000 / NS1000', 'PT900 / MXR900 / NS900', 'PT800 / MXR800 / NS800']]
    ], [21, 22, 23, 24, 25, 26, 27])
  },
  {
    chartId: 'carbon_express_hunting_trispine_official',
    manufacturer: 'Carbon Express',
    sourceId: 'carbon_express_chart_hub',
    sourceAssetUrl: 'https://feradyne.com/cdn/shop/files/hunting-trispine-arrow-shaft-selection-scaled5.webp?v=1770817557',
    chartTitle: 'Arrow Shaft Selection Chart',
    chartVersion: 'official web asset',
    chartSection: 'ARROW SHAFT SELECTION CHART',
    bowTypes: ['compound'],
    lengthMeasure: '',
    inputDimension: 'arrowLengthIn',
    lengthColumnsIn: [26, 27, 28, 29, 30, 31, 32],
    advisoryNotes: [
      'Compound bow uses adjusted weight.',
      'Cells preserve Carbon Express product families when printed.'
    ],
    requiresAdjustedDrawWeight: true,
    status: 'fully_transcribed',
    confidence: 'high',
    rows: buildSingleBandRows([
      ['25-30', ['500', '500', '500', '500', '500', null, null]],
      ['31-39', ['500', '500', '500', '500', '500', null, null]],
      ['40-47', repeat('400 / SD 400 / TR 400', 7)],
      ['48-55', ['400 / SD 400 / TR 400', '400 / SD 400 / TR 400', '400 / SD 400 / TR 400', '400 / SD 400 / TR 400', '400 / SD 400 / TR 400', '400 / SD 400 / TR 400', '350 / SD 350 / TR350']],
      ['56-62', ['400 / SD 400 / TR 400', '400 / SD 400 / TR 400', '400 / SD 400 / TR 400', '400 / SD 400 / TR 400', '350 / SD 350 / TR350', '350 / SD 350 / TR350', '350 / SD 300 / TR 300']],
      ['63-69', ['400 / SD 400 / TR 400', '400 / SD 400 / TR 400', '400 / SD 350 / TR350', '350 / SD 350 / TR350', '350 / SD 300 / TR 300', '350 / SD 300 / TR 300', '350 / SD 300 / TR 300']],
      ['70-77', ['400 / SD 400 / TR 400', '350 / SD 350 / TR350', '350 / SD 350 / TR350', '350 / SD 300 / TR 300', '350 / SD 300 / TR 300', '350 / SD 300 / TR 300', null]],
      ['78-84', ['350 / SD 350 / TR350', '350 / SD 350 / TR350', '350 / SD 300 / TR 300', '350 / SD 300 / TR 300', '350 / SD 300 / TR 300', null, null]],
      ['85-92', ['350 / SD 350 / TR350', '350 / SD 300 / TR 300', '350 / SD 300 / TR 300', '350 / SD 300 / TR 300', null, null, null]]
    ], [26, 27, 28, 29, 30, 31, 32])
  }
];

export const SPINE_CHARTS = [...SEED_CHARTS, ...WEB_TRANSCRIBED_CHARTS].map(rawChart =>
  normalizeSpineChart(rawChart, SPINE_SOURCE_INDEX[rawChart.sourceId])
);

export const SPINE_CHART_INDEX = Object.fromEntries(
  SPINE_CHARTS.map(chart => [chart.chartId, chart])
);

function convertSeedChart(chart) {
  if (chart.matrix) {
    return {
      chartId: chart.chart_id,
      manufacturer: normalizeManufacturer(chart.manufacturer),
      sourceId: chart.source_id,
      chartVersion: chart.chart_version,
      chartSection: chart.chart_section,
      sourcePageLabel: '1',
      bowTypes: chart.bow_types.map(normalizeBowType),
      lengthMeasure: chart.length_measure,
      inputDimension: 'arrowLengthIn',
      pointWeightDefinition: chart.point_weight_baseline_gr
        ? `Baseline ${chart.point_weight_baseline_gr} grains.`
        : '',
      lengthColumnsIn: chart.length_columns_in,
      pointWeightBaselineGr: chart.point_weight_baseline_gr,
      releaseTypeBaseline: chart.release_type_baseline,
      bowSpeedBaseline: chart.bow_speed_baseline,
      adjustmentRules: chart.adjustment_rules,
      drawWeightBands: Object.fromEntries(
        Object.entries(chart.draw_weight_bands).map(([bowType, bands]) => [
          normalizeBowType(bowType),
          bands.map(band => ({
            label: band.label,
            minLbs: band.min_lbs,
            maxLbs: band.max_lbs,
            maxExclusive: Boolean(band.max_exclusive)
          }))
        ])
      ),
      matrix: chart.matrix,
      format: 'paired-bow-matrix',
      columnResolutionRule: 'official-nearest-whole-inch',
      status: chart.status,
      confidence: chart.confidence
    };
  }

  return {
    chartId: chart.chart_id,
    manufacturer: normalizeManufacturer(chart.manufacturer),
    sourceId: chart.source_id,
    chartTitle: chart.chart_title,
    bowTypes: chart.bow_types.map(normalizeBowType),
    speedClass: chart.speed_class || '',
    lengthMeasure: chart.length_measure || '',
    inputDimension: 'arrowLengthIn',
    pointWeightDefinition: chart.point_weight_definition || '',
    pointWeightColumnsGr: chart.point_weight_columns_gr || [],
    frontWeightClassesGr: chart.front_weight_classes_gr || [],
    frontWeightDefinition: chart.front_weight_definition || '',
    lengthColumnsIn: chart.length_columns_in,
    advisoryNotes: chart.advisory_notes || [],
    rows: (chart.rows || []).map(row => ({
      drawWeightBandsByPointWeightGr: row.draw_weight_bands_by_point_weight_gr,
      drawWeightBandsByFrontWeightClass: row.draw_weight_bands_by_front_weight_class,
      cellsByLengthIn: row.cells_by_length_in
    })),
    status: chart.status,
    confidence: chart.confidence
  };
}

function buildSingleBandRows(pairs, lengths) {
  return pairs.map(([band, cells]) => ({
    drawWeightBandsByClass: { base: band },
    cellsByLengthIn: Object.fromEntries(lengths.map((length, index) => [length, cells[index] ?? null]))
  }));
}

function repeat(value, count) {
  return Array.from({ length: count }, () => value);
}

function normalizeBowType(value) {
  if (value === 'longbow') return 'traditional';
  return value;
}

function normalizeManufacturer(value) {
  if (value === 'Victory Archery') return 'Victory';
  return value;
}
