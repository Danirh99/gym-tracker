export function normalizeSearchText(value: string): string {
  // Quita tildes, normaliza mayusculas y espacios para buscar mejor.
  return value
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function normalizeOptionalString(value: string): string | null {
  // Convierte cadenas vacias en null para persistencia limpia.
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
