import { Injectable } from '@angular/core';
import { ExerciseProgressEntry, ExerciseType } from './exercise.model';

@Injectable({ providedIn: 'root' })
export class ExerciseProgressDomainService {
  chartItems(items: ExerciseProgressEntry[]): ExerciseProgressEntry[] {
    // Reduce el historial a las referencias mas recientes para la grafica.
    if (items.length === 0) {
      return [];
    }

    return [...items].slice(0, 3).reverse();
  }

  chartPath(items: ExerciseProgressEntry[], type: ExerciseType | undefined): string {
    // Dibuja una linea simple cuando hay pocos datos o puntos reales.
    if (items.length < 2) {
      return 'M 20 80 L 280 80';
    }

    const points = items.map((entry, index) => {
      const x = 20 + (index * 260) / (items.length - 1);
      const y = this.chartYValue(entry, items, type);
      return `${x.toFixed(1)} ${y.toFixed(1)}`;
    });

    return `M ${points.join(' L ')}`;
  }

  chartAreaPath(path: string): string {
    // Cierra el area bajo la linea de tendencia.
    return `${path} L 280 100 L 20 100 Z`;
  }

  chartPointX(index: number, total: number): number {
    // Distribuye puntos equidistantes en el eje X.
    if (total <= 1) {
      return 150;
    }

    return 20 + (index * 260) / (total - 1);
  }

  chartPointY(entry: ExerciseProgressEntry, items: ExerciseProgressEntry[], type: ExerciseType | undefined): number {
    // Reutiliza la misma escala que la linea principal.
    return this.chartYValue(entry, items, type);
  }

  trendLabel(items: ExerciseProgressEntry[], index: number, formatNumber: (value: number, maxFractionDigits?: number) => string, formatDuration: (seconds: number) => string): string {
    // Compara la referencia actual con la anterior para mostrar progreso.
    const current = items[index];
    const previous = items[index + 1];

    if (!current || !previous) {
      return 'Primera referencia';
    }

    if (current.topSetWeightKg !== null && previous.topSetWeightKg !== null) {
      const weightDiff = current.topSetWeightKg - previous.topSetWeightKg;

      if (weightDiff > 0) {
        return `+${formatNumber(weightDiff, 1)} kg`;
      }

      if (weightDiff < 0) {
        return `${formatNumber(weightDiff, 1)} kg`;
      }

      if (current.topSetReps !== null && previous.topSetReps !== null) {
        const repsDiff = current.topSetReps - previous.topSetReps;
        if (repsDiff > 0) {
          return `+${repsDiff} reps`;
        }

        if (repsDiff < 0) {
          return `${repsDiff} reps`;
        }
      }

      return '=';
    }

    if (current.durationSeconds > 0 && previous.durationSeconds > 0) {
      const durationDiff = current.durationSeconds - previous.durationSeconds;

      if (durationDiff > 0) {
        return `+${formatDuration(durationDiff)}`;
      }

      if (durationDiff < 0) {
        return `-${formatDuration(Math.abs(durationDiff))}`;
      }

      return '=';
    }

    return 'Sin comparación';
  }

  private chartYValue(entry: ExerciseProgressEntry, items: ExerciseProgressEntry[], type: ExerciseType | undefined): number {
    // Normaliza el valor para el alto del SVG.
    if (items.length === 0) {
      return 80;
    }

    const value = this.chartNumericValue(entry, type);
    const values = items.map((item) => this.chartNumericValue(item, type));
    const min = Math.min(...values);
    const max = Math.max(...values);

    if (max <= min) {
      return 55;
    }

    const normalized = (value - min) / (max - min);
    return 80 - normalized * 65;
  }

  private chartNumericValue(entry: ExerciseProgressEntry, type: ExerciseType | undefined): number {
    // Selecciona la magnitud relevante segun el tipo de ejercicio.
    if (type === 'strength') {
      return entry.topSetWeightKg ?? 0;
    }

    if (type === 'cardio' || type === 'core') {
      return entry.durationSeconds > 0 ? entry.durationSeconds : 0;
    }

    if (entry.topSetWeightKg !== null) {
      return entry.topSetWeightKg;
    }

    return entry.durationSeconds > 0 ? entry.durationSeconds : entry.setsCount;
  }
}
