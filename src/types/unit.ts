import type { Enums, Tables } from "./index";

export type Unit = Tables<"units">;
export type UnitHistory = Tables<"unit_history">;
export type UnitHistoryAction = Enums<"unit_history_action">;
export type UnitStatus = Enums<"unit_status">;
export type UnitType = Enums<"unit_type">;
export type Province = Unit["province"];

export type LegacyUnitFields = Partial<{
  category: string | null;
  telefones: string | null;
  emails: string | null;
  operating_hours: string | null;
  horario_funcionamento: string | null;
}>;

export type UnitWithLegacyFields = Unit & LegacyUnitFields;

export interface AddressSelection {
  display_name: string;
  latitude: string;
  longitude: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
}
