// spine-tables.js
// Registre strictement séparé des sources fabricant.
// Aucune ligne numérique n'est transcrite tant qu'elle n'a pas été relue et validée.

const STATIC_SPINE_NOTE = 'Manufacturer static spine notation; lower number means stiffer shaft.';
const EASTON_301055A_SOURCE_SECTION = 'A/C • ALL-CARBON ARROW CUT LENGTH';

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
    status: 'metadata-only',
    baseline: {
      unitNotes: {
        arrowLength: '',
        pointWeight: '',
        spine: STATIC_SPINE_NOTE
      }
    },
    adjustments: {},
    rows: []
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
    status: 'metadata-only',
    baseline: {
      unitNotes: {
        arrowLength: '',
        pointWeight: '',
        spine: STATIC_SPINE_NOTE
      }
    },
    adjustments: {},
    rows: []
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
    status: 'metadata-only',
    baseline: {
      unitNotes: {
        arrowLength: '',
        pointWeight: '',
        spine: STATIC_SPINE_NOTE
      }
    },
    adjustments: {},
    rows: []
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
