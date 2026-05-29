import { Pipe, PipeTransform } from '@angular/core';
import { formatDurationFromSeconds } from '../../core/utils/format.utils';

@Pipe({
  name: 'duration',
  standalone: true,
})
/** Pipe fino para convertir segundos en una etiqueta legible. */
export class DurationPipe implements PipeTransform {
  transform(value: number): string {
    // Delega el formato al helper compartido para mantener consistencia.
    return formatDurationFromSeconds(value);
  }
}
