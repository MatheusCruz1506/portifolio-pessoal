import i18n from "../i18n";

const PROVINCE_TRANSLATION_KEY_BY_NAME: Record<string, string> = {
  "Província Brasileira": "provinces.brazilian",
  "Província da Italia": "provinces.italian",
  "Província Romana": "provinces.roman",
  "Província Siciliana-Napolitana": "provinces.sicilianNapolitan",
  "Província Espanhola": "provinces.spanish",
  "Província Alemã": "provinces.german",
  "Província Polonesa": "provinces.polish",
  "Província das Filipinas": "provinces.philippines",
  "Província da India": "provinces.india",
  "Província da Tailandia": "provinces.thailand",
  "Província do Vietnã": "provinces.vietnam",
  "Província de Benin-Togo": "provinces.beninTogo",
  "Província de Burkina Faso": "provinces.burkinaFaso",
  "Administração Geral": "provinces.generalAdministration",
};

export function getProvinceTranslationKey(province?: string | null) {
  if (!province) {
    return null;
  }

  return PROVINCE_TRANSLATION_KEY_BY_NAME[province] ?? null;
}

export function translateProvinceName(province?: string | null) {
  if (!province) {
    return "";
  }

  const translationKey = getProvinceTranslationKey(province);

  if (!translationKey) {
    return province;
  }

  return String(i18n.t(translationKey, { defaultValue: province }));
}
