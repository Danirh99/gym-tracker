# Componentes compartidos

## Objetivo

Documentar las piezas reutilizables que aparecen en varias pantallas.

---

## `ConfirmDialogComponent`

Archivo: `frontend/src/app/shared/confirm-dialog.component.ts`

### Uso

Dialogo para confirmar acciones destructivas como borrar ejercicios o entradas.

### Inputs

- `title`: titulo principal.
- `message`: texto explicativo.
- `confirmLabel`: etiqueta del boton primario.
- `cancelLabel`: etiqueta del boton secundario.
- `tone`: variante visual.
- `isPending`: bloquea interacciones durante una peticion.

### Outputs

- `confirmed`: el usuario acepta la accion.
- `closed`: el usuario cancela o cierra con Escape.

### Regla

No debe contener logica de dominio. Solo emite eventos.

---

## `UiToastStore`

Archivo: `frontend/src/app/shared/ui-feedback/ui-toast.store.ts`

### Uso

Muestra mensajes temporales de exito o error.

### Comportamiento

- guarda un mensaje y un tono,
- reemplaza toasts previos,
- limpia el mensaje tras un tiempo configurable.

### Donde se usa

- `session-detail-page.ts`
- `add-session-exercise-page.ts`
- `add-session-exercise-by-type-page.ts`

---

## Pipes compartidos

Archivo base: `frontend/src/app/shared/pipes/`

### `duration`

Convierte segundos en una etiqueta legible.

### `numberEs`

Formatea numeros con convencion espanola.

### `sessionDate`

Convierte una fecha ISO de sesion en texto legible.

### Regla

Los pipes no deben contener reglas nuevas si el helper ya existe en `core/utils`.

---

## Recomendaciones

1. Si una pieza se usa en 2 o mas pantallas, documentarla aqui.
2. Si tiene eventos o estados delicados, listar sus invariantes.
3. Si solo traduce datos, preferir helper + pipe fino.
