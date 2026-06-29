# DESIGN.md

## Direccion Visual

Gym Tracker usa una estetica **limpia, moderna, productiva y motivadora**, orientada a una PWA movil para registrar entrenamientos con rapidez.

La sensacion debe estar entrea:

```txt
fitness personal
dashboard productivo
app moderna de habitos
registro claro de progreso
PWA tactil offline-ready
```

El estilo actual ya no es pastel calido tipo libreta. La direccion visual real combina superficies claras azuladas, acentos turquesa, azul funcional y un modo oscuro sobrio en slate.

Evitar una estetica agresiva de gimnasio con negro puro, rojo intenso y neon saturado. El modo oscuro puede ser profundo, pero debe seguir siendo legible, tranquilo y premium.

---

## Sistema De Color

Los colores se definen como tokens Tailwind en `frontend/src/styles.css` dentro de `@theme` y se sobreescriben con `html.dark` para modo oscuro.

### Modo Claro

```txt
Background:                 #faf8ff
Surface:                    #faf8ff
Surface bright:             #faf8ff
Surface dim:                #d2d9f4
Surface container lowest:   #ffffff
Surface container low:      #f2f3ff
Surface container:          #eaedff
Surface container high:     #e2e7ff
Surface container highest:  #dae2fd
Surface variant:            #dae2fd

On background:              #131b2e
On surface:                 #131b2e
On surface variant:         #3c4a46
Outline:                    #6b7a76
Outline variant:            #bacac5
```

### Accion Principal

```txt
Primary:                    #006b5f
Primary container:          #2dd4bf
On primary:                 #ffffff
On primary container:       #00574d
Inverse primary:            #3cddc7
Primary fixed:              #62fae3
Primary fixed dim:          #3cddc7
```

Uso:

- CTAs principales
- Estados activos
- Indicadores de progreso
- Iconos positivos
- Acciones de guardado o confirmacion no destructiva

### Accion Secundaria

```txt
Secondary:                  #0058be
Secondary container:        #2170e4
On secondary:               #ffffff
On secondary container:     #fefcff
Secondary fixed:            #d8e2ff
Secondary fixed dim:        #adc6ff
```

Uso:

- Cardio
- Datos informativos
- Graficas
- Estados neutros importantes
- Navegacion secundaria

### Acento Terciario

```txt
Tertiary:                   #944a00
Tertiary container:         #ffab6d
On tertiary:                #ffffff
On tertiary container:      #7a3c00
Tertiary fixed:             #ffdcc5
Tertiary fixed dim:         #ffb783
```

Uso:

- Avisos suaves
- Detalles de esfuerzo
- Elementos destacados no primarios

### Error Y Acciones Destructivas

```txt
Error:                      #ba1a1a
Error container:            #ffdad6
On error:                   #ffffff
On error container:         #93000a
```

Uso:

- Eliminar
- Fallos de sincronizacion
- Alertas destructivas

---

## Modo Oscuro

El modo oscuro se activa con `html.dark`. No debe invertir simplemente el modo claro: usa una base slate profunda con acentos turquesa y azul.

```txt
Background:                 #0f172a
Surface:                    #111827
Surface bright:             #1f2937
Surface dim:                #0b1220
Surface container lowest:   #111827
Surface container low:      #1f2937
Surface container:          #243244
Surface container high:     #2b3b50
Surface container highest:  #334155
Surface variant:            #334155

On background:              #e5e7eb
On surface:                 #f3f4f6
On surface variant:         #cbd5e1
Outline:                    #94a3b8
Outline variant:            #475569

Primary:                    #5eead4
Primary container:          #134e4a
On primary:                 #e6fffb
On primary container:       #ccfbf1
Inverse primary:            #14b8a6

Secondary:                  #93c5fd
Secondary container:        #1e3a8a
On secondary:               #0f172a
On secondary container:     #dbeafe

Error:                      #fca5a5
Error container:            #7f1d1d
On error:                   #450a0a
On error container:         #fee2e2
```

Reglas:

- Evitar overlays claros en dark mode.
- Para modales usar fondo oscuro: `bg-slate-950/45 dark:bg-black/75`.
- Las superficies deben conservar separacion por contraste, borde y sombra, no por blanco puro.
- El texto principal debe mantenerse cerca de `#f3f4f6` y el secundario cerca de `#cbd5e1`.

---

## Tipografia

Las fuentes reales se cargan desde Google Fonts en `frontend/src/index.html`.

### Familias

```txt
Body:       Hanken Grotesk, sans-serif
Labels:     Hanken Grotesk, sans-serif
Headlines:  Plus Jakarta Sans, sans-serif
```

No usar Inter como base por defecto; el proyecto ya usa Hanken Grotesk y Plus Jakarta Sans.

### Escala Tipografica

```txt
body-md:                 16px / 24px / 400
body-lg:                 18px / 28px / 400
label-sm:                12px / 16px / 700
label-md:                14px / 20px / 600 / letter-spacing 0.02em
headline-md:             24px / 32px / 600
headline-lg-mobile:      28px / 36px / 700
headline-lg:             32px / 40px / 700 / letter-spacing -0.01em
headline-xl:             48px / 56px / 800 / letter-spacing -0.02em
```

Uso:

- `headline-xl`: pantallas principales o metricas hero.
- `headline-lg` y `headline-lg-mobile`: titulos grandes responsivos.
- `headline-md`: titulos de seccion, cards y modales.
- `label-md` y `label-sm`: filtros, chips, metadatos, badges.
- `body-md` y `body-lg`: contenido y descripciones.

---

## Espaciado

Tokens reales:

```txt
base:             8px
xs:               4px
sm:               12px
md:               24px
lg:               48px
xl:               80px
gutter:           24px
margin-mobile:    16px
margin-desktop:   64px
```

Reglas:

- Pantallas moviles: `px-margin-mobile`.
- Pantallas desktop: `md:px-margin-desktop` cuando aplique.
- Cards: `p-md` como valor base.
- Separacion entre bloques: `gap-sm` o `gap-md`.
- Separacion entre secciones: `md`, `lg` o `xl` segun jerarquia.

---

## Bordes Y Radios

Tokens:

```txt
radius-lg:  0.5rem
radius-xl:  0.75rem
```

Uso real recomendado:

```txt
Controles pequenos:     rounded-lg / rounded-xl
Cards medianas:         rounded-2xl
Cards principales:      rounded-[24px]
Modales:                rounded-[28px]
Botones y chips:        rounded-full
```

Las tarjetas principales deben sentirse tactiles y suaves. Evitar esquinas duras.

---

## Sombras Y Elevacion

Sombras frecuentes:

```txt
Card sutil:       0 8px 24px rgba(0, 0, 0, 0.04)
Panel:            shadow-sm
Modal:            0 24px 80px rgba(19, 27, 46, 0.28)
Toast:            0 18px 60px rgba(19, 27, 46, 0.22)
Splash card:      0 28px 96px rgba(2, 6, 23, 0.42)
```

Reglas:

- Mantener sombras suaves y difusas.
- En modo oscuro, priorizar bordes y contraste de superficies antes que sombras muy visibles.
- Evitar sombras duras o con offset exagerado.

---

## Componentes

### Boton Primario

Uso:

- Nuevo entrenamiento
- Guardar
- Finalizar sesion
- Anadir ejercicio
- Confirmar acciones no destructivas

Estilo:

```txt
Fondo: primary-container o primary
Texto: on-primary-container u on-primary
Radio: rounded-full o rounded-[24px]
Altura tactil: 44px - 56px
Peso: label-md / headline-md segun jerarquia
Estado activo: active:scale-95 o active:scale-[0.98]
```

### Boton Secundario

Uso:

- Cancelar
- Ver historial
- Editar
- Acciones auxiliares

Estilo:

```txt
Fondo: surface-container
Texto: on-surface-variant
Hover: surface-container-high
Radio: rounded-full o rounded-xl
Borde opcional: outline-variant
```

### Boton Destructivo

Uso:

- Eliminar ejercicio
- Descartar datos

Estilo:

```txt
Fondo: error o error-container
Texto: on-error u on-error-container
Icono: delete
Modal requerido para confirmar
```

### Tarjetas

Uso:

- Resumen de sesion
- Ejercicios
- Ultimos entrenamientos
- Calendario
- Graficas

Estilo:

```txt
Fondo: surface-container-lowest o surface-container-low
Borde: surface-variant / outline-variant / white/50 en claro cuando aplique
Radio: rounded-[24px]
Padding: p-md
Sombra: sutil
```

### Chips

Uso:

- Tipo de ejercicio
- Filtros
- Estado de sincronizacion
- Sensacion

Estilo:

```txt
Radio: rounded-full
Padding: px-3 py-1
Fuente: label-sm o label-md
Fondo: primary/15, secondary/15, surface-container-high
Texto: primary, secondary, on-surface-variant
```

### Modales

Overlay:

```txt
bg-slate-950/45
dark:bg-black/75
backdrop-blur-[2px]
z-[80]
```

Panel:

```txt
bg-surface-container-lowest
text-on-surface
border border-outline-variant
rounded-[28px]
shadow-[0_24px_80px_rgba(19,27,46,0.28)]
p-md md:p-lg
max-width: 448px - 480px
```

Reglas:

- Los dialogos de confirmacion deben estar centrados tambien en movil.
- Usar `max-h-[calc(100dvh-32px)]` y `overflow-y-auto` para evitar cortes.
- No usar overlays basados en `on-surface` porque se aclaran demasiado en modo oscuro.

### Toasts

Estilo:

```txt
Position: fixed bottom
Fondo: on-surface
Texto: inverse-on-surface
Radio: rounded-2xl
Sombra: 0 18px 60px rgba(19, 27, 46, 0.22)
Animacion: animate-toast-enter
```

---

## Splash PWA

La splash inicial vive como fallback dentro de `app-root` en `frontend/src/index.html` y se estiliza en `frontend/src/styles.css`.

Estilo:

```txt
Fondo: radial-gradient turquesa + linear-gradient slate/teal
Base: #0f172a -> #111827 -> #042f2e
Logo: icon-maskable-512x512.png
Card: glass oscuro con blur
Radio card: 28px
Loader: barra turquesa/azul
```

Animaciones:

```txt
boot-card-enter: 420ms cubic-bezier(0.22, 1, 0.36, 1)
boot-halo:       1600ms cubic-bezier(0.22, 1, 0.36, 1) infinite alternate
boot-loader:     900ms cubic-bezier(0.65, 0, 0.35, 1) infinite
```

El `manifest.webmanifest` debe mantener `background_color: #0f172a` para alinear la splash nativa con la splash visual de la app.

---

## Movimiento

Animaciones utilitarias reales:

```txt
animate-page-enter: 260ms cubic-bezier(0.22, 1, 0.36, 1)
animate-list-enter: 320ms cubic-bezier(0.22, 1, 0.36, 1)
animate-toast-enter: 260ms cubic-bezier(0.22, 1, 0.36, 1)
animate-dock-enter: 420ms cubic-bezier(0.22, 1, 0.36, 1)
animate-spin-soft: 800ms linear infinite
```

Reglas:

- Las animaciones deben ser cortas y tactiles.
- Evitar animaciones decorativas excesivas durante uso de gimnasio.
- Respetar `prefers-reduced-motion: reduce`; las animaciones principales deben desactivarse.
- `page-enter` debe terminar con `transform: none` para no romper overlays `position: fixed`.

---

## Iconografia

El proyecto usa Material Symbols Outlined.

Configuracion base:

```txt
font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24
```

Iconos rellenos:

```txt
.filled-icon
font-variation-settings: "FILL" 1, "wght" 400, "GRAD" 0, "opsz" 24
```

Reglas:

- Usar iconos como apoyo, no como unica senal.
- Incluir `aria-hidden="true"` cuando el texto ya explique la accion.
- Botones icon-only deben tener `aria-label`.

---

## Navegacion Y Layout

La app prioriza uso movil.

Reglas:

- Headers sticky o fixed con `z-40`.
- Acciones principales visibles y tactiles.
- Contenido con ancho maximo en desktop, normalmente `max-w-3xl`.
- Margenes laterales moviles de 16px y desktop de 64px.
- Usar `pb-safe` cuando haya elementos cerca del borde inferior.

---

## UX Importante

La app se usa en el gimnasio, por lo que debe ser:

- Rapida
- Legible
- Mobile-first
- Offline-friendly
- Con botones grandes
- Con pocos campos por pantalla
- Facil de usar con una mano
- Clara en estados de sincronizacion

---

## No Hacer

Evitar:

- Volver a la paleta antigua pastel salvia/melocoton si no se actualizan los tokens.
- Usar Inter como fuente base.
- Overlays claros en modo oscuro.
- Fondos oscuros agresivos con neon saturado.
- Animaciones largas o constantes.
- Formularios largos sin agrupacion.
- Graficas demasiado tecnicas.
- Menus ocultos dificiles de encontrar.
- Aplicar `transform` permanente en contenedores que puedan contener modales fixed.

---

## Referencia Emocional

La app debe sentirse como:

> Un panel de entrenamiento moderno y tactil, claro durante el dia y sobrio por la noche, pensado para registrar progreso sin friccion.
