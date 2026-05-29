export function parseOptionalNumber(value: string): number | null {
  // Limpia entradas libres y acepta decimales con coma o punto.
  const normalized = value.replace(',', '.').trim();
  if (normalized === '') {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function parseOptionalInt(value: string): number | null {
  // Convierte texto a entero positivo opcional.
  const normalized = value.trim();
  if (normalized === '') {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}
