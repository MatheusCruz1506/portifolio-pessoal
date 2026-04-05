import { z } from "zod";
import { PROVINCES } from "../constants/provinces";

export { PROVINCES } from "../constants/provinces";

export const UNIT_TYPES = [
  "Hospital",
  "Centro Universitário",
  "Paróquia",
  "Casa de Repouso",
  "Seminário",
  "Missão",
  "Outro",
] as const;

export const STATUS_TYPES = ["Ativo", "Vendido"] as const;

const provinceEnum = z.enum(PROVINCES, {
  message: "Selecione uma província administradora valida",
});

const unitTypeEnum = z.enum(UNIT_TYPES, {
  error: "Selecione o tipo de unidade valido",
});

const unitStatusEnum = z.enum(STATUS_TYPES, {
  error: "Selecione o status operacional",
});

export const unitSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  type: unitTypeEnum,
  province: provinceEnum,
  status: unitStatusEnum,
  country: z.string().min(2, "O pais e obrigatorio"),
  state: z.string().optional().or(z.literal("")),
  city: z.string().min(2, "A cidade e obrigatoria"),
  address: z.string().min(5, "Informe o endereco completo"),
  zip_code: z.string().optional().or(z.literal("")),
  latitude: z.coerce
    .number({ error: "A latitude deve ser um numero" })
    .min(-90)
    .max(90),
  longitude: z.coerce
    .number({ error: "A longitude deve ser um numero" })
    .min(-180)
    .max(180),
  email: z.email("Formato de e-mail invalido").optional().or(z.literal("")),
  phone: z
    .string()
    .optional()
    .transform((val) => (val ? val.replace(/[^\d+]/g, "") : "")),
  website: z
    .url("A URL deve ser valida (ex: https://...)")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(500, "A descricao deve ter no maximo 500 caracteres")
    .optional()
    .or(z.literal("")),
  image_url: z
    .url("A URL da imagem deve ser valida")
    .optional()
    .or(z.literal("")),
});

export type UnitFormInput = z.input<typeof unitSchema>;
export type UnitFormOutput = z.infer<typeof unitSchema>;
export type UnitFormData = UnitFormOutput;
