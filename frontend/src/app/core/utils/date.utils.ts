export function toIsoDate(date: Date): string {
  // Normaliza a UTC para evitar desplazamientos de zona horaria.
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString().slice(0, 10);
}

export function startOfWeekMonday(date: Date): Date {
  // Calcula el lunes de la semana actual.
  const day = date.getDay();
  const offset = (day + 6) % 7;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - offset);
}

export function addDays(date: Date, days: number): Date {
  // Desplaza una fecha por N dias usando calendario local.
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function todayIsoDate(): string {
  // Devuelve la fecha de hoy en formato ISO corto.
  return toIsoDate(new Date());
}
