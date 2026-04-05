import { unitSchema } from "../schemas/formSchema";
import type { TablesInsert } from "../types";
import type { Unit } from "../types/unit";

type UnitInsert = TablesInsert<"units">;

export const UNIT_BATCH_HEADERS = [
  "name",
  "type",
  "status",
  "address",
  "city",
  "province",
  "state",
  "country",
  "zip_code",
  "email",
  "phone",
  "website",
  "latitude",
  "longitude",
  "description",
  "image_url",
] as const;

const REQUIRED_IMPORT_HEADERS = [
  "name",
  "type",
  "address",
  "city",
  "country",
  "latitude",
  "longitude",
] as const;

const HEADER_ALIASES: Record<string, string[]> = {
  zip_code: ["zip", "zipcode", "postal_code", "cep"],
  image_url: ["image", "imageurl", "photo_url"],
};

export interface ParsedUnitBatch {
  rows: UnitInsert[];
  errors: string[];
  totalRows: number;
}

function normalizeHeader(header: string) {
  return header.trim().toLowerCase();
}

function getResolvedHeaderIndex(
  headerIndexMap: Map<string, number>,
  headerName: string,
) {
  const normalized = normalizeHeader(headerName);

  if (headerIndexMap.has(normalized)) {
    return headerIndexMap.get(normalized);
  }

  const aliases = HEADER_ALIASES[normalized] ?? [];

  for (const alias of aliases) {
    const aliasIndex = headerIndexMap.get(normalizeHeader(alias));
    if (typeof aliasIndex === "number") {
      return aliasIndex;
    }
  }

  return undefined;
}

function getCellValue(row: string[], index?: number) {
  if (typeof index !== "number") {
    return "";
  }

  return row[index]?.trim() ?? "";
}

function escapeCsvValue(value: unknown) {
  const text = value == null ? "" : String(value);

  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function parseCsv(text: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = "";
  let isInsideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (isInsideQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          currentValue += '"';
          index += 1;
        } else {
          isInsideQuotes = false;
        }
      } else {
        currentValue += char;
      }

      continue;
    }

    if (char === '"') {
      isInsideQuotes = true;
      continue;
    }

    if (char === ",") {
      currentRow.push(currentValue);
      currentValue = "";
      continue;
    }

    if (char === "\n") {
      currentRow.push(currentValue);

      if (currentRow.some((value) => value.trim().length > 0)) {
        rows.push(currentRow);
      }

      currentRow = [];
      currentValue = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    currentValue += char;
  }

  currentRow.push(currentValue);

  if (currentRow.some((value) => value.trim().length > 0)) {
    rows.push(currentRow);
  }

  return rows;
}

export function serializeUnitsToCsv(units: Unit[]) {
  const lines = units.map((unit) =>
    UNIT_BATCH_HEADERS.map((header) => {
      switch (header) {
        case "name":
          return escapeCsvValue(unit.name);
        case "type":
          return escapeCsvValue(unit.type);
        case "status":
          return escapeCsvValue(unit.status ?? "");
        case "address":
          return escapeCsvValue(unit.address);
        case "city":
          return escapeCsvValue(unit.city);
        case "province":
          return escapeCsvValue(unit.province);
        case "state":
          return escapeCsvValue(unit.state ?? "");
        case "country":
          return escapeCsvValue(unit.country);
        case "zip_code":
          return escapeCsvValue(unit.zip_code ?? "");
        case "email":
          return escapeCsvValue(unit.email ?? "");
        case "phone":
          return escapeCsvValue(unit.phone ?? "");
        case "website":
          return escapeCsvValue(unit.website ?? "");
        case "latitude":
          return escapeCsvValue(unit.latitude);
        case "longitude":
          return escapeCsvValue(unit.longitude);
        case "description":
          return escapeCsvValue(unit.description ?? "");
        case "image_url":
          return escapeCsvValue(unit.image_url ?? "");
        default:
          return "";
      }
    }).join(","),
  );

  return [UNIT_BATCH_HEADERS.join(","), ...lines].join("\n");
}

export function buildUnitTemplateCsv(province: string) {
  return [
    UNIT_BATCH_HEADERS.join(","),
    [
      "Hospital Sao Camilo Exemplo",
      "Hospital",
      "Ativo",
      "Rua Exemplo, 123",
      "Sao Paulo",
      province,
      "SP",
      "Brasil",
      "01000-000",
      "contato@saocamilo.org",
      "+5511999999999",
      "https://saocamilo.org",
      "-23.5505",
      "-46.6333",
      "Unidade cadastrada via importacao em lote.",
      "",
    ]
      .map((value) => escapeCsvValue(value))
      .join(","),
  ].join("\n");
}

export function parseUnitsCsv(text: string, province: string): ParsedUnitBatch {
  const parsedRows = parseCsv(text);

  if (parsedRows.length === 0) {
    return {
      rows: [],
      errors: ["O arquivo CSV está vazio."],
      totalRows: 0,
    };
  }

  const headerRow = parsedRows[0];
  const dataRows = parsedRows.slice(1);
  const headerIndexMap = new Map(
    headerRow.map((header, index) => [normalizeHeader(header), index]),
  );

  const missingHeaders = REQUIRED_IMPORT_HEADERS.filter((header) => {
    return getResolvedHeaderIndex(headerIndexMap, header) === undefined;
  });

  if (missingHeaders.length > 0) {
    return {
      rows: [],
      errors: [
        `Cabeçalhos obrigatórios ausentes: ${missingHeaders.join(", ")}.`,
      ],
      totalRows: dataRows.length,
    };
  }

  const rows: UnitInsert[] = [];
  const errors: string[] = [];

  dataRows.forEach((row, rowIndex) => {
    const lineNumber = rowIndex + 2;
    const candidateProvince = getCellValue(
      row,
      getResolvedHeaderIndex(headerIndexMap, "province"),
    );

    if (candidateProvince && candidateProvince !== province) {
      errors.push(
        `Linha ${lineNumber}: a província "${candidateProvince}" não corresponde à província selecionada.`,
      );
      return;
    }

    const candidate = {
      name: getCellValue(row, getResolvedHeaderIndex(headerIndexMap, "name")),
      type: getCellValue(row, getResolvedHeaderIndex(headerIndexMap, "type")),
      status:
        getCellValue(row, getResolvedHeaderIndex(headerIndexMap, "status")) ||
        "Ativo",
      province,
      address: getCellValue(
        row,
        getResolvedHeaderIndex(headerIndexMap, "address"),
      ),
      city: getCellValue(row, getResolvedHeaderIndex(headerIndexMap, "city")),
      state: getCellValue(row, getResolvedHeaderIndex(headerIndexMap, "state")),
      country: getCellValue(
        row,
        getResolvedHeaderIndex(headerIndexMap, "country"),
      ),
      zip_code: getCellValue(
        row,
        getResolvedHeaderIndex(headerIndexMap, "zip_code"),
      ),
      email: getCellValue(row, getResolvedHeaderIndex(headerIndexMap, "email")),
      phone: getCellValue(row, getResolvedHeaderIndex(headerIndexMap, "phone")),
      website: getCellValue(
        row,
        getResolvedHeaderIndex(headerIndexMap, "website"),
      ),
      latitude: getCellValue(
        row,
        getResolvedHeaderIndex(headerIndexMap, "latitude"),
      ),
      longitude: getCellValue(
        row,
        getResolvedHeaderIndex(headerIndexMap, "longitude"),
      ),
      description: getCellValue(
        row,
        getResolvedHeaderIndex(headerIndexMap, "description"),
      ),
      image_url: getCellValue(
        row,
        getResolvedHeaderIndex(headerIndexMap, "image_url"),
      ),
    };

    const validationResult = unitSchema.safeParse(candidate);

    if (!validationResult.success) {
      const message = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");

      errors.push(`Linha ${lineNumber}: ${message}`);
      return;
    }

    rows.push(validationResult.data);
  });

  return {
    rows,
    errors,
    totalRows: dataRows.length,
  };
}
