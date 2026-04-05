export const PROVINCES = [
  "Província Brasileira",
  "Província da Italia",
  "Província Romana",
  "Província Siciliana-Napolitana",
  "Província Espanhola",
  "Província Alemã",
  "Província Polonesa",
  "Província das Filipinas",
  "Província da India",
  "Província da Tailandia",
  "Província do Vietnã",
  "Província de Benin-Togo",
  "Província de Burkina Faso",
] as const;

export const GENERAL_ADMINISTRATION_PROVINCE = "Administração Geral" as const;

export const USER_REGISTRATION_PROVINCES = [
  ...PROVINCES,
  GENERAL_ADMINISTRATION_PROVINCE,
] as const;

export type ProvinceName = (typeof PROVINCES)[number];
export type UserProvinceName = (typeof USER_REGISTRATION_PROVINCES)[number];

type ProvinceBias = {
  countries: string[];
};

type ProvinceMapViewport = {
  center: [number, number];
  zoom: number;
};

export const PROVINCE_BIAS_BY_NAME: Record<ProvinceName, ProvinceBias> = {
  "Província Brasileira": {
    countries: ["Brasil"],
  },
  "Província da Italia": {
    countries: ["Italia", "Italy"],
  },
  "Província Romana": {
    countries: ["Italia", "Italy", "Vaticano", "Vatican City"],
  },
  "Província Siciliana-Napolitana": {
    countries: ["Italia", "Italy"],
  },
  "Província Espanhola": {
    countries: ["Espanha", "Spain"],
  },
  "Província Alemã": {
    countries: ["Alemanha", "Germany"],
  },
  "Província Polonesa": {
    countries: ["Polonia", "Poland", "Polônia"],
  },
  "Província das Filipinas": {
    countries: ["Filipinas", "Philippines"],
  },
  "Província da India": {
    countries: ["India", "Índia"],
  },
  "Província da Tailandia": {
    countries: ["Thailand", "Tailandia", "Tailândia"],
  },
  "Província do Vietnã": {
    countries: ["Vietnam", "Viet Nam", "Vietnã"],
  },
  "Província de Benin-Togo": {
    countries: ["Benin", "Bénin", "Togo"],
  },
  "Província de Burkina Faso": {
    countries: ["Burkina Faso"],
  },
};

export const PROVINCE_MAP_VIEWPORT_BY_NAME: Record<
  ProvinceName,
  ProvinceMapViewport
> = {
  "Província Brasileira": {
    center: [-14.235, -51.9253],
    zoom: 4,
  },
  "Província da Italia": {
    center: [41.8719, 12.5674],
    zoom: 6,
  },
  "Província Romana": {
    center: [41.9028, 12.4964],
    zoom: 8,
  },
  "Província Siciliana-Napolitana": {
    center: [40.8518, 14.2681],
    zoom: 6,
  },
  "Província Espanhola": {
    center: [40.4637, -3.7492],
    zoom: 6,
  },
  "Província Alemã": {
    center: [51.1657, 10.4515],
    zoom: 6,
  },
  "Província Polonesa": {
    center: [51.9194, 19.1451],
    zoom: 6,
  },
  "Província das Filipinas": {
    center: [12.8797, 121.774],
    zoom: 5,
  },
  "Província da India": {
    center: [20.5937, 78.9629],
    zoom: 5,
  },
  "Província da Tailandia": {
    center: [15.87, 100.9925],
    zoom: 6,
  },
  "Província do Vietnã": {
    center: [14.0583, 108.2772],
    zoom: 6,
  },
  "Província de Benin-Togo": {
    center: [8.9806, 1.2079],
    zoom: 6,
  },
  "Província de Burkina Faso": {
    center: [12.2383, -1.5616],
    zoom: 7,
  },
};

export function isProvinceName(value: string): value is ProvinceName {
  return PROVINCES.includes(value as ProvinceName);
}

export function isUserProvinceName(value: string): value is UserProvinceName {
  return USER_REGISTRATION_PROVINCES.includes(value as UserProvinceName);
}

export function getProvinceBiasCountries(province?: string | null) {
  if (!province || !isProvinceName(province)) {
    return [];
  }

  return PROVINCE_BIAS_BY_NAME[province].countries;
}

export function getProvinceMapViewport(province?: string | null) {
  if (!province || !isProvinceName(province)) {
    return null;
  }

  return PROVINCE_MAP_VIEWPORT_BY_NAME[province];
}
