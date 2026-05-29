# DESIGN.md

## Dirección visual

La aplicación debe tener una estética **limpia, moderna y motivadora**, con colores pastel pero sin parecer infantil ni demasiado kawaii.

La sensación debe estar entre:

```txt
fitness personal
dashboard productivo
app moderna de hábitos
registro sencillo de progreso
```

No debe parecer una app médica ni una app de gimnasio agresiva con negro, rojo y neón.

---

## Paleta de colores

### Color principal

```txt
Verde salvia
#A8CBB7
```

Uso:

- Botones principales
- Acciones positivas
- Indicadores de progreso
- Elementos activos

---

### Color secundario

```txt
Azul niebla
#AFCBE3
```

Uso:

- Tarjetas informativas
- Gráficas
- Estados neutros
- Elementos de calendario

---

### Color de acento

```txt
Melocotón suave
#F4BFA8
```

Uso:

- Avisos suaves
- Destacar logros
- Indicadores de esfuerzo
- Pequeños detalles visuales

---

### Fondo principal

```txt
Blanco cálido
#FAF8F4
```

Uso:

- Fondo general de la app
- Pantallas principales

---

### Superficie / tarjetas

```txt
Blanco roto
#FFFFFF
```

Uso:

- Cards
- Formularios
- Paneles
- Resúmenes

---

### Texto principal

```txt
Gris carbón
#2E2E2E
```

Uso:

- Títulos
- Texto importante
- Valores numéricos

---

### Texto secundario

```txt
Gris suave
#7A7A7A
```

Uso:

- Descripciones
- Labels
- Fechas
- Notas auxiliares

---

## Estilo general

### Bordes

Usar bordes redondeados amplios:

```txt
border-radius: 16px - 24px
```

Las tarjetas deben sentirse suaves y modernas.

---

### Sombras

Sombras muy sutiles:

```txt
0 8px 24px rgba(0, 0, 0, 0.06)
```

Evitar sombras duras.

---

### Espaciado

El diseño debe respirar.

```txt
Padding en cards: 16px - 24px
Separación entre bloques: 16px
Separación entre secciones: 24px - 32px
```

---

## Tipografía

Se recomienda una fuente sans-serif moderna.

Opciones:

```txt
Inter
Manrope
Nunito Sans
System UI
```

Recomendación inicial:

```txt
font-family: Inter, system-ui, sans-serif;
```

---

## Jerarquía visual

### Títulos de pantalla

```txt
24px - 28px
font-weight: 700
```

### Subtítulos

```txt
18px - 20px
font-weight: 600
```

### Texto normal

```txt
15px - 16px
font-weight: 400
```

### Labels y metadatos

```txt
13px - 14px
font-weight: 500
```

### Valores destacados

```txt
28px - 36px
font-weight: 700
```

---

## Componentes principales

### Botón primario

Uso:

- Nuevo entrenamiento
- Guardar
- Finalizar sesión
- Añadir ejercicio

Estilo:

```txt
Fondo: #A8CBB7
Texto: #1F3328
Borde: ninguno
Radio: 16px
Altura: 44px - 52px
Peso: 600
```

---

### Botón secundario

Uso:

- Cancelar
- Ver historial
- Editar

Estilo:

```txt
Fondo: #EEF4F0
Texto: #2E2E2E
Borde: 1px solid #DDE8E1
Radio: 16px
```

---

### Tarjetas

Uso:

- Resumen semanal
- Últimos entrenamientos
- Ejercicios
- Sesiones del calendario

Estilo:

```txt
Fondo: #FFFFFF
Borde: 1px solid #EFECE6
Radio: 24px
Sombra: sutil
Padding: 20px
```

---

### Chips

Uso:

- Tipo de ejercicio
- Músculos
- Sensación
- Filtros

Ejemplos:

```txt
Fuerza
Cardio
Pecho
Pierna
Buena sesión
```

Estilo:

```txt
Fondo pastel suave
Texto oscuro
Radio: 999px
Padding horizontal: 10px - 14px
```

---

## Navegación

Para móvil, se recomienda navegación inferior.

Elementos:

```txt
Inicio
Ejercicios
Calendario
Gráficas
```

El botón de **Nuevo entrenamiento** debe estar muy visible, idealmente como CTA en Dashboard.

---

## Tono visual de las gráficas

Las gráficas deben ser simples:

- Líneas suaves
- Barras redondeadas
- Colores pastel
- Pocos datos por vista
- Sin saturar la pantalla

Priorizar claridad sobre complejidad.

---

## UX importante

La app se usará en el gimnasio, por lo que debe ser:

- Rápida
- Legible
- Con botones grandes
- Pocos campos por pantalla
- Buena experiencia móvil
- Formularios fáciles de rellenar con una mano

---

## No hacer

Evitar:

- Estética demasiado infantil
- Colores neón
- Fondos oscuros agresivos
- Demasiadas animaciones
- Formularios largos
- Gráficas demasiado técnicas
- Menús ocultos difíciles de encontrar

---

## Referencia emocional

La app debe sentirse como:

> Una libreta de entrenamiento moderna, limpia y visual, pensada para progresar sin obsesionarse.
