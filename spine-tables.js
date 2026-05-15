// spine-tables.js
// Registre strictement séparé des sources fabricant.
// Aucune ligne numérique n'est transcrite tant qu'elle n'a pas été relue et validée.

const STATIC_SPINE_NOTE = 'Manufacturer static spine notation; lower number means stiffer shaft.';
const EASTON_301055A_SOURCE_SECTION = 'A/C • ALL-CARBON ARROW CUT LENGTH';
const VICTORY_ADJUSTMENT_RULES = [
  {
    sourceSection: 'IMPORTANT NOTES',
    text: 'Below 300 FPS: deduct 5 lbs draw weight.'
  },
  {
    sourceSection: 'IMPORTANT NOTES',
    text: '300-341 FPS: baseline draw weight.'
  },
  {
    sourceSection: 'IMPORTANT NOTES',
    text: '341-351 FPS: add 5 lbs draw weight.'
  },
  {
    sourceSection: 'IMPORTANT NOTES',
    text: 'Above 351 FPS: add 10 lbs draw weight.'
  },
  {
    sourceSection: 'IMPORTANT NOTES',
    text: 'If arrow length and poundage fall on the edge of a spine with a 100 or 125 grain point, choose the stiffer spine.'
  }
];

const CARBON_EXPRESS_ADJUSTMENT_RULES = [
  {
    sourceSection: 'ADJUSTABLE WEIGHT CHART',
    sourceFile: 'carbon_express/adjustable-weight-chart-scaled.webp',
    text: 'Compound charts depend on an adjusted bow draw weight calculated from the separate adjustable weight chart.'
  }
];

const EASTON_301055A_AC_ALL_CARBON_LENGTHS_IN = [
  21, 22, 23, 24, 25, 26, 27,
  28, 29, 30, 31, 32, 33, 34
];

const EASTON_301055A_AC_ALL_CARBON_MATRIX = [
  ['2000', '2000', '2000-1800', '1800-1700', '1750-1400', '1450-1200', '1250-1050', '1080-880', '900-750', '800-700', '720-625', '675-600', '640-570', '575-500'],
  ['2000', '2000-1800', '1800-1700', '1750-1400', '1450-1200', '1250-1050', '1080-880', '900-750', '800-700', '720-625', '675-600', '640-570', '575-500', '525-450'],
  ['2000-1800', '1800-1700', '1750-1400', '1450-1200', '1250-1050', '1080-880', '900-750', '800-700', '720-625', '675-600', '640-570', '575-500', '525-450', '475-400'],
  ['1800-1700', '1750-1400', '1450-1200', '1250-1050', '1080-880', '900-750', '800-700', '720-625', '675-600', '640-570', '575-500', '525-450', '475-400', '440-370'],
  ['1750-1400', '1450-1200', '1250-1050', '1080-880', '900-750', '800-700', '720-625', '675-600', '640-570', '575-500', '525-450', '475-400', '440-370', '400-340'],
  ['1450-1200', '1250-1050', '1080-880', '900-750', '800-700', '720-625', '675-600', '640-570', '575-500', '525-450', '475-400', '440-370', '400-340', '370-310'],
  ['1250-1050', '1080-880', '900-750', '800-700', '720-625', '675-600', '640-570', '575-500', '525-450', '475-400', '440-370', '400-340', '370-310', '340-300'],
  ['1080-880', '900-750', '800-700', '720-625', '675-600', '640-570', '575-500', '525-450', '475-400', '440-370', '400-340', '370-310', '340-300', '300-250'],
  ['900-750', '800-700', '720-625', '675-600', '640-570', '575-500', '525-450', '475-400', '440-370', '400-340', '370-310', '340-300', '300-250', '250-200'],
  ['800-700', '720-625', '675-600', '640-570', '575-500', '525-450', '475-400', '440-370', '400-340', '370-310', '340-300', '300-250', '250-200', '250-200'],
  ['720-625', '675-600', '640-570', '575-500', '525-450', '475-400', '440-370', '400-340', '370-310', '340-300', '300-250', '250-200', '250-200', '250-200'],
  ['675-600', '640-570', '575-500', '525-450', '475-400', '440-370', '400-340', '370-310', '340-300', '300-250', '250-200', '250-200', '250-200', '200-150']
];

const EASTON_301055A_AC_ALL_CARBON_DRAW_WEIGHT_BANDS = {
  compound: [
    { label: '<17', min: null, max: 17, maxExclusive: true },
    { label: '17-23', min: 17, max: 23 },
    { label: '24-28', min: 24, max: 28 },
    { label: '29-34', min: 29, max: 34 },
    { label: '35-39', min: 35, max: 39 },
    { label: '40-44', min: 40, max: 44 },
    { label: '45-49', min: 45, max: 49 },
    { label: '50-54', min: 50, max: 54 },
    { label: '55-59', min: 55, max: 59 },
    { label: '60-64', min: 60, max: 64 },
    { label: '65-69', min: 65, max: 69 },
    { label: '70-76', min: 70, max: 76 }
  ],
  recurve: [
    { label: '<20 lbs.', min: null, max: 20, maxExclusive: true },
    { label: '21-26 lbs.', min: 21, max: 26 },
    { label: '27-31 lbs.', min: 27, max: 31 },
    { label: '32-35 lbs.', min: 32, max: 35 },
    { label: '36-39 lbs.', min: 36, max: 39 },
    { label: '40-43 lbs.', min: 40, max: 43 },
    { label: '44-47 lbs.', min: 44, max: 47 },
    { label: '48-52 lbs.', min: 48, max: 52 },
    { label: '53-57 lbs.', min: 53, max: 57 },
    { label: '58-62 lbs.', min: 58, max: 62 },
    { label: '63-67 lbs.', min: 63, max: 67 },
    { label: '68-73 lbs.', min: 68, max: 73 }
  ]
};

const EASTON_301055A_ADJUSTMENT_RULES = [
  {
    sourceSection: 'ADJUST THE CHART TO YOUR BOW SET-UP',
    text: 'Chart baseline: Bow Speed Rating 301-320 FPS, glue-in 100 grain points, and a mechanical release aid.'
  },
  {
    sourceSection: 'ADJUST THE CHART TO YOUR BOW SET-UP',
    text: 'Compound bow speed rating: up to 275 FPS = -10 lbs; 276-300 FPS = -5 lbs; 301-320 FPS = no adjustment; 321-340 FPS = +5 lbs; 341-350 FPS = +10 lbs; 351 FPS or higher = +15 lbs.'
  },
  {
    sourceSection: 'ADJUST THE CHART TO YOUR BOW SET-UP',
    text: 'Compound release type: mechanical release = no adjustment; finger release = +5 lbs.'
  },
  {
    sourceSection: 'ADJUST THE CHART TO YOUR BOW SET-UP',
    text: 'Points and inserts: points <100 grains = -3 lbs per 25 grains below 100; points =100 grains = no adjustment; points >100 grains = +3 lbs per 25 grains above 100.'
  },
  {
    sourceSection: 'ADJUST THE CHART TO YOUR BOW SET-UP',
    text: 'Recurve bow: carbon competition limb = no adjustment; wood/glass beginner limb = -5 lbs.'
  }
];

export const SPINE_TABLES = {
  easton_target: {
    manufacturer: 'Easton',
    tableId: 'easton_target',
    sourceName: 'Target Arrow Size Selection',
    sourceFile: 'docs/spine_fabricant/301055-A-Arrow-Shaft-Selection-Target.pdf',
    sourceUrl: '',
    chartVersion: 'PN 301055-A',
    documentType: 'chart spine',
    integrationRole: 'direct-spine-table',
    bowFamily: 'target',
    bowTypes: ['compound', 'recurve'],
    status: 'metadata-only',
    baseline: {
      unitNotes: {
        arrowLength: 'Measured to throat of nock.',
        pointWeight: 'Glue-in 100 grain points baseline.',
        spine: STATIC_SPINE_NOTE
      }
    },
    adjustments: {},
    rows: []
  },

  easton_target_301055A_ac_all_carbon: {
    manufacturer: 'Easton',
    tableId: 'easton_target_301055A_ac_all_carbon',
    sourceName: 'Target Arrow Size Selection',
    sourceFile: '301055-A-Arrow-Shaft-Selection-Target.pdf',
    sourceUrl: '',
    chartVersion: '301055-A',
    documentType: 'chart spine',
    integrationRole: 'direct-spine-table',
    bowFamily: 'target',
    bowTypes: ['compound', 'recurve'],
    arrowMaterialFamily: 'A/C all-carbon',
    status: 'verified',
    coverage: 'full-section',
    columnResolutionRule: 'easton-fractional-rounding',
    baseline: {
      unitNotes: {
        arrowLength: 'Measured to throat of nock.',
        pointWeight: 'Glue-in 100 grain points baseline.',
        spine: STATIC_SPINE_NOTE
      }
    },
    adjustmentRules: EASTON_301055A_ADJUSTMENT_RULES,
    rows: buildEaston301055AAcAllCarbonRows()
  },

  goldtip_selector: {
    manufacturer: 'Gold Tip',
    tableId: 'goldtip_selector',
    sourceName: 'Spine Selector',
    sourceFile: 'docs/spine_fabricant/spine_guide_gold_tips.pdf',
    sourceUrl: 'goldtip.com',
    chartVersion: '',
    documentType: 'sélecteur spine',
    integrationRole: 'direct-spine-table',
    bowFamily: '',
    bowTypes: ['compound', 'recurve', 'longbow'],
    status: 'metadata-only',
    baseline: {
      unitNotes: {
        arrowLength: 'Measured from throat of nock to end of insert.',
        pointWeight: 'Point + insert + Ballistic Collar + FACT weight.',
        spine: STATIC_SPINE_NOTE
      }
    },
    adjustments: {},
    rows: []
  },

  goldtip_compound_315_plus: {
    manufacturer: 'Gold Tip',
    tableId: 'goldtip_compound_315_plus',
    sourceName: 'Spine Selector',
    sourceFile: 'spine_guide_gold_tips.pdf',
    sourceUrl: 'goldtip.com',
    chartVersion: '',
    documentType: 'sélecteur spine',
    integrationRole: 'direct-spine-table',
    bowFamily: '',
    bowTypes: ['compound'],
    status: 'verified',
    coverage: 'partial-verified-cells',
    baseline: {
      unitNotes: {
        arrowLength: 'Measured from throat of nock to end of insert.',
        pointWeight: 'Point + insert + Ballistic Collar + FACT weight.',
        spine: STATIC_SPINE_NOTE
      }
    },
    rows: buildGoldTipCompound315PlusRows()
  },

  goldtip_recurve: {
    manufacturer: 'Gold Tip',
    tableId: 'goldtip_recurve',
    sourceName: 'Spine Selector',
    sourceFile: 'spine_guide_gold_tips.pdf',
    sourceUrl: 'goldtip.com',
    chartVersion: '',
    documentType: 'sélecteur spine',
    integrationRole: 'direct-spine-table',
    bowFamily: '',
    bowTypes: ['recurve'],
    status: 'verified',
    coverage: 'partial-verified-cells',
    baseline: {
      unitNotes: {
        arrowLength: 'Measured from throat of nock to end of insert.',
        pointWeight: 'Point + insert + Ballistic Collar + FACT weight.',
        spine: STATIC_SPINE_NOTE
      }
    },
    rows: buildGoldTipRecurveRows()
  },

  victory_arrow_guide: {
    manufacturer: 'Victory Archery',
    tableId: 'victory_arrow_guide',
    sourceName: 'Victory Arrow Guide',
    sourceFile: 'docs/spine_fabricant/spine_guide_victory_archery.pdf',
    sourceUrl: 'www.victoryarchery.com/arrow-guide/',
    chartVersion: '',
    documentType: 'chart spine',
    integrationRole: 'direct-spine-table',
    bowFamily: '',
    bowTypes: ['compound', 'recurve'],
    status: 'metadata-only',
    baseline: {
      unitNotes: {
        arrowLength: '',
        pointWeight: 'Distinct baselines are visible for 30 grain or less, 50/60 grain insert, and 100-125 grain front.',
        spine: STATIC_SPINE_NOTE
      }
    },
    adjustments: {},
    rows: []
  },

  victory_vf_rip_xv_rvl_spine_chart: {
    manufacturer: 'Victory Archery',
    tableId: 'victory_vf_rip_xv_rvl_spine_chart',
    sourceName: 'Victory Arrow Guide',
    sourceFile: 'spine_guide_victory_archery.pdf',
    sourceUrl: 'www.victoryarchery.com/arrow-guide/',
    chartVersion: '',
    documentType: 'chart spine',
    integrationRole: 'direct-spine-table',
    bowFamily: '',
    bowTypes: ['compound'],
    productFamily: 'VF/RIP XV/RVL',
    status: 'verified',
    coverage: 'partial-verified-cells',
    baseline: {
      unitNotes: {
        arrowLength: '',
        pointWeight: 'Spine calculation based on standard 30 grains or less.',
        spine: STATIC_SPINE_NOTE
      }
    },
    adjustmentRules: VICTORY_ADJUSTMENT_RULES,
    rows: buildVictoryVfRipXvRvlRows()
  },

  victory_hlr_vlr_vap_family_spine_chart: {
    manufacturer: 'Victory Archery',
    tableId: 'victory_hlr_vlr_vap_family_spine_chart',
    sourceName: 'Victory Arrow Guide',
    sourceFile: 'spine_guide_victory_archery.pdf',
    sourceUrl: 'www.victoryarchery.com/arrow-guide/',
    chartVersion: '',
    documentType: 'chart spine',
    integrationRole: 'direct-spine-table',
    bowFamily: '',
    bowTypes: ['compound'],
    productFamily: 'HLR/VLR/VAP/VAP TKO/VAP SS/RIP/RIP TKO/RIP SS *RIVAL(X)',
    status: 'verified',
    coverage: 'partial-verified-cells',
    baseline: {
      unitNotes: {
        arrowLength: '',
        pointWeight: 'Spine calculation based on standard 50/60 grain insert.',
        spine: STATIC_SPINE_NOTE
      }
    },
    adjustmentRules: VICTORY_ADJUSTMENT_RULES,
    rows: buildVictoryHlrFamilyRows()
  },

  victory_recurve_spine_chart: {
    manufacturer: 'Victory Archery',
    tableId: 'victory_recurve_spine_chart',
    sourceName: 'Victory Arrow Guide',
    sourceFile: 'spine_guide_victory_archery.pdf',
    sourceUrl: 'www.victoryarchery.com/arrow-guide/',
    chartVersion: '',
    documentType: 'chart spine',
    integrationRole: 'direct-spine-table',
    bowFamily: '',
    bowTypes: ['recurve'],
    productFamily: 'Recurve',
    status: 'verified',
    coverage: 'partial-verified-cells',
    baseline: {
      unitNotes: {
        arrowLength: '',
        pointWeight: 'Spine calculation based on 100-125 grain front.',
        spine: STATIC_SPINE_NOTE
      }
    },
    adjustmentRules: VICTORY_ADJUSTMENT_RULES,
    rows: buildVictoryRecurveRows()
  },

  easton_tuning_guide: {
    manufacturer: 'Easton',
    tableId: 'easton_tuning_guide',
    sourceName: 'Arrow Tuning and Maintenance Guide',
    sourceFile: 'docs/spine_fabricant/TuningGuideEaston.pdf',
    sourceUrl: '',
    chartVersion: '2nd Edition; Rev. 4, 4/99',
    documentType: 'guide tuning',
    integrationRole: 'metadata-only',
    bowFamily: '',
    bowTypes: ['compound', 'recurve'],
    status: 'metadata-only',
    baseline: {
      unitNotes: {
        arrowLength: 'Multiple conventions are described depending on use case; no universal chart convention.',
        pointWeight: '',
        spine: STATIC_SPINE_NOTE
      }
    },
    adjustments: {},
    rows: []
  },

  carbonexpress_hunting_shaft_selection: {
    manufacturer: 'Carbon Express',
    tableId: 'carbonexpress_hunting_shaft_selection',
    sourceName: 'Hunting Arrow Shaft Selection Guide',
    sourceFile: 'docs/spine_fabricant/carbon_express/hunting-arrow-shaft-selection-scaled2.webp',
    sourceUrl: '',
    chartVersion: '',
    documentType: 'chart spine',
    integrationRole: 'direct-spine-table',
    bowFamily: 'hunting',
    bowTypes: ['compound', 'recurve'],
    status: 'verified',
    coverage: 'partial-verified-cells',
    baseline: {
      unitNotes: {
        arrowLength: '',
        pointWeight: '',
        spine: STATIC_SPINE_NOTE
      }
    },
    adjustmentRules: CARBON_EXPRESS_ADJUSTMENT_RULES,
    rows: buildCarbonExpressHuntingRows()
  },

  carbonexpress_hunting_trispine_shaft_selection: {
    manufacturer: 'Carbon Express',
    tableId: 'carbonexpress_hunting_trispine_shaft_selection',
    sourceName: 'Arrow Shaft Selection Chart',
    sourceFile: 'docs/spine_fabricant/carbon_express/hunting-trispine-arrow-shaft-selection-scaled5.webp',
    sourceUrl: '',
    chartVersion: '',
    documentType: 'chart spine',
    integrationRole: 'direct-spine-table',
    bowFamily: 'hunting',
    bowTypes: ['compound'],
    status: 'verified',
    coverage: 'partial-verified-cells',
    baseline: {
      unitNotes: {
        arrowLength: '',
        pointWeight: '',
        spine: STATIC_SPINE_NOTE
      }
    },
    adjustmentRules: CARBON_EXPRESS_ADJUSTMENT_RULES,
    rows: buildCarbonExpressHuntingTrispineRows()
  },

  carbonexpress_target_arrow_selection: {
    manufacturer: 'Carbon Express',
    tableId: 'carbonexpress_target_arrow_selection',
    sourceName: 'Target Arrow Selection Chart',
    sourceFile: 'docs/spine_fabricant/carbon_express/target-arrow-selection-chart3.jpg',
    sourceUrl: '',
    chartVersion: '',
    documentType: 'chart spine',
    integrationRole: 'direct-spine-table',
    bowFamily: 'target',
    bowTypes: ['compound', 'recurve'],
    status: 'verified',
    coverage: 'partial-verified-cells',
    baseline: {
      unitNotes: {
        arrowLength: '',
        pointWeight: '',
        spine: STATIC_SPINE_NOTE
      }
    },
    adjustmentRules: CARBON_EXPRESS_ADJUSTMENT_RULES,
    rows: buildCarbonExpressTargetRows()
  },

  carbonexpress_adjustable_weight_chart: {
    manufacturer: 'Carbon Express',
    tableId: 'carbonexpress_adjustable_weight_chart',
    sourceName: 'Adjustable Weight Chart',
    sourceFile: 'docs/spine_fabricant/carbon_express/adjustable-weight-chart-scaled.webp',
    sourceUrl: 'www.safearrow.com',
    chartVersion: '',
    documentType: 'autre',
    integrationRole: 'adjustment-document',
    bowFamily: '',
    bowTypes: ['compound'],
    status: 'metadata-only',
    baseline: {
      unitNotes: {
        arrowLength: '',
        pointWeight: 'Uses separate rows for glue-in target points and insert + screw-in point configurations.',
        spine: ''
      }
    },
    adjustments: {},
    rows: []
  }
};

function buildEaston301055AAcAllCarbonRows() {
  return [
    ...buildRowsForBowType('compound'),
    ...buildRowsForBowType('recurve')
  ];
}

function buildRowsForBowType(bowType) {
  const drawWeightBands = EASTON_301055A_AC_ALL_CARBON_DRAW_WEIGHT_BANDS[bowType];
  const releaseTypeReference = bowType === 'compound' ? 'mechanical' : 'finger';
  const bowSpeedClassReference = bowType === 'compound' ? '301-320 FPS' : null;

  return drawWeightBands.flatMap((band, rowIndex) =>
    EASTON_301055A_AC_ALL_CARBON_LENGTHS_IN.map((arrowLengthIn, columnIndex) => {
      const recommendedSpinesLabel = EASTON_301055A_AC_ALL_CARBON_MATRIX[rowIndex][columnIndex];

      return {
        manufacturer: 'Easton',
        tableId: 'easton_target_301055A_ac_all_carbon',
        chartVersion: '301055-A',
        sourceFile: '301055-A-Arrow-Shaft-Selection-Target.pdf',
        sourcePageLabel: '1',
        sourcePageIndex: 0,
        sourceSection: EASTON_301055A_SOURCE_SECTION,
        rowId: `easton-301055a-ac-all-carbon-${bowType}-${normalizeIdPart(band.label)}-${arrowLengthIn}in`,
        status: 'verified',
        bowType,
        arrowMaterialFamily: 'A/C all-carbon',
        drawWeightLabel: band.label,
        drawWeightMinLbs: band.min,
        drawWeightMaxLbs: band.max,
        drawWeightMaxExclusive: Boolean(band.maxExclusive),
        arrowLengthMinIn: arrowLengthIn,
        arrowLengthMaxIn: arrowLengthIn,
        pointWeightReferenceGrains: 100,
        releaseTypeReference,
        bowSpeedClassReference,
        recommendedSpinesLabel,
        recommendedSpines: parseRecommendedSpinesLabel(recommendedSpinesLabel),
        shaftFamilies: [],
        notes: [],
        confidence: 'manufacturer-table'
      };
    })
  );
}

function buildGoldTipCompound315PlusRows() {
  return [
    buildManufacturerRow({
      manufacturer: 'Gold Tip',
      tableId: 'goldtip_compound_315_plus',
      chartVersion: '',
      sourceFile: 'spine_guide_gold_tips.pdf',
      sourcePageLabel: '1',
      sourcePageIndex: 0,
      sourceSection: 'COMPOUND BOW / IBO SPEED 315 + (FPS)',
      rowId: 'goldtip-compound-315-plus-40-44lbs-29in-100gr',
      bowType: 'compound',
      drawWeightLabel: '40-44',
      drawWeightMinLbs: 40,
      drawWeightMaxLbs: 44,
      arrowLengthIn: 29,
      pointWeightReferenceGrains: 100,
      bowSpeedClassReference: 'IBO SPEED 315+ FPS',
      recommendedSpinesLabel: '400',
      recommendedSpines: [400]
    }),
    buildManufacturerRow({
      manufacturer: 'Gold Tip',
      tableId: 'goldtip_compound_315_plus',
      chartVersion: '',
      sourceFile: 'spine_guide_gold_tips.pdf',
      sourcePageLabel: '1',
      sourcePageIndex: 0,
      sourceSection: 'COMPOUND BOW / IBO SPEED 315 + (FPS)',
      rowId: 'goldtip-compound-315-plus-45-49lbs-28in-100gr',
      bowType: 'compound',
      drawWeightLabel: '45-49',
      drawWeightMinLbs: 45,
      drawWeightMaxLbs: 49,
      arrowLengthIn: 28,
      pointWeightReferenceGrains: 100,
      bowSpeedClassReference: 'IBO SPEED 315+ FPS',
      recommendedSpinesLabel: '400',
      recommendedSpines: [400]
    })
  ];
}

function buildGoldTipRecurveRows() {
  return [
    buildManufacturerRow({
      manufacturer: 'Gold Tip',
      tableId: 'goldtip_recurve',
      chartVersion: '',
      sourceFile: 'spine_guide_gold_tips.pdf',
      sourcePageLabel: '1',
      sourcePageIndex: 0,
      sourceSection: 'RECURVE BOW',
      rowId: 'goldtip-recurve-40-44lbs-29in-100gr',
      bowType: 'recurve',
      drawWeightLabel: '40-44',
      drawWeightMinLbs: 40,
      drawWeightMaxLbs: 44,
      arrowLengthIn: 29,
      pointWeightReferenceGrains: 100,
      recommendedSpinesLabel: '500',
      recommendedSpines: [500]
    }),
    buildManufacturerRow({
      manufacturer: 'Gold Tip',
      tableId: 'goldtip_recurve',
      chartVersion: '',
      sourceFile: 'spine_guide_gold_tips.pdf',
      sourcePageLabel: '1',
      sourcePageIndex: 0,
      sourceSection: 'RECURVE BOW',
      rowId: 'goldtip-recurve-50-54lbs-30in-100gr',
      bowType: 'recurve',
      drawWeightLabel: '50-54',
      drawWeightMinLbs: 50,
      drawWeightMaxLbs: 54,
      arrowLengthIn: 30,
      pointWeightReferenceGrains: 100,
      recommendedSpinesLabel: '400',
      recommendedSpines: [400]
    })
  ];
}

function buildVictoryVfRipXvRvlRows() {
  return [
    buildManufacturerRow({
      manufacturer: 'Victory Archery',
      tableId: 'victory_vf_rip_xv_rvl_spine_chart',
      chartVersion: '',
      sourceFile: 'spine_guide_victory_archery.pdf',
      sourcePageLabel: '1',
      sourcePageIndex: 0,
      sourceSection: 'VF/RIP XV/RVL SPINE CHART',
      rowId: 'victory-vf-rip-xv-rvl-compound-42-46lbs-29in',
      bowType: 'compound',
      productFamily: 'VF/RIP XV/RVL',
      drawWeightLabel: '42-46',
      drawWeightMinLbs: 42,
      drawWeightMaxLbs: 46,
      arrowLengthIn: 29,
      bowSpeedClassReference: '300-340 FPS',
      recommendedSpinesLabel: '500',
      recommendedSpines: [500],
      notes: ['Spine calculation based on standard 30 grains or less.']
    }),
    buildManufacturerRow({
      manufacturer: 'Victory Archery',
      tableId: 'victory_vf_rip_xv_rvl_spine_chart',
      chartVersion: '',
      sourceFile: 'spine_guide_victory_archery.pdf',
      sourcePageLabel: '1',
      sourcePageIndex: 0,
      sourceSection: 'VF/RIP XV/RVL SPINE CHART',
      rowId: 'victory-vf-rip-xv-rvl-compound-52-56lbs-31in',
      bowType: 'compound',
      productFamily: 'VF/RIP XV/RVL',
      drawWeightLabel: '52-56',
      drawWeightMinLbs: 52,
      drawWeightMaxLbs: 56,
      arrowLengthIn: 31,
      bowSpeedClassReference: '300-340 FPS',
      recommendedSpinesLabel: '350',
      recommendedSpines: [350],
      notes: ['Spine calculation based on standard 30 grains or less.']
    })
  ];
}

function buildVictoryHlrFamilyRows() {
  return [
    buildManufacturerRow({
      manufacturer: 'Victory Archery',
      tableId: 'victory_hlr_vlr_vap_family_spine_chart',
      chartVersion: '',
      sourceFile: 'spine_guide_victory_archery.pdf',
      sourcePageLabel: '1',
      sourcePageIndex: 0,
      sourceSection: 'HLR/VLR/VAP/VAP TKO/VAP SS/RIP/RIP TKO/RIP SS SPINE CHART *RIVAL(X)',
      rowId: 'victory-hlr-family-compound-47-51lbs-23in',
      bowType: 'compound',
      productFamily: 'HLR/VLR/VAP/VAP TKO/VAP SS/RIP/RIP TKO/RIP SS *RIVAL(X)',
      drawWeightLabel: '47-51',
      drawWeightMinLbs: 47,
      drawWeightMaxLbs: 51,
      arrowLengthIn: 23,
      bowSpeedClassReference: '300-340 FPS',
      recommendedSpinesLabel: '500',
      recommendedSpines: [500],
      notes: ['Spine calculation based on standard 50/60 grain insert.']
    }),
    buildManufacturerRow({
      manufacturer: 'Victory Archery',
      tableId: 'victory_hlr_vlr_vap_family_spine_chart',
      chartVersion: '',
      sourceFile: 'spine_guide_victory_archery.pdf',
      sourcePageLabel: '1',
      sourcePageIndex: 0,
      sourceSection: 'HLR/VLR/VAP/VAP TKO/VAP SS/RIP/RIP TKO/RIP SS SPINE CHART *RIVAL(X)',
      rowId: 'victory-hlr-family-compound-79-84lbs-28in',
      bowType: 'compound',
      productFamily: 'HLR/VLR/VAP/VAP TKO/VAP SS/RIP/RIP TKO/RIP SS *RIVAL(X)',
      drawWeightLabel: '79-84',
      drawWeightMinLbs: 79,
      drawWeightMaxLbs: 84,
      arrowLengthIn: 28,
      bowSpeedClassReference: '300-340 FPS',
      recommendedSpinesLabel: '250/235',
      recommendedSpines: [250, 235],
      notes: ['Spine calculation based on standard 50/60 grain insert.']
    })
  ];
}

function buildVictoryRecurveRows() {
  return [
    buildManufacturerRow({
      manufacturer: 'Victory Archery',
      tableId: 'victory_recurve_spine_chart',
      chartVersion: '',
      sourceFile: 'spine_guide_victory_archery.pdf',
      sourcePageLabel: '1',
      sourcePageIndex: 0,
      sourceSection: 'RECURVE SPINE CHART',
      rowId: 'victory-recurve-32-36lbs-29in-100-125gr',
      bowType: 'recurve',
      productFamily: 'Recurve',
      drawWeightLabel: '32-36',
      drawWeightMinLbs: 32,
      drawWeightMaxLbs: 36,
      arrowLengthIn: 29,
      pointWeightReferenceRangeGrains: [100, 125],
      recommendedSpinesLabel: '600',
      recommendedSpines: [600],
      notes: ['Spine calculation based on 100-125 grain front.']
    }),
    buildManufacturerRow({
      manufacturer: 'Victory Archery',
      tableId: 'victory_recurve_spine_chart',
      chartVersion: '',
      sourceFile: 'spine_guide_victory_archery.pdf',
      sourcePageLabel: '1',
      sourcePageIndex: 0,
      sourceSection: 'RECURVE SPINE CHART',
      rowId: 'victory-recurve-37-41lbs-29in-100-125gr',
      bowType: 'recurve',
      productFamily: 'Recurve',
      drawWeightLabel: '37-41',
      drawWeightMinLbs: 37,
      drawWeightMaxLbs: 41,
      arrowLengthIn: 29,
      pointWeightReferenceRangeGrains: [100, 125],
      recommendedSpinesLabel: '500',
      recommendedSpines: [500],
      notes: ['Spine calculation based on 100-125 grain front.']
    }),
    buildManufacturerRow({
      manufacturer: 'Victory Archery',
      tableId: 'victory_recurve_spine_chart',
      chartVersion: '',
      sourceFile: 'spine_guide_victory_archery.pdf',
      sourcePageLabel: '1',
      sourcePageIndex: 0,
      sourceSection: 'RECURVE SPINE CHART',
      rowId: 'victory-recurve-52-56lbs-30in-100-125gr',
      bowType: 'recurve',
      productFamily: 'Recurve',
      drawWeightLabel: '52-56',
      drawWeightMinLbs: 52,
      drawWeightMaxLbs: 56,
      arrowLengthIn: 30,
      pointWeightReferenceRangeGrains: [100, 125],
      recommendedSpinesLabel: '400',
      recommendedSpines: [400],
      notes: ['Spine calculation based on 100-125 grain front.']
    })
  ];
}

function buildCarbonExpressHuntingRows() {
  return [
    buildManufacturerRow({
      manufacturer: 'Carbon Express',
      tableId: 'carbonexpress_hunting_shaft_selection',
      chartVersion: '',
      sourceFile: 'carbon_express/hunting-arrow-shaft-selection-scaled2.webp',
      sourceImage: 'hunting-arrow-shaft-selection-scaled2.webp',
      sourceSection: 'HUNTING ARROW SHAFT SELECTION GUIDE',
      rowId: 'carbonexpress-hunting-recurve-40-45lbs-29in',
      bowType: 'recurve',
      bowFamily: 'hunting',
      drawWeightLabel: '40-45',
      drawWeightMinLbs: 40,
      drawWeightMaxLbs: 45,
      arrowLengthIn: 29,
      productRecommendationLabel: '500 / XSD 500',
      recommendedSpinesLabel: '500 / XSD 500',
      recommendedSpines: [500],
      shaftFamilies: ['500', 'XSD 500']
    }),
    buildManufacturerRow({
      manufacturer: 'Carbon Express',
      tableId: 'carbonexpress_hunting_shaft_selection',
      chartVersion: '',
      sourceFile: 'carbon_express/hunting-arrow-shaft-selection-scaled2.webp',
      sourceImage: 'hunting-arrow-shaft-selection-scaled2.webp',
      sourceSection: 'HUNTING ARROW SHAFT SELECTION GUIDE',
      rowId: 'carbonexpress-hunting-recurve-52-57lbs-31in',
      bowType: 'recurve',
      bowFamily: 'hunting',
      drawWeightLabel: '52-57',
      drawWeightMinLbs: 52,
      drawWeightMaxLbs: 57,
      arrowLengthIn: 31,
      productRecommendationLabel: '350 / SD 350 / XSD 350',
      recommendedSpinesLabel: '350 / SD 350 / XSD 350',
      recommendedSpines: [350],
      shaftFamilies: ['350', 'SD 350', 'XSD 350']
    }),
    buildManufacturerRow({
      manufacturer: 'Carbon Express',
      tableId: 'carbonexpress_hunting_shaft_selection',
      chartVersion: '',
      sourceFile: 'carbon_express/hunting-arrow-shaft-selection-scaled2.webp',
      sourceImage: 'hunting-arrow-shaft-selection-scaled2.webp',
      sourceSection: 'HUNTING ARROW SHAFT SELECTION GUIDE',
      rowId: 'carbonexpress-hunting-compound-40-45lbs-29in',
      bowType: 'compound',
      bowFamily: 'hunting',
      drawWeightLabel: '40-45',
      drawWeightMinLbs: 40,
      drawWeightMaxLbs: 45,
      arrowLengthIn: 29,
      productRecommendationLabel: '400 / SD 400 / XSD 400',
      recommendedSpinesLabel: '400 / SD 400 / XSD 400',
      recommendedSpines: [400],
      shaftFamilies: ['400', 'SD 400', 'XSD 400'],
      notes: ['Compound rows depend on the separate Adjustable Weight Chart.']
    })
  ];
}

function buildCarbonExpressHuntingTrispineRows() {
  return [
    buildManufacturerRow({
      manufacturer: 'Carbon Express',
      tableId: 'carbonexpress_hunting_trispine_shaft_selection',
      chartVersion: '',
      sourceFile: 'carbon_express/hunting-trispine-arrow-shaft-selection-scaled5.webp',
      sourceImage: 'hunting-trispine-arrow-shaft-selection-scaled5.webp',
      sourceSection: 'ARROW SHAFT SELECTION CHART',
      rowId: 'carbonexpress-trispine-compound-40-47lbs-29in',
      bowType: 'compound',
      bowFamily: 'hunting',
      drawWeightLabel: '40-47',
      drawWeightMinLbs: 40,
      drawWeightMaxLbs: 47,
      requiresAdjustedDrawWeight: true,
      arrowLengthIn: 29,
      productRecommendationLabel: '400 / SD 400 / TR 400',
      recommendedSpinesLabel: '400 / SD 400 / TR 400',
      recommendedSpines: [400],
      shaftFamilies: ['400', 'SD 400', 'TR 400'],
      notes: ['Compound rows depend on the separate Adjustable Weight Chart.']
    }),
    buildManufacturerRow({
      manufacturer: 'Carbon Express',
      tableId: 'carbonexpress_hunting_trispine_shaft_selection',
      chartVersion: '',
      sourceFile: 'carbon_express/hunting-trispine-arrow-shaft-selection-scaled5.webp',
      sourceImage: 'hunting-trispine-arrow-shaft-selection-scaled5.webp',
      sourceSection: 'ARROW SHAFT SELECTION CHART',
      rowId: 'carbonexpress-trispine-compound-48-55lbs-32in',
      bowType: 'compound',
      bowFamily: 'hunting',
      drawWeightLabel: '48-55',
      drawWeightMinLbs: 48,
      drawWeightMaxLbs: 55,
      requiresAdjustedDrawWeight: true,
      arrowLengthIn: 32,
      productRecommendationLabel: '350 / SD 350 / TR350',
      recommendedSpinesLabel: '350 / SD 350 / TR350',
      recommendedSpines: [350],
      shaftFamilies: ['350', 'SD 350', 'TR350'],
      notes: ['Compound rows depend on the separate Adjustable Weight Chart.']
    })
  ];
}

function buildCarbonExpressTargetRows() {
  return [
    buildManufacturerRow({
      manufacturer: 'Carbon Express',
      tableId: 'carbonexpress_target_arrow_selection',
      chartVersion: '',
      sourceFile: 'carbon_express/target-arrow-selection-chart3.jpg',
      sourceImage: 'target-arrow-selection-chart3.jpg',
      sourceSection: 'TARGET ARROW SELECTION CHART',
      rowId: 'carbonexpress-target-recurve-24-34lbs-29in',
      bowType: 'recurve',
      bowFamily: 'target',
      drawWeightLabel: '24-34',
      drawWeightMinLbs: 24,
      drawWeightMaxLbs: 34,
      arrowLengthIn: 29,
      productRecommendationLabel: 'XB700',
      recommendedSpinesLabel: 'XB700',
      recommendedSpines: [700],
      shaftFamilies: ['XB700']
    }),
    buildManufacturerRow({
      manufacturer: 'Carbon Express',
      tableId: 'carbonexpress_target_arrow_selection',
      chartVersion: '',
      sourceFile: 'carbon_express/target-arrow-selection-chart3.jpg',
      sourceImage: 'target-arrow-selection-chart3.jpg',
      sourceSection: 'TARGET ARROW SELECTION CHART',
      rowId: 'carbonexpress-target-recurve-35-39lbs-29in',
      bowType: 'recurve',
      bowFamily: 'target',
      drawWeightLabel: '35-39',
      drawWeightMinLbs: 35,
      drawWeightMaxLbs: 39,
      arrowLengthIn: 29,
      productRecommendationLabel: 'XB700',
      recommendedSpinesLabel: 'XB700',
      recommendedSpines: [700],
      shaftFamilies: ['XB700']
    }),
    buildManufacturerRow({
      manufacturer: 'Carbon Express',
      tableId: 'carbonexpress_target_arrow_selection',
      chartVersion: '',
      sourceFile: 'carbon_express/target-arrow-selection-chart3.jpg',
      sourceImage: 'target-arrow-selection-chart3.jpg',
      sourceSection: 'TARGET ARROW SELECTION CHART',
      rowId: 'carbonexpress-target-recurve-35-39lbs-30in',
      bowType: 'recurve',
      bowFamily: 'target',
      drawWeightLabel: '35-39',
      drawWeightMinLbs: 35,
      drawWeightMaxLbs: 39,
      arrowLengthIn: 30,
      productRecommendationLabel: 'XB600',
      recommendedSpinesLabel: 'XB600',
      recommendedSpines: [600],
      shaftFamilies: ['XB600']
    }),
    buildManufacturerRow({
      manufacturer: 'Carbon Express',
      tableId: 'carbonexpress_target_arrow_selection',
      chartVersion: '',
      sourceFile: 'carbon_express/target-arrow-selection-chart3.jpg',
      sourceImage: 'target-arrow-selection-chart3.jpg',
      sourceSection: 'TARGET ARROW SELECTION CHART',
      rowId: 'carbonexpress-target-recurve-40-45lbs-29in',
      bowType: 'recurve',
      bowFamily: 'target',
      drawWeightLabel: '40-45',
      drawWeightMinLbs: 40,
      drawWeightMaxLbs: 45,
      arrowLengthIn: 29,
      productRecommendationLabel: 'T23D500 / LJ / XB600',
      recommendedSpinesLabel: 'T23D500 / LJ / XB600',
      recommendedSpines: [500, 600],
      shaftFamilies: ['T23D500', 'LJ', 'XB600']
    })
  ];
}

function buildManufacturerRow({
  arrowLengthIn,
  notes = [],
  shaftFamilies = [],
  pointWeightReferenceGrains = null,
  pointWeightReferenceRangeGrains = null,
  releaseTypeReference = null,
  bowSpeedClassReference = null,
  arrowMaterialFamily = '',
  productFamily = '',
  bowFamily = '',
  sourcePageLabel = null,
  sourcePageIndex = null,
  sourceImage = null,
  productRecommendationLabel = '',
  ...row
}) {
  return {
    ...row,
    sourcePageLabel,
    sourcePageIndex,
    sourceImage,
    status: 'verified',
    arrowMaterialFamily,
    productFamily,
    bowFamily,
    arrowLengthMinIn: arrowLengthIn,
    arrowLengthMaxIn: arrowLengthIn,
    pointWeightReferenceGrains,
    pointWeightReferenceRangeGrains,
    releaseTypeReference,
    bowSpeedClassReference,
    productRecommendationLabel,
    shaftFamilies,
    notes,
    confidence: 'manufacturer-table'
  };
}

function parseRecommendedSpinesLabel(label) {
  return label.split('-').map(value => Number(value));
}

function normalizeIdPart(value) {
  return value
    .toLowerCase()
    .replace(/lbs\./g, 'lbs')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Format cible pour une future ligne, sans interpolation ni extrapolation :
//
// {
//   manufacturer: 'Easton',
//   tableId: 'easton_target_301055A_ac_all_carbon',
//   chartVersion: '301055-A',
//   sourceFile: '301055-A-Arrow-Shaft-Selection-Target.pdf',
//   sourcePageLabel: '1',
//   sourcePageIndex: 0,
//   sourceSection: 'A/C • ALL-CARBON ARROW CUT LENGTH',
//   status: 'verified',
//   bowType: 'compound',
//   arrowMaterialFamily: 'A/C all-carbon',
//   drawWeightMinLbs: 40,
//   drawWeightMaxLbs: 44,
//   arrowLengthMinIn: 29,
//   arrowLengthMaxIn: 29,
//   pointWeightReferenceGrains: 100,
//   releaseTypeReference: 'mechanical',
//   bowSpeedClassReference: '301-320 FPS',
//   recommendedSpinesLabel: '575-500',
//   recommendedSpines: [575, 500],
//   shaftFamilies: [],
//   notes: [],
//   confidence: 'manufacturer-table'
// }
//
// Tant qu'une source garde `status: "metadata-only"`, elle ne doit produire
// aucune recommandation de spine.
