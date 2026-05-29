import { Pipe, PipeTransform } from '@angular/core';
import { formatNumberEs } from '../../core/utils/format.utils';

@Pipe({
  name: 'numberEs',
  standalone: true,
})
/** Pipe fino para formatear numeros con convencion espanola. */
export class NumberEsPipe implements PipeTransform {
  transform(value: number, maxFractionDigits = 0): string {
    // Centraliza el formateo numerico usado por graficas y tablas.
    return formatNumberEs(value, maxFractionDigits);
  }
}
