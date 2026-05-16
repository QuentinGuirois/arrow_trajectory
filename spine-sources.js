// spine-sources.js
// Registre de provenance : pages officielles, assets de chart et sources manifest-only.

export const SPINE_SOURCES = [
  {
    sourceId: 'easton_target_301055A_pdf',
    manufacturer: 'Easton',
    title: '301055-A Arrow Shaft Selection Target',
    sourceUrl: 'https://eastonarchery.com/wp-content/uploads/2023/08/301055-A-Arrow-Shaft-Selection-Target.pdf',
    official: true,
    role: 'manufacturer-chart',
    status: 'available'
  },
  {
    sourceId: 'easton_hunting_301055A_pdf',
    manufacturer: 'Easton',
    title: '301055-A Arrow Shaft Selection Hunting',
    sourceUrl: 'https://eastonarchery.com/wp-content/uploads/2023/08/301055-A-Arrow-Shaft-Selection-Hunting.pdf',
    official: true,
    role: 'manufacturer-chart',
    status: 'manifest-only'
  },
  {
    sourceId: 'gold_tip_spine_selector_page',
    manufacturer: 'Gold Tip',
    title: 'Spine Selector Tool',
    sourceUrl: 'https://goldtip.com/pages/spine-selector',
    official: true,
    role: 'manufacturer-chart',
    status: 'available'
  },
  {
    sourceId: 'black_eagle_spine_chart_page',
    manufacturer: 'Black Eagle',
    title: 'Arrow Sizing Spine Chart',
    sourceUrl: 'https://blackeaglearrows.com/arrow-sizing-spine-chart/',
    official: true,
    role: 'manufacturer-chart',
    status: 'available'
  },
  {
    sourceId: 'victory_arrow_guide_page',
    manufacturer: 'Victory',
    title: 'Arrow Guide',
    sourceUrl: 'https://victoryarchery.com/arrow-guide/',
    official: true,
    role: 'manufacturer-chart',
    status: 'available'
  },
  {
    sourceId: 'carbon_express_chart_hub',
    manufacturer: 'Carbon Express',
    title: 'Carbon Express Arrow Charts',
    sourceUrl: 'https://feradyne.com/pages/carbon-express-arrow-charts',
    official: true,
    role: 'manufacturer-chart-hub',
    status: 'available'
  },
  {
    sourceId: 'skylon_target_chart_pdf',
    manufacturer: 'Skylon',
    title: 'Target chart',
    sourceUrl: 'https://www.skylonarchery.com/images/chart/chart%20target.pdf',
    official: true,
    role: 'manufacturer-chart',
    status: 'manifest-only'
  },
  {
    sourceId: 'skylon_hunting_chart_pdf',
    manufacturer: 'Skylon',
    title: 'Hunting chart',
    sourceUrl: 'https://www.skylonarchery.com/images/chart/chart%20hunting.pdf',
    official: true,
    role: 'manufacturer-chart',
    status: 'manifest-only'
  },
  {
    sourceId: 'three_rivers_spine_charts_pdf',
    manufacturer: '3Rivers Archery',
    title: 'Spine Selection Charts',
    sourceUrl: 'https://www.3riversarchery.com/pdf/ArrowCharts.pdf',
    official: false,
    role: 'secondary-reference',
    status: 'manifest-only'
  },
  {
    sourceId: 'three_rivers_wood_chart_pdf',
    manufacturer: '3Rivers Archery',
    title: 'Wood shaft spine chart',
    sourceUrl: 'https://www.3riversarchery.com/pdf/woodchart.pdf',
    official: false,
    role: 'secondary-reference',
    status: 'manifest-only'
  },
  {
    sourceId: 'three_rivers_dynamic_spine_calc',
    manufacturer: '3Rivers Archery',
    title: 'Dynamic Spine Arrow Calculator',
    sourceUrl: 'https://www.3riversarchery.com/dynamic-spine-arrow-calculator-from-3rivers-archery.html',
    official: false,
    role: 'secondary-reference',
    status: 'manifest-only'
  },
  {
    sourceId: 'ashby_arrow_spine_calculator',
    manufacturer: 'Ashby Bowhunting Foundation',
    title: 'Arrow Spine Calculator',
    sourceUrl: 'https://www.ashbybowhunting.org/arrow-spine-calculator',
    official: false,
    role: 'secondary-reference',
    status: 'manifest-only'
  },
  {
    sourceId: 'stu_miller_mirror_fr',
    manufacturer: 'Community mirror',
    title: 'V2 Dynamic Spine Calculator Rev 12-25-10',
    sourceUrl: 'https://archers3d.jimdofree.com/calculateur-de-spine/',
    official: false,
    role: 'secondary-reference',
    status: 'manifest-only'
  },
  {
    sourceId: 'arrow_builder_spreadsheet_thread',
    manufacturer: 'Community',
    title: 'Arrow Builder Spreadsheet thread',
    sourceUrl: 'https://rokslide.com/forums/threads/arrow-builder-spreadsheet.389861/',
    official: false,
    role: 'secondary-reference',
    status: 'manifest-only'
  }
];

export const SPINE_SOURCE_INDEX = Object.fromEntries(
  SPINE_SOURCES.map(source => [source.sourceId, source])
);

export const SPINE_MANIFEST_ONLY_SOURCES = [
  {
    manifestId: 'easton_hunting_301055A',
    sourceId: 'easton_hunting_301055A_pdf',
    reason: 'PDF officiel identifié, mais le tableau n’est pas encore transcrit cellule par cellule avec une confiance suffisante.'
  },
  {
    manifestId: 'black_eagle_traditional_2023',
    sourceId: 'black_eagle_spine_chart_page',
    reason: 'Table officielle lisible mais structure traditionnelle miroir plus complexe ; elle reste hors lookup tant que la transcription complète n’est pas relue.'
  },
  {
    manifestId: 'carbon_express_chart_suite_remaining',
    sourceId: 'carbon_express_chart_hub',
    reason: 'Le hub officiel expose plusieurs charts ; les charts Trispine et Light Recurve sont intégrés ici, les autres restent manifest-only jusqu’à transcription exhaustive relue.'
  },
  {
    manifestId: 'skylon_target_chart',
    sourceId: 'skylon_target_chart_pdf',
    reason: 'Le PDF emploie des groupes intermédiaires à résoudre contre la cartographie produit ; pas de recommandation directe tant que ce mapping n’est pas modélisé.'
  },
  {
    manifestId: 'skylon_hunting_chart',
    sourceId: 'skylon_hunting_chart_pdf',
    reason: 'Le PDF emploie des groupes intermédiaires à résoudre contre la cartographie produit ; pas de recommandation directe tant que ce mapping n’est pas modélisé.'
  },
  {
    manifestId: 'three_rivers_spine_charts',
    sourceId: 'three_rivers_spine_charts_pdf',
    reason: 'Source secondaire utile en recoupement, non utilisée comme recommandation fabricant.'
  },
  {
    manifestId: 'three_rivers_wood_chart',
    sourceId: 'three_rivers_wood_chart_pdf',
    reason: 'Source secondaire utile en recoupement, non utilisée comme recommandation fabricant.'
  },
  {
    manifestId: 'three_rivers_dynamic_calculator',
    sourceId: 'three_rivers_dynamic_spine_calc',
    reason: 'Calculateur secondaire, non utilisé comme recommandation fabricant.'
  },
  {
    manifestId: 'ashby_spine_calculator',
    sourceId: 'ashby_arrow_spine_calculator',
    reason: 'Calculateur secondaire, non utilisé comme recommandation fabricant.'
  },
  {
    manifestId: 'stu_miller_mirror',
    sourceId: 'stu_miller_mirror_fr',
    reason: 'Miroir communautaire utile pour recherche, non utilisé comme recommandation fabricant.'
  },
  {
    manifestId: 'arrow_builder_spreadsheet',
    sourceId: 'arrow_builder_spreadsheet_thread',
    reason: 'Dataset communautaire utile pour des specs composants, non utilisé comme recommandation fabricant.'
  }
];
