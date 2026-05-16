// spine-normalizer.js
// Transforme les matrices brutes fabricantes en cellules utilisateur homogènes.

const DEFAULT_INPUT_DIMENSION = 'arrowLengthIn';

export function normalizeSpineChart(rawChart, source = {}) {
  const base = {
    chartId: rawChart.chartId,
    manufacturer: rawChart.manufacturer,
    sourceId: rawChart.sourceId,
    sourceUrl: rawChart.sourceUrl || source.sourceUrl || '',
    chartTitle: rawChart.chartTitle || '',
    chartVersion: rawChart.chartVersion || '',
    chartSection: rawChart.chartSection || rawChart.chartTitle || '',
    sourcePageLabel: rawChart.sourcePageLabel || '',
    bowTypes: [...(rawChart.bowTypes || [])],
    lengthMeasure: rawChart.lengthMeasure || '',
    inputDimension: rawChart.inputDimension || DEFAULT_INPUT_DIMENSION,
    pointWeightDefinition: rawChart.pointWeightDefinition || '',
    pointWeightBaselineGr: rawChart.pointWeightBaselineGr ?? null,
    pointWeightColumnsGr: [...(rawChart.pointWeightColumnsGr || [])],
    frontWeightClassesGr: [...(rawChart.frontWeightClassesGr || [])],
    lengthColumnsIn: [...(rawChart.lengthColumnsIn || [])],
    drawWeightBands: rawChart.drawWeightBands || null,
    advisoryNotes: [...(rawChart.advisoryNotes || [])],
    adjustmentRules: [...(rawChart.adjustmentRules || [])],
    status: rawChart.status || 'manifest-only',
    confidence: rawChart.confidence || 'unknown',
    speedClass: rawChart.speedClass || '',
    sourceAssetUrl: rawChart.sourceAssetUrl || '',
    columnResolutionRule: rawChart.columnResolutionRule || 'project-default-rounding',
    coverage: rawChart.coverage || 'full-chart'
  };

  const rows = rawChart.format === 'paired-bow-matrix'
    ? normalizePairedBowMatrix(rawChart, base)
    : normalizeBandRows(rawChart, base);

  return { ...base, rows };
}

export function parseRecommendedSpinesLabel(label = '') {
  if (typeof label !== 'string' || !label.trim()) return [];
  return [...new Set(
    (label.match(/\d{3,4}/g) || [])
      .map(value => Number(value))
      .filter(Number.isFinite)
  )];
}

export function parseBandLabel(label = '') {
  if (typeof label !== 'string' || !label.trim()) return null;
  const trimmed = label.trim();
  const openBelow = trimmed.match(/^<\s*(\d+(?:\.\d+)?)/);
  if (openBelow) {
    return {
      label: trimmed,
      min: null,
      max: Number(openBelow[1]),
      maxExclusive: true
    };
  }

  const range = trimmed.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (range) {
    return {
      label: trimmed,
      min: Number(range[1]),
      max: Number(range[2]),
      maxExclusive: false
    };
  }

  return null;
}

function normalizePairedBowMatrix(rawChart, base) {
  return Object.entries(rawChart.drawWeightBands || {}).flatMap(([bowType, bands]) =>
    bands.flatMap((band, rowIndex) =>
      rawChart.lengthColumnsIn.flatMap((lengthIn, columnIndex) => {
        const label = rawChart.matrix?.[rowIndex]?.[columnIndex] ?? null;
        if (!label) return [];
        return [buildCell({
          base,
          bowType,
          drawWeightBand: {
            label: band.label,
            min: band.minLbs,
            max: band.maxLbs,
            maxExclusive: Boolean(band.maxExclusive)
          },
          lengthIn,
          recommendedSpinesLabel: label,
          rowIndex,
          columnIndex,
          pointWeightClassGr: rawChart.pointWeightBaselineGr ?? null,
          releaseTypeReference: rawChart.releaseTypeBaseline?.[bowType] || null,
          bowSpeedClassReference: rawChart.bowSpeedBaseline?.[bowType] || null
        })];
      })
    )
  );
}

function normalizeBandRows(rawChart, base) {
  return (rawChart.rows || []).flatMap((row, rowIndex) => {
    const classMap = row.drawWeightBandsByPointWeightGr ||
      row.drawWeightBandsByFrontWeightClass ||
      row.drawWeightBandsByClass ||
      {};

    return (row.bowTypes || rawChart.bowTypes || []).flatMap(bowType =>
      Object.entries(classMap).flatMap(([classKey, bandLabel]) => {
        if (!bandLabel) return [];
        const parsedBand = parseBandLabel(bandLabel);
        if (!parsedBand) return [];
        return (rawChart.lengthColumnsIn || []).flatMap((lengthIn, columnIndex) => {
          const label = row.cellsByLengthIn?.[lengthIn] ?? row.cellsByLengthIn?.[String(lengthIn)] ?? null;
          if (!label) return [];
          return [buildCell({
            base,
            bowType,
            drawWeightBand: parsedBand,
            lengthIn,
            recommendedSpinesLabel: label,
            rowIndex,
            columnIndex,
            pointWeightClassGr: rawChart.pointWeightColumnsGr?.length ? Number(classKey) : null,
            frontWeightClassGr: rawChart.frontWeightClassesGr?.length ? classKey : null,
            bowSpeedClassReference: rawChart.speedClass || row.bowSpeedClassReference || null,
            productRecommendationLabel: label,
            requiresAdjustedDrawWeight: Boolean(rawChart.requiresAdjustedDrawWeight || row.requiresAdjustedDrawWeight)
          })];
        });
      })
    );
  });
}

function buildCell({
  base,
  bowType,
  drawWeightBand,
  lengthIn,
  recommendedSpinesLabel,
  rowIndex,
  columnIndex,
  pointWeightClassGr = null,
  frontWeightClassGr = null,
  releaseTypeReference = null,
  bowSpeedClassReference = null,
  productRecommendationLabel = '',
  requiresAdjustedDrawWeight = false
}) {
  const recommendedSpines = parseRecommendedSpinesLabel(recommendedSpinesLabel);
  return {
    manufacturer: base.manufacturer,
    chartId: base.chartId,
    sourceId: base.sourceId,
    sourceUrl: base.sourceUrl,
    sourceAssetUrl: base.sourceAssetUrl,
    chartTitle: base.chartTitle,
    chartVersion: base.chartVersion,
    sourcePageLabel: base.sourcePageLabel,
    sourceSection: base.chartSection,
    rowId: `${base.chartId}-${bowType}-${rowIndex}-${columnIndex}-${normalizeIdPart(String(pointWeightClassGr ?? frontWeightClassGr ?? 'base'))}`,
    status: 'verified',
    bowType,
    drawWeightLabel: drawWeightBand.label,
    drawWeightMinLbs: drawWeightBand.min,
    drawWeightMaxLbs: drawWeightBand.max,
    drawWeightMaxExclusive: Boolean(drawWeightBand.maxExclusive),
    arrowLengthMinIn: lengthIn,
    arrowLengthMaxIn: lengthIn,
    pointWeightClassGr,
    frontWeightClassGr,
    releaseTypeReference,
    bowSpeedClassReference,
    requiresAdjustedDrawWeight,
    productRecommendationLabel: productRecommendationLabel || recommendedSpinesLabel,
    recommendedSpinesLabel,
    recommendedSpines,
    rangeMin: recommendedSpines.length ? Math.min(...recommendedSpines) : null,
    rangeMax: recommendedSpines.length ? Math.max(...recommendedSpines) : null,
    notes: [...base.advisoryNotes],
    confidence: 'manufacturer-table'
  };
}

function normalizeIdPart(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
