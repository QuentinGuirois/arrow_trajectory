// spine-tables.js
// Registre strictement séparé des sources fabricant.
// Aucune ligne numérique n'est transcrite tant qu'elle n'a pas été relue et validée.

const STATIC_SPINE_NOTE = 'Manufacturer static spine notation; lower number means stiffer shaft.';

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

// Format cible pour une future ligne, sans interpolation ni extrapolation :
//
// {
//   rowId: 'source-specific-id',
//   status: 'verified',
//   sourcePage: 1,
//   sourceSection: 'A/C all-carbon arrow cut length',
//   criteria: {
//     bowType: 'compound',
//     releaseType: 'mechanical',
//     speedClass: '301-320-fps',
//     drawWeightLbs: { min: 40, max: 44 },
//     arrowLengthIn: { min: 29, max: 29 },
//     pointWeightGrains: { min: 100, max: 100 }
//   },
//   recommendation: {
//     spines: ['575-500'],
//     shaftFamilies: []
//   },
//   notes: []
// }
//
// Tant qu'une source garde `status: "metadata-only"`, elle ne doit produire
// aucune recommandation de spine.
