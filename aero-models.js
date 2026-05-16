// aero-models.js
// Noyau aérodynamique volontairement conservateur.
// Ce module fournit les grandeurs atmosphériques et les métadonnées de régime
// sans prétendre à une loi Cd sourcée tant que le dépôt n'en contient pas une.

const DRY_AIR_GAS_CONSTANT_J_KG_K = 287.058;

// Loi de Sutherland pour l'air sec :
// μ = μ0 * (T / T0)^(3/2) * (T0 + S) / (T + S)
// avec μ0 = 1.716e-5 Pa·s, T0 = 273.15 K, S = 111 K.
// Ces constantes standards décrivent la viscosité dynamique de l'air sec.
const SUTHERLAND_REFERENCE_VISCOSITY_PA_S = 1.716e-5;
const SUTHERLAND_REFERENCE_TEMPERATURE_K = 273.15;
const SUTHERLAND_CONSTANT_K = 111;

// Valeur de repli de compatibilité : le dépôt ne contient pas encore de loi Cd
// sourcée exploitable. On garde donc un unique Cd conservateur, avec confidence
// "rough", au lieu de fabriquer une table plus précise qu'elle ne le serait.
export const CONSERVATIVE_FALLBACK_CD = 1.0;

// Seuils de migration repris du worker précédent pour conserver une lecture
// stable des régimes. Ils qualifient l'incertitude ; ils ne revendiquent pas
// encore une frontière aérodynamique validée par une synthèse sourcée.
const LOW_RE_MAX = 20000;
const TRANSITION_RE_MAX = 80000;

export function calculateAirDensity(tempC, pressureHpa) {
  const temperatureK = tempC + 273.15;
  const pressurePa = pressureHpa * 100;
  if (!Number.isFinite(temperatureK) || !Number.isFinite(pressurePa) || temperatureK <= 0) {
    return NaN;
  }
  return pressurePa / (DRY_AIR_GAS_CONSTANT_J_KG_K * temperatureK);
}

export function calculateDynamicViscosity(tempC) {
  const temperatureK = tempC + 273.15;
  if (!Number.isFinite(temperatureK) || temperatureK <= 0) return NaN;
  return SUTHERLAND_REFERENCE_VISCOSITY_PA_S
    * Math.pow(temperatureK / SUTHERLAND_REFERENCE_TEMPERATURE_K, 1.5)
    * ((SUTHERLAND_REFERENCE_TEMPERATURE_K + SUTHERLAND_CONSTANT_K) / (temperatureK + SUTHERLAND_CONSTANT_K));
}

export function calculateReynoldsNumber({ rho, speedMps, diameterM, mu }) {
  if (
    !Number.isFinite(rho)
    || !Number.isFinite(speedMps)
    || !Number.isFinite(diameterM)
    || !Number.isFinite(mu)
    || rho < 0
    || diameterM < 0
    || mu <= 0
  ) {
    return NaN;
  }
  return rho * Math.abs(speedMps) * diameterM / mu;
}

export function getDragCoefficient({
  re,
  attackAngleDeg = 0,
  pointShape = 'field',
  vaneConfig = null,
  model = 'conservative'
} = {}) {
  const regime = classifyAeroRegime(re);
  const warnings = [];

  if (regime === 'transition') {
    warnings.push('Zone de transition aérodynamique : Cd plus incertain.');
  }

  if (model !== 'conservative') {
    warnings.push(`Modèle Cd inconnu: ${String(model)}.`);
    return {
      cd: CONSERVATIVE_FALLBACK_CD,
      regime,
      confidence: 'unknown',
      warnings
    };
  }

  // Paramètres déjà prévus pour les itérations suivantes, mais volontairement
  // non utilisés ici faute de calibration Cd sourcée dans le dépôt courant.
  void attackAngleDeg;
  void pointShape;
  void vaneConfig;

  return {
    cd: CONSERVATIVE_FALLBACK_CD,
    regime,
    confidence: 'rough',
    warnings
  };
}

export function classifyAeroRegime(re) {
  if (!Number.isFinite(re) || re < 0) return 'unknown';
  if (re < LOW_RE_MAX) return 'low-re';
  if (re < TRANSITION_RE_MAX) return 'transition';
  return 'high-re';
}
