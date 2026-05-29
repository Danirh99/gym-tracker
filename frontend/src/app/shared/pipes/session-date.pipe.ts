import { Pipe, PipeTransform } from '@angular/core';
import { formatSessionDateEs } from '../../core/utils/format.utils';

@Pipe({
  name: 'sessionDate',
  standalone: true,
})
/** Pipe fino para mostrar fechas ISO de sesiones en texto legible. */
export class SessionDatePipe implements PipeTransform {
  transform(value: string): string {
    // Reutiliza el helper comun de fecha para no duplicar logica.
    return formatSessionDateEs(value);
  }
}
