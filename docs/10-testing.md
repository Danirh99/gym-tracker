# Testing

## Objetivo

Definir una estrategia minima y util para no romper el flujo principal del producto.

---

## Piramide recomendada

1. **Unit tests** para helpers, stores y servicios puros.
2. **Component tests** para pantallas y componentes compartidos.
3. **Integration tests** para flujos de sesion y ejercicios.

---

## Que merece test

### `core/utils`

- `date.utils.ts`
- `format.utils.ts`
- `number.utils.ts`
- `string.utils.ts`

Casos clave:

- fechas limpios de zona horaria,
- formateos con `null`,
- parseos con coma/punto,
- normalizacion de texto con tildes.

### Stores

- `exercise-form.store.ts`
- `strength-entry-form.store.ts`
- `typed-entry-form.store.ts`
- `session-detail.store.ts`

Casos clave:

- agregar y eliminar series,
- validaciones de `canSave`,
- seleccion de ejercicio,
- estados de carga y error.

### Services y facades

- `exercise.service.ts`
- `session.service.ts`
- `charts-analytics.service.ts`
- `workout-sessions.facade.ts`
- `exercises.facade.ts`

Casos clave:

- transformacion de datos,
- agrupaciones por dia,
- calculos de volumen, reps y duracion,
- filtrado por periodo.

---

## Flujos criticos a cubrir

1. Crear ejercicio.
2. Editar ejercicio.
3. Crear sesion.
4. Añadir entrada de fuerza.
5. Añadir entrada cardio/core/other.
6. Borrar entrada de sesion con confirmacion.
7. Navegar por calendario.
8. Cambiar periodos en graficas.

---

## Comandos utiles

```bash
cd frontend
npm test
npm run build
```

---

## Criterio de calidad

Si un cambio toca reglas de negocio o formateo compartido, debe dejar al menos un test que explique el comportamiento nuevo.
