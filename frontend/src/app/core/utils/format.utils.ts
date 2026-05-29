export function formatNumberEs(value: number, maxFractionDigits = 0): string {
  // Formatea numeros con convencion española.
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: maxFractionDigits }).format(value);
}

export function formatDurationFromSeconds(seconds: number): string {
  // Convierte segundos en una etiqueta legible.
  if (seconds <= 0) {
    return '0 min';
  }

  const minutes = Math.round(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes === 0 ? `${hours} h` : `${hours} h ${remainingMinutes} min`;
}

export function formatSessionDateEs(value: string): string {
  // Convierte una fecha ISO a texto largo en español.
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatSessionDateShortWithToday(value: string): string {
  // Resalta el dia actual y deja el resto en formato corto.
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  const formatted = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(date);

  return date.toDateString() === today.toDateString() ? `Hoy · ${formatted}` : formatted;
}

export function formatDistanceKmEsFromMeters(meters: number | null): string {
  // Normaliza metros a kilometros o muestra placeholder.
  if (meters === null) {
    return '-';
  }

  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(meters / 1000);
}

export function formatOptionalNumberEs(value: number | null): string {
  // Formatea valores opcionales sin forzar ceros artificiales.
  if (value === null) {
    return '-';
  }

  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(value);
}
