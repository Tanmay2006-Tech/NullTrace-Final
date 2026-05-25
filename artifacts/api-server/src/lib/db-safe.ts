import { pool } from "@workspace/db";
import { logger } from "./logger";

type DbRow = Record<string, unknown>;

const tableColumnsCache = new Map<string, Set<string>>();
const IDENTIFIER = /^[a-z_][a-z0-9_]*$/i;

function assertSafeIdentifier(identifier: string): void {
  if (!IDENTIFIER.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }
}

export async function getTableColumns(tableName: string): Promise<Set<string>> {
  const cached = tableColumnsCache.get(tableName);
  if (cached) {
    return cached;
  }

  const result = await pool.query(
    `select column_name
       from information_schema.columns
      where table_schema = current_schema()
        and table_name = $1`,
    [tableName],
  );

  const columns = new Set<string>(
    result.rows.map((r) => String(r.column_name)),
  );

  tableColumnsCache.set(tableName, columns);
  logger.info({ tableName, columns: [...columns] }, "Loaded table columns");
  return columns;
}

export async function hasTable(tableName: string): Promise<boolean> {
  const result = await pool.query(
    `select 1
       from information_schema.tables
      where table_schema = current_schema()
        and table_name = $1
      limit 1`,
    [tableName],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function selectAllFromTable(
  tableName: string,
  orderBy?: string,
): Promise<DbRow[]> {
  assertSafeIdentifier(tableName);
  if (orderBy) {
    assertSafeIdentifier(orderBy);
  }

  const sql = orderBy
    ? `select * from "${tableName}" order by "${orderBy}" desc`
    : `select * from "${tableName}"`;
  const result = await pool.query(sql);
  return result.rows as DbRow[];
}

export function getFirstValue(
  row: DbRow,
  keys: string[],
): unknown {
  for (const key of keys) {
    if (row[key] !== undefined) {
      return row[key];
    }
  }
  return undefined;
}

export function toStringOrNull(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return null;
}

export function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function toBooleanOrDefault(
  value: unknown,
  fallback: boolean,
): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return fallback;
}

export function toIsoDateOrNull(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return null;
}

export function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v)).filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v)).filter(Boolean);
      }
    } catch {
      return trimmed ? [trimmed] : [];
    }
  }

  return [];
}
