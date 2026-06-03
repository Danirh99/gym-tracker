# Web de presentacion del proyecto

Documento de definicion para crear una web publica de presentacion de **Gym Tracker**.

La web no debe duplicar la aplicacion. Debe explicar el producto, mostrar sus pantallas clave, transmitir confianza tecnica y dejar claro que el proyecto es open source.

---

## Objetivo

Crear una landing/web de proyecto que responda rapidamente a estas preguntas:

1. Que es Gym Tracker.
2. Para quien esta pensado.
3. Que problemas resuelve en el gimnasio.
4. Que funcionalidades incluye.
5. Como se ve la app real.
6. Como protege y permite mover los datos mediante backups.
7. Como se puede instalar, probar o contribuir.

La web debe servir para:

- presentar el proyecto en GitHub, portfolio o despliegue publico,
- explicar el alcance funcional sin entrar en implementacion excesiva,
- mostrar que es una PWA moderna, instalable y preparada para offline,
- explicar que el historial puede exportarse e importarse sin borrado destructivo,
- destacar que es software libre bajo licencia MIT,
- facilitar contribuciones y revision del codigo.

---

## Mensaje principal

> Registra tus entrenamientos rapido, consulta tu historial facil y entiende tu progreso sin complicaciones.

Variantes utiles para copy:

- Entrena. Registra. Progresa.
- Tu diario de gimnasio, instalable como PWA y abierto para la comunidad.
- Un tracker open source para fuerza, cardio, abdomen y cualquier ejercicio libre.
- Sin redes sociales, sin ruido, sin friccion: solo entrenamiento y progreso.
- Exporta tu historial, restaura en modo merge y conserva tus entrenamientos.

---

## Posicionamiento

Gym Tracker es una aplicacion **open source** para registrar entrenamientos de gimnasio y analizar el progreso de forma simple.

Se apoya en:

- **Angular 21 + TypeScript** para el frontend.
- **Symfony 7.4 + PHP 8.2+** para el backend API.
- **PostgreSQL 16** como base de datos.
- **Docker Compose** para entorno local reproducible.
- **PWA + Service Worker** como base instalable y offline.
- **Licencia MIT** para uso, copia, modificacion y distribucion.

La propuesta del producto no es competir como red social fitness. Su foco es mas concreto:

- registrar rapido en medio de una sesion,
- adaptar los campos al tipo de ejercicio,
- consultar progreso por ejercicio,
- detectar constancia, volumen y sesiones recientes,
- exportar e importar ejercicios y entrenamientos completos,
- funcionar bien en movil,
- preparar una experiencia fiable incluso sin conexion.

---

## Audiencia

### Usuario final

Persona que entrena en gimnasio y quiere registrar:

- pesos,
- repeticiones,
- duracion,
- distancia,
- sensaciones,
- notas,
- progreso semanal,
- historial por ejercicio.
- backup portable de sus datos.

Necesita rapidez y claridad. No quiere perder tiempo configurando rutinas complejas.

### Perfil tecnico

Desarrollador o colaborador que quiere revisar, instalar o extender un proyecto real con:

- frontend Angular organizado por features,
- backend Symfony con API REST,
- documentacion funcional y tecnica,
- tests base,
- readiness open source,
- licencia MIT,
- guias de contribucion y seguridad.

---

## Personalidad visual recomendada

La web debe mantener relacion con la app, pero puede ser mas editorial y aspiracional.

Direccion recomendada: **precision deportiva con estetica tecnica**.

- Fondos oscuros o superficies neutras con acentos turquesa/azul.
- Tarjetas con datos reales: sesiones, volumen, racha, PR, cola offline.
- Paneles de confianza: backup JSON, merge seguro, sesiones duplicadas omitidas.
- Composicion con mockups de movil y paneles analiticos.
- Tipografia de titulares compacta y contundente.
- Lenguaje visual de progreso: lineas, barras, calendario, chips, estados.
- Nada de imagenes genericas de gimnasio si no aportan valor.

Principio: la interfaz real debe ser la protagonista.

---

## Sitemap de la web

```txt
/
├── Hero
├── Prueba social tecnica / open source
├── Problema
├── Funcionalidades principales
├── Flujo de entrenamiento
├── Pantallas de la app
├── Backups export/import
├── Analitica y progreso
├── PWA y modo offline
├── Arquitectura open source
├── Contribuir
└── CTA final
```

---

## Navegacion publica

```txt
┌────────────────────────────────────────────────────────────────────────────┐
│ Gym Tracker          Funciones   Pantallas   Backups   Offline   Open Source │
│                                                                  GitHub → │
└────────────────────────────────────────────────────────────────────────────┘
```

En movil:

```txt
┌────────────────────────────────────┐
│ Gym Tracker                    ☰   │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ Funciones                          │
│ Pantallas                          │
│ Backups                            │
│ Offline                            │
│ Open Source                        │
│ GitHub                             │
└────────────────────────────────────┘
```

---

# Wireframes ASCII de la web de presentacion

Los siguientes wireframes representan secciones de la web publica, no pantallas internas de la PWA.

---

## 1. Landing completa desktop

```txt
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Gym Tracker             Funciones  Flujo  Pantallas  Backups  Offline  Open Source  GitHub → │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│  ┌──────────────────────────────────────────────┐    ┌────────────────────────────────────┐  │
│  │ OPEN SOURCE · PWA · ANGULAR + SYMFONY        │    │  ┌──────────────────────────────┐  │  │
│  │                                              │    │  │ Gym Tracker                  │  │  │
│  │ Entrena. Registra. Progresa.                 │    │  │ Esta semana                  │  │  │
│  │                                              │    │  │ ┌────────┐ ┌───────────────┐ │  │  │
│  │ Un tracker de gimnasio instalable como PWA   │    │  │ │Sesiones│ │Volumen total │ │  │  │
│  │ para guardar sesiones, ejercicios, series,   │    │  │ │   4    │ │  12.450 kg   │ │  │  │
│  │ cardio, progreso y alertas sin ruido.        │    │  │ └────────┘ └───────────────┘ │  │  │
│  │                                              │    │  │ Últimos entrenamientos       │  │  │
│  │ [Ver en GitHub] [Explorar pantallas]         │    │  │ Pecho + cardio        Hoy > │  │  │
│  └──────────────────────────────────────────────┘    │  └──────────────────────────────┘  │  │
│                                                       └────────────────────────────────────┘  │
│                                                                                              │
│  MIT License     Angular 21     Symfony 7.4     PostgreSQL 16     Docker     PWA Offline     │
│                                                                                              │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  Problema                                                                                   │
│  ┌────────────────────────────┐ ┌────────────────────────────┐ ┌──────────────────────────┐ │
│  │ Apps demasiado complejas   │ │ Notas dispersas            │ │ Progreso poco visible    │ │
│  │ Rutinas, social, ruido     │ │ Papel, movil, memoria      │ │ Sin historico claro      │ │
│  └────────────────────────────┘ └────────────────────────────┘ └──────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  Funcionalidades reales                                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │ Sesiones     │ │ Ejercicios   │ │ Calendario   │ │ Graficas     │ │ Offline + sync   │ │
│  │ fecha/mood   │ │ 4 tipos      │ │ dias activos │ │ volumen/PR   │ │ cola operaciones │ │
│  │ Backups      │ │ JSON merge   │ │ portable     │ │ no destruct. │ │ resumen import.  │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  Flujo: crear sesion → añadir ejercicio → registrar series → consultar progreso              │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  Galeria de pantallas                                                                         │
│  [Dashboard] [Sesion] [Ejercicios] [Detalle ejercicio] [Calendario] [Backups] [Offline]      │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  Open source listo para colaborar                                                            │
│  MIT · CONTRIBUTING · CODE_OF_CONDUCT · SECURITY · Issues/PR templates · CI base             │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  ¿Quieres probarlo o contribuir?                                      [GitHub] [Documentacion]│
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Hero desktop

```txt
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Gym Tracker                 Funciones  Pantallas  Offline  Open Source             GitHub → │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│  ┌──────────────────────────────────────────────┐    ┌────────────────────────────────────┐  │
│  │ MIT LICENSE · OPEN SOURCE                    │    │              APP PREVIEW           │  │
│  │                                              │    │  ┌──────────────────────────────┐  │  │
│  │ Tu diario de gimnasio,                       │    │  │ Gym Tracker              ◐   │  │  │
│  │ rapido y sin complicaciones.                 │    │  ├──────────────────────────────┤  │  │
│  │                                              │    │  │ Esta semana                  │  │  │
│  │ Registra sesiones, series, cardio y progreso │    │  │ ┌──────┐ ┌──────┐            │  │  │
│  │ desde una PWA instalable, con una base       │    │  │ │  4   │ │ 3h20 │            │  │  │
│  │ preparada para uso offline.                  │    │  │ │ses.  │ │tiempo│            │  │  │
│  │                                              │    │  │ └──────┘ └──────┘            │  │  │
│  │ [Ver repositorio] [Ver funcionalidades]      │    │  │ ┌──────┐ ┌──────┐            │  │  │
│  │                                              │    │  │ │ 24   │ │12.4k │            │  │  │
│  │ Angular 21 · Symfony 7.4 · PostgreSQL        │    │  │ │ejerc.│ │ kg   │            │  │  │
│  └──────────────────────────────────────────────┘    │  └──────┘ └──────┘            │  │  │
│                                                       │  Nuevo entrenamiento          │  │  │
│                                                       └──────────────────────────────┘  │  │
│                                                       └────────────────────────────────────┘  │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

Version movil:

```txt
┌────────────────────────────────────┐
│ Gym Tracker                    ☰   │
├────────────────────────────────────┤
│ OPEN SOURCE · PWA                  │
│                                    │
│ Tu diario de gimnasio, rapido      │
│ y sin complicaciones.              │
│                                    │
│ Registra sesiones, series, cardio  │
│ y progreso desde una app instalable│
│ preparada para funcionar offline.  │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ Ver repositorio                │ │
│ └────────────────────────────────┘ │
│ ┌────────────────────────────────┐ │
│ │ Explorar pantallas             │ │
│ └────────────────────────────────┘ │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ Gym Tracker                    │ │
│ │ Esta semana                    │ │
│ │ 4 sesiones · 12.450 kg         │ │
│ │ Nuevo entrenamiento            │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

---

## 3. Banda open source

```txt
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Proyecto abierto, documentado y listo para revisar                                          │
│                                                                                              │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────────┐ │
│  │ MIT License      │ │ Contribuciones   │ │ Seguridad        │ │ CI base                │ │
│  │ uso y modificac. │ │ CONTRIBUTING.md  │ │ SECURITY.md      │ │ build + tests          │ │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘ └────────────────────────┘ │
│                                                                                              │
│  Repositorio con README, documentacion funcional, arquitectura frontend, testing y deploy.    │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

Copy sugerido:

> Gym Tracker esta publicado bajo licencia MIT. Puedes usarlo, estudiarlo, modificarlo y proponer mejoras. El repositorio incluye guia de contribucion, codigo de conducta, politica de seguridad, templates de issues/PR y CI base.

---

## 4. Problema y enfoque

```txt
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  El problema                                                                                 │
│  Registrar en el gimnasio suele fallar por exceso de friccion.                                │
│                                                                                              │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐  ┌──────────────────────┐ │
│  │ Demasiados pasos            │  │ Datos mezclados             │  │ Poco aprendizaje      │ │
│  │ Apps pensadas para todo     │  │ Fuerza, cardio y notas      │  │ El progreso queda     │ │
│  │ menos para registrar rapido │  │ no necesitan el mismo form  │  │ oculto entre registros│ │
│  └─────────────────────────────┘  └─────────────────────────────┘  └──────────────────────┘ │
│                                                                                              │
│  El enfoque                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Una PWA centrada en el entrenamiento real: abrir, registrar, guardar y consultar.      │  │
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Funcionalidades principales

```txt
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Todo lo necesario para seguir tu progreso                                                    │
│                                                                                              │
│  ┌──────────────────────────┐ ┌──────────────────────────┐ ┌─────────────────────────────┐  │
│  │ Sesiones                 │ │ Ejercicios               │ │ Registro por tipo           │  │
│  │ fecha, nombre, mood,     │ │ crear, editar, listar,   │ │ fuerza, cardio, abdomen,   │  │
│  │ notas y resumen          │ │ desactivar y consultar   │ │ otros campos flexibles     │  │
│  └──────────────────────────┘ └──────────────────────────┘ └─────────────────────────────┘  │
│                                                                                              │
│  ┌──────────────────────────┐ ┌──────────────────────────┐ ┌─────────────────────────────┐  │
│  │ Progreso por ejercicio   │ │ Calendario               │ │ Graficas                   │  │
│  │ mejor marca, historial,  │ │ dias entrenados, detalle │ │ sesiones, volumen, cardio, │  │
│  │ recomendacion siguiente  │ │ diario y resumen mensual │ │ tendencia y record         │  │
│  └──────────────────────────┘ └──────────────────────────┘ └─────────────────────────────┘  │
│                                                                                              │
│  ┌──────────────────────────┐ ┌──────────────────────────┐ ┌─────────────────────────────┐  │
│  │ Alertas                  │ │ PWA offline              │ │ Backups                   │  │
│  │ racha, desbalance,       │ │ cache, cola, sync,       │ │ export/import JSON,       │  │
│  │ ejercicios sin uso       │ │ reintento y descarte     │ │ merge sin borrado         │  │
│  └──────────────────────────┘ └──────────────────────────┘ └─────────────────────────────┘  │
│                                                                                              │
│  ┌──────────────────────────┐                                                                 │
│  │ Tema y navegacion movil  │                                                                 │
│  │ bottom nav, menu lateral,│                                                                 │
│  │ claro/oscuro             │                                                                 │
│  └──────────────────────────┘                                                                 │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Flujo de entrenamiento

```txt
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Un flujo pensado para usarlo entre series                                                    │
│                                                                                              │
│  ┌───────────────┐      ┌───────────────┐      ┌───────────────┐      ┌──────────────────┐  │
│  │ 1. Crear      │ ---> │ 2. Elegir     │ ---> │ 3. Registrar  │ ---> │ 4. Consultar     │  │
│  │ sesion        │      │ tipo/ejercicio│      │ series/datos  │      │ progreso         │  │
│  └───────────────┘      └───────────────┘      └───────────────┘      └──────────────────┘  │
│        │                       │                       │                       │             │
│        v                       v                       v                       v             │
│  Fecha, mood, notas     Fuerza/Cardio/Core      Kg, reps, tiempo,       Calendario, graficas,│
│  y nombre opcional      u otros                  distancia, notas        alertas e historial │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

Version vertical movil:

```txt
┌────────────────────────────────────┐
│ Flujo de entrenamiento             │
├────────────────────────────────────┤
│ 1  Crear sesion                    │
│    fecha · nombre · sensacion      │
│             │                      │
│             v                      │
│ 2  Añadir ejercicio                │
│    fuerza · cardio · abdomen       │
│             │                      │
│             v                      │
│ 3  Registrar datos                 │
│    kg · reps · tiempo · distancia  │
│             │                      │
│             v                      │
│ 4  Revisar progreso                │
│    historial · graficas · alertas  │
└────────────────────────────────────┘
```

---

## 7. Galeria de pantallas

La web debe usar capturas reales cuando existan. Mientras tanto, estos wireframes definen la composicion de la galeria.

```txt
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Pantallas reales de la PWA                                                                   │
│                                                                                              │
│  [Dashboard] [Sesion] [Ejercicios] [Progreso] [Calendario] [Backups] [Offline]               │
│                                                                                              │
│  ┌────────────────────────────┐  ┌────────────────────────────────────────────────────────┐  │
│  │ ┌────────────────────────┐ │  │ Dashboard                                             │  │
│  │ │ Gym Tracker            │ │  │                                                       │  │
│  │ │ Esta semana            │ │  │ Resumen semanal con sesiones, tiempo, ejercicios,     │  │
│  │ │ Sesiones 4             │ │  │ volumen, racha y promedio. Acceso rapido a los        │  │
│  │ │ Volumen 12.450 kg      │ │  │ ultimos entrenamientos y CTA de nueva sesion.         │  │
│  │ │ Ultimos entrenamientos │ │  │                                                       │  │
│  │ │ + Nuevo entrenamiento  │ │  │ Funcionalidades mostradas:                            │  │
│  │ └────────────────────────┘ │  │ - resumen semanal                                     │  │
│  └────────────────────────────┘  │ - listado reciente                                    │  │
│                                  │ - tema claro/oscuro                                   │  │
│                                  │ - navegacion inferior movil                           │  │
│                                  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Pantalla destacada: dashboard

```txt
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Dashboard semanal                                                                            │
│                                                                                              │
│  ┌──────────────────────────────┐   ┌─────────────────────────────────────────────────────┐  │
│  │ Gym Tracker              ◐   │   │ Lo que comunica esta pantalla                       │  │
│  ├──────────────────────────────┤   │                                                     │  │
│  │ Esta semana                  │   │ - La app abre directamente con informacion util.     │  │
│  │ ┌────────┐ ┌───────────────┐ │   │ - No obliga a navegar para saber como va la semana. │  │
│  │ │Sesiones│ │Tiempo         │ │   │ - Convierte el registro diario en indicadores.      │  │
│  │ │   4    │ │3h 20m         │ │   │ - El CTA principal es iniciar un entrenamiento.     │  │
│  │ └────────┘ └───────────────┘ │   │                                                     │  │
│  │ ┌────────┐ ┌───────────────┐ │   │ Datos visibles:                                     │  │
│  │ │Ejerc.  │ │Volumen total  │ │   │ sesiones · tiempo · ejercicios · volumen · racha    │  │
│  │ │  24    │ │12.450 kg      │ │   │ promedio por sesion · ultimos entrenamientos        │  │
│  │ └────────┘ └───────────────┘ │   └─────────────────────────────────────────────────────┘  │
│  │ Ultimos entrenamientos       │                                                            │
│  │ Pecho + cardio       Hoy  >  │                                                            │
│  │ Pierna              Ayer  >  │                                                            │
│  │ + Nuevo entrenamiento        │                                                            │
│  └──────────────────────────────┘                                                            │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Pantalla destacada: nueva sesion

```txt
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Crear una sesion sin friccion                                                                │
│                                                                                              │
│  ┌──────────────────────────────┐   ┌─────────────────────────────────────────────────────┐  │
│  │ ← Nuevo entrenamiento    ◐   │   │ Mensaje de marketing                                │  │
│  ├──────────────────────────────┤   │                                                     │  │
│  │ Datos de la sesion           │   │ Cada entrenamiento empieza con lo minimo necesario:  │  │
│  │ Fecha                        │   │ fecha, nombre opcional, sensacion y notas.          │  │
│  │ [ 2026-06-01              ]  │   │                                                     │  │
│  │ Nombre opcional              │   │ Esto permite registrar contexto sin convertir el     │  │
│  │ [ Pecho + cardio suave    ]  │   │ inicio de sesion en un formulario pesado.           │  │
│  │                              │   │                                                     │  │
│  │ Sensacion general            │   │ Funcionalidades:                                    │  │
│  │ [Mala] [Normal]              │   │ - validaciones                                      │  │
│  │ [Buena] [Muy buena]          │   │ - estados de envio                                  │  │
│  │                              │   │ - notas                                             │  │
│  │ Notas                        │   │ - navegacion directa al detalle                     │  │
│  │ [ Intentar subir peso     ]  │   └─────────────────────────────────────────────────────┘  │
│  │ [ Crear sesion            ]  │                                                            │
│  └──────────────────────────────┘                                                            │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Pantalla destacada: detalle de sesion

```txt
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Todo el entrenamiento en una pantalla                                                        │
│                                                                                              │
│  ┌──────────────────────────────┐   ┌─────────────────────────────────────────────────────┐  │
│  │ ← Pecho + cardio        ◐   │   │ Resumen de valor                                     │  │
│  │ Hoy · Sensacion buena       │   │                                                     │  │
│  ├──────────────────────────────┤   │ La sesion combina resumen y detalle editable:        │  │
│  │ Resumen                      │   │ ejercicios, series, volumen, cardio y notas.         │  │
│  │ 4 ejercicios · 11 series     │   │                                                     │  │
│  │ 2.450 kg · 25 min cardio     │   │ Cada entrada se adapta al tipo de ejercicio.         │  │
│  │                              │   │                                                     │  │
│  │ Ejercicios                   │   │ Casos contemplados:                                 │  │
│  │ ┌──────────────────────────┐ │   │ - fuerza: tabla kg/reps/estado                      │  │
│  │ │ Press pecho maquina      │ │   │ - cardio: tiempo/distancia/velocidad                │  │
│  │ │ Fuerza                   │ │   │ - borrado con confirmacion                          │  │
│  │ │ 1   40 kg   12   ✓       │ │   │ - toast de exito/error                              │  │
│  │ │ 2   45 kg   10   ✓       │ │   └─────────────────────────────────────────────────────┘  │
│  │ └──────────────────────────┘ │                                                            │
│  │ ┌──────────────────────────┐ │                                                            │
│  │ │ Cinta                    │ │                                                            │
│  │ │ 25 min · 2.8 km · 6.7    │ │                                                            │
│  │ └──────────────────────────┘ │                                                            │
│  │ + Añadir ejercicio          │                                                            │
│  └──────────────────────────────┘                                                            │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Pantalla destacada: selector de tipo

```txt
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Formularios distintos para datos distintos                                                   │
│                                                                                              │
│  ┌──────────────────────────────┐   ┌─────────────────────────────────────────────────────┐  │
│  │ Tipo de ejercicio            │   │ Por que importa                                     │  │
│  ├──────────────────────────────┤   │                                                     │  │
│  │ Selecciona el tipo para      │   │ Una maquina de pecho no se mide igual que una       │  │
│  │ abrir el formulario correcto │   │ sesion en cinta. Gym Tracker evita formularios      │  │
│  │                              │   │ genericos que terminan llenos de campos vacios.     │  │
│  │ ┌──────────────────────────┐ │   │                                                     │  │
│  │ │ Fuerza                   │ │   │ Tipos soportados:                                   │  │
│  │ │ Peso y repeticiones      │ │   │ - strength: peso y reps                             │  │
│  │ └──────────────────────────┘ │   │ - cardio: tiempo, distancia, velocidad, kcal        │  │
│  │ ┌──────────────────────────┐ │   │ - core: reps, segundos y notas                      │  │
│  │ │ Cardio                   │ │   │ - other: registro flexible                          │  │
│  │ │ Tiempo y distancia       │ │   └─────────────────────────────────────────────────────┘  │
│  │ └──────────────────────────┘ │                                                            │
│  │ ┌──────────────────────────┐ │                                                            │
│  │ │ Abdomen                  │ │                                                            │
│  │ │ Reps y tiempo            │ │                                                            │
│  │ └──────────────────────────┘ │                                                            │
│  │ ┌──────────────────────────┐ │                                                            │
│  │ │ Otros                    │ │                                                            │
│  │ │ Registro flexible        │ │                                                            │
│  │ └──────────────────────────┘ │                                                            │
│  └──────────────────────────────┘                                                            │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Pantalla destacada: registro de fuerza

```txt
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Registro de fuerza                                                                           │
│                                                                                              │
│  ┌──────────────────────────────┐   ┌─────────────────────────────────────────────────────┐  │
│  │ ← Añadir ejercicio       ◐   │   │ Rapidez durante la sesion                           │  │
│  ├──────────────────────────────┤   │                                                     │  │
│  │ Buscar ejercicio             │   │ Selecciona un ejercicio, revisa su historico y      │  │
│  │ [ Press...                ]  │   │ guarda series con peso y repeticiones.              │  │
│  │                              │   │                                                     │  │
│  │ Selecciona ejercicio         │   │ Detalles reales:                                    │  │
│  │ ┌──────────────────────────┐ │   │ - buscador por texto                                │  │
│  │ │ Press pecho maquina   ✓  │ │   │ - selector de ejercicios                            │  │
│  │ │ Fuerza · Pecho           │ │   │ - historico del ejercicio seleccionado              │  │
│  │ └──────────────────────────┘ │   │ - tabla editable de series                          │  │
│  │                              │   │ - añadir/eliminar serie                             │  │
│  │ Datos del ejercicio          │   │ - guardado con estado loading                       │  │
│  │ Historico: 50 kg x 8         │   └─────────────────────────────────────────────────────┘  │
│  │ ┌──────────────────────────┐ │                                                            │
│  │ │ Serie   Peso      Reps   │ │                                                            │
│  │ │ 1       40        12     │ │                                                            │
│  │ │ 2       45        10     │ │                                                            │
│  │ │ 3       50        8      │ │                                                            │
│  │ └──────────────────────────┘ │                                                            │
│  │ [+ Serie]        [Guardar]   │                                                            │
│  └──────────────────────────────┘                                                            │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 13. Pantalla destacada: registro cardio/core/otros

```txt
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Cardio, abdomen y otros registros                                                            │
│                                                                                              │
│  ┌──────────────────────────────┐   ┌─────────────────────────────────────────────────────┐  │
│  │ ← Añadir cardio          ◐   │   │ Campos adaptados al tipo                            │  │
│  ├──────────────────────────────┤   │                                                     │  │
│  │ Buscar ejercicio             │   │ Cardio registra bloques con duracion, distancia,    │  │
│  │ [ Buscar ejercicio...     ]  │   │ velocidad, inclinacion, resistencia y calorias.     │  │
│  │                              │   │                                                     │  │
│  │ Selecciona ejercicio         │   │ Core y otros registran reps, tiempo y notas.        │  │
│  │ ┌──────────────────────────┐ │   │                                                     │  │
│  │ │ Cinta                 ✓  │ │   │ Esto mantiene una misma experiencia visual con      │  │
│  │ │ Cardio · Piernas         │ │   │ datos correctos para cada disciplina.               │  │
│  │ └──────────────────────────┘ │   └─────────────────────────────────────────────────────┘  │
│  │                              │                                                            │
│  │ Datos de cardio              │                                                            │
│  │ ┌──────────────────────────┐ │                                                            │
│  │ │ Bloque Tiempo Dist Vel   │ │                                                            │
│  │ │ 1      25     2.8  6.7   │ │                                                            │
│  │ └──────────────────────────┘ │                                                            │
│  │ Notas del ejercicio          │                                                            │
│  │ [ Ritmo comodo            ]  │                                                            │
│  │ [+ Serie]        [Guardar]   │                                                            │
│  └──────────────────────────────┘                                                            │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 14. Pantalla destacada: ejercicios

```txt
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Catalogo vivo de ejercicios                                                                  │
│                                                                                              │
│  ┌──────────────────────────────┐   ┌─────────────────────────────────────────────────────┐  │
│  │ Ejercicios               +   │   │ Que muestra                                         │  │
│  ├──────────────────────────────┤   │                                                     │  │
│  │ [ Buscar ejercicio...     ]  │   │ El catalogo permite crear, buscar, filtrar y abrir  │  │
│  │                              │   │ cada ejercicio para ver su progreso.                │  │
│  │ [Todos] [Fuerza] [Cardio]    │   │                                                     │  │
│  │ [Abdomen] [Otros]            │   │ Estados contemplados:                               │  │
│  │                              │   │ - loading skeleton                                  │  │
│  │ ┌──────────────────────────┐ │   │ - error con reintento                               │  │
│  │ │ Press pecho maquina      │ │   │ - busqueda sin resultados                           │  │
│  │ │ Fuerza · Pecho, triceps  │ │   │ - toast tras crear ejercicio                        │  │
│  │ │ Ultimo: 50 kg x 8        │ │   │                                                     │  │
│  │ └──────────────────────────┘ │   │ Filtros reales: todos, fuerza, cardio, abdomen,     │  │
│  │ ┌──────────────────────────┐ │   │ otros.                                              │  │
│  │ │ Cinta                    │ │   └─────────────────────────────────────────────────────┘  │
│  │ │ Cardio · Piernas         │ │                                                            │
│  │ │ Ultimo: 25 min · 2.8 km  │ │                                                            │
│  │ └──────────────────────────┘ │                                                            │
│  └──────────────────────────────┘                                                            │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 15. Pantalla destacada: crear/editar ejercicio

```txt
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Gestion del catalogo                                                                          │
│                                                                                              │
│  ┌──────────────────────────────┐   ┌─────────────────────────────────────────────────────┐  │
│  │ ← Nuevo ejercicio        ◐   │   │ Campos del modelo                                   │  │
│  ├──────────────────────────────┤   │                                                     │  │
│  │ Nombre                       │   │ Un ejercicio guarda lo necesario para reutilizarlo   │  │
│  │ [ Press pecho maquina     ]  │   │ en multiples sesiones.                              │  │
│  │                              │   │                                                     │  │
│  │ Tipo                         │   │ La pantalla de edicion reutiliza el mismo formulario │  │
│  │ [Fuerza] [Cardio]            │   │ y añade borrado/desactivacion con confirmacion.     │  │
│  │ [Abdomen] [Otro]             │   │                                                     │  │
│  │                              │   │ Validaciones:                                       │  │
│  │ Musculos trabajados          │   │ - nombre obligatorio                                │  │
│  │ [ Pecho, triceps, hombro  ]  │   │ - maximo 120 caracteres                             │  │
│  │                              │   │ - payload normalizado desde store                   │  │
│  │ Notas                        │   └─────────────────────────────────────────────────────┘  │
│  │ [ Maquina del fondo       ]  │                                                            │
│  │                              │                                                            │
│  │ [ Guardar ejercicio       ]  │                                                            │
│  │ [ Borrar ejercicio ] editar  │                                                            │
│  └──────────────────────────────┘                                                            │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 16. Pantalla destacada: detalle de ejercicio

```txt
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Progreso por ejercicio                                                                        │
│                                                                                              │
│  ┌──────────────────────────────┐   ┌─────────────────────────────────────────────────────┐  │
│  │ ← Detalle de ejercicio   ⚙   │   │ El valor diferencial                                │  │
│  ├──────────────────────────────┤   │                                                     │  │
│  │ Press pecho maquina          │   │ Cada ejercicio tiene su propia pagina de progreso:   │  │
│  │ Fuerza · 8 sesiones          │   │ mejor marca, ultima vez, volumen total, duracion,    │  │
│  │                              │   │ recomendacion para la siguiente sesion e historial. │  │
│  │ Mejor marca                  │   │                                                     │  │
│  │ 50 kg x 8                    │   │ Incluye una evolucion visual con linea SVG y         │  │
│  │                              │   │ expansion de sesiones historicas.                    │  │
│  │ Ultima vez                   │   │                                                     │  │
│  │ Sesiones 8 · Volumen 9.200kg │   │ Recomendaciones posibles:                           │  │
│  │ Duracion 0m                  │   │ - subir peso                                        │  │
│  │                              │   │ - mantener peso                                     │  │
│  │ Siguiente sesion             │   │ - bajar peso                                        │  │
│  │ Subir · 52.5 kg              │   └─────────────────────────────────────────────────────┘  │
│  │                              │                                                            │
│  │ Evolucion                    │                                                            │
│  │     ╭────╮                   │                                                            │
│  │ ╭───╯    ╰──╮                │                                                            │
│  │                              │                                                            │
│  │ Historial                    │                                                            │
│  │ 1 jun · 3 series        v    │                                                            │
│  └──────────────────────────────┘                                                            │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 17. Pantalla destacada: calendario

```txt
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Calendario de constancia                                                                      │
│                                                                                              │
│  ┌──────────────────────────────┐   ┌─────────────────────────────────────────────────────┐  │
│  │ Calendario               +   │   │ Que comunica                                        │  │
│  ├──────────────────────────────┤   │                                                     │  │
│  │ Junio 2026             <  >  │   │ El calendario convierte sesiones aisladas en un     │  │
│  │ Resumen mensual              │   │ mapa de constancia. Cada dia puede mostrar la       │  │
│  │                              │   │ sesion principal y resumen de duracion/volumen.     │  │
│  │ Entrenado  Sin entreno       │   │                                                     │  │
│  │                              │   │ Detalles reales:                                    │  │
│  │  L  M  X  J  V  S  D        │   │ - navegacion mes anterior/siguiente                 │  │
│  │ [ ][ ][ ][ ][●][ ][ ]        │   │ - dias fuera del mes atenuados                      │  │
│  │ [ ][●][ ][●][ ][ ][ ]        │   │ - punto de dia entrenado                            │  │
│  │ [ ][ ][●][ ][ ][ ][ ]        │   │ - detalle del dia seleccionado                      │  │
│  │                              │   │ - enlace a detalle de sesion                        │  │
│  │ Lunes 1                      │   └─────────────────────────────────────────────────────┘  │
│  │ Pecho + cardio          >   │                                                            │
│  │ 4 ejercicios · 11 series     │                                                            │
│  │ Duracion 55m · 2.450 kg      │                                                            │
│  └──────────────────────────────┘                                                            │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 18. Pantalla destacada: graficas

```txt
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Analitica simple, visible y accionable                                                       │
│                                                                                              │
│  ┌──────────────────────────────┐   ┌─────────────────────────────────────────────────────┐  │
│  │ Graficas                 ◐   │   │ Que aporta                                          │  │
│  ├──────────────────────────────┤   │                                                     │  │
│  │ [Semana] [Mes] [Todo]        │   │ La pantalla de graficas resume actividad y          │  │
│  │ [Fuerza] [Cardio] [Core]     │   │ tendencia por periodo y tipo de entrenamiento.      │  │
│  │                              │   │                                                     │  │
│  │ Sesiones por semana          │   │ Modulos reales:                                     │  │
│  │  L  M  X  J  V  S  D        │   │ - barras por dia                                    │  │
│  │  ▃  ▇  ▂  ▆  ▇  ▁  ▄        │   │ - curva de metrica seleccionada                     │  │
│  │                              │   │ - tarjetas estadisticas                             │  │
│  │ Volumen de fuerza            │   │ - record personal                                   │  │
│  │      ╭────╮                  │   │ - periodos: semana, mes, todo                       │  │
│  │  ╭───╯    ╰──╮               │   │                                                     │  │
│  │                              │   │ Tipos: fuerza, cardio, abdomen/otros.               │  │
│  │ Total 12.450 kg              │   └─────────────────────────────────────────────────────┘  │
│  │ Record personal              │                                                            │
│  │ Press pecho 50 kg x 8        │                                                            │
│  └──────────────────────────────┘                                                            │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 19. Pantalla destacada: alertas

```txt
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Alertas para no perder el ritmo                                                               │
│                                                                                              │
│  ┌──────────────────────────────┐   ┌─────────────────────────────────────────────────────┐  │
│  │ Alertas                  ◐   │   │ Enfoque                                             │  │
│  ├──────────────────────────────┤   │                                                     │  │
│  │ Estado general               │   │ Las alertas no intentan ser inteligencia artificial. │  │
│  │ 3 alertas activas            │   │ Son reglas simples, comprensibles y accionables.    │  │
│  │                              │   │                                                     │  │
│  │ Criticas                     │   │ Reglas actuales:                                    │  │
│  │ ┌──────────────────────────┐ │   │ - ejercicios sin uso durante 21 dias                │  │
│  │ │ Racha en riesgo          │ │   │ - racha en riesgo tras 3 dias sin entrenar          │  │
│  │ │ Crear sesion             │ │   │ - desbalance de tipos en ventana de 28 dias         │  │
│  │ └──────────────────────────┘ │   │                                                     │  │
│  │                              │   │ Cada alerta lleva a una accion concreta.            │  │
│  │ Atencion                     │   └─────────────────────────────────────────────────────┘  │
│  │ ┌──────────────────────────┐ │                                                            │
│  │ │ Poco cardio reciente     │ │                                                            │
│  │ │ Ver calendario           │ │                                                            │
│  │ └──────────────────────────┘ │                                                            │
│  └──────────────────────────────┘                                                            │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 20. Pantalla destacada: backups

```txt
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Backups portables sin borrado destructivo                                                    │
│                                                                                              │
│  ┌──────────────────────────────┐   ┌─────────────────────────────────────────────────────┐  │
│  │ ← Backups               JSON │   │ Confianza de datos                                  │  │
│  ├──────────────────────────────┤   │                                                     │  │
│  │ Exportar todo el historial   │   │ El usuario puede descargar un archivo JSON          │  │
│  │ gym-tracker-backup-2026...   │   │ versionado con ejercicios, sesiones, entradas       │  │
│  │ [Exportar backup]            │   │ y series.                                           │  │
│  │                              │   │                                                     │  │
│  │ Importar sin borrar datos    │   │ La importacion es merge: reutiliza ejercicios        │  │
│  │ ┌──────────────────────────┐ │   │ existentes por nombre/tipo, crea los que faltan      │  │
│  │ │ backup.json              │ │   │ y omite entrenamientos duplicados.                  │  │
│  │ └──────────────────────────┘ │   │                                                     │  │
│  │ [Importar backup]            │   │ Funcionalidades visibles:                           │  │
│  │                              │   │ - exportacion JSON versionada                       │  │
│  │ Resumen                      │   │ - importacion no destructiva                         │  │
│  │ Creados 2 · Reutilizados 4   │   │ - validacion de schema                              │  │
│  │ Omitidos 0                   │   │ - resumen posterior                                 │  │
│  └──────────────────────────────┘   └─────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

Copy sugerido:

> Exporta tu historial completo y restáuralo cuando lo necesites. Gym Tracker importa en modo merge para proteger los datos existentes y evitar duplicados.

---

## 21. Pantalla destacada: offline y sincronizacion

```txt
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Preparada para entrenar incluso con mala conexion                                            │
│                                                                                              │
│  ┌──────────────────────────────┐   ┌─────────────────────────────────────────────────────┐  │
│  │ ← Centro offline             │   │ Confianza operacional                               │  │
│  ├──────────────────────────────┤   │                                                     │  │
│  │ [Sincronizar ahora]          │   │ La app incluye estado global online/offline,         │  │
│  │                              │   │ contador de operaciones pendientes y centro para     │  │
│  │ Estado     Sin conexion      │   │ revisar la cola local.                              │  │
│  │ Pendientes 3                 │   │                                                     │  │
│  │ Ultima sync 31/05 19:42      │   │ Funcionalidades visibles:                           │  │
│  │                              │   │ - banner sin conexion                               │  │
│  │ Cola de operaciones          │   │ - chip de pendientes                                │  │
│  │ ┌──────────────────────────┐ │   │ - sync manual                                      │  │
│  │ │ POST · pending · 19:50    │ │   │ - reintentar operacion                             │  │
│  │ │ /api/workout-sessions    │ │   │ - descartar operacion                              │  │
│  │ │ [Reintentar] [Descartar] │ │   │ - errores de sincronizacion                         │  │
│  │ └──────────────────────────┘ │   └─────────────────────────────────────────────────────┘  │
│  └──────────────────────────────┘                                                            │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 22. Arquitectura tecnica

```txt
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Arquitectura clara para crecer                                                                │
│                                                                                              │
│  ┌────────────────────────────────────┐      ┌────────────────────────────────────────────┐  │
│  │ Frontend Angular PWA               │      │ Backend Symfony API                        │  │
│  │                                    │      │                                            │  │
│  │ app/                               │      │ Controllers                                │  │
│  │ ├─ home                            │      │ Entities                                   │  │
│  │ ├─ sessions                        │      │ Repositories                               │  │
│  │ ├─ exercises                       │      │ Validation                                 │  │
│  │ ├─ calendar                        │      │ Migrations                                 │  │
│  │ ├─ charts                          │      │                                            │  │
│  │ ├─ alerts                          │      │                                            │  │
│  │ ├─ backups                         │      │                                            │  │
│  │ ├─ offline                         │      │                                            │  │
│  │ ├─ shared                          │      │                                            │  │
│  │ └─ core                            │      │                                            │  │
│  └────────────────────────────────────┘      └────────────────────────────────────────────┘  │
│                                                                                              │
│  UI → Store local → Facade → HTTP Service → REST API → PostgreSQL                            │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

Copy sugerido:

> La arquitectura separa UI, estado transitorio, operaciones de dominio y acceso HTTP. Esto facilita mantener formularios complejos, reutilizar componentes y ampliar funcionalidades sin acoplar la interfaz a la API.

---

## 23. Seccion API y stack

```txt
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Stack del proyecto                                                                            │
│                                                                                              │
│  ┌──────────────────────────────┐ ┌──────────────────────────────┐ ┌──────────────────────┐ │
│  │ Frontend                     │ │ Backend                      │ │ Datos y entorno      │ │
│  │ Angular 21                   │ │ Symfony 7.4                  │ │ PostgreSQL 16        │ │
│  │ TypeScript                   │ │ PHP 8.2+                     │ │ Docker Compose       │ │
│  │ PWA Service Worker           │ │ API REST                     │ │ Adminer local        │ │
│  └──────────────────────────────┘ └──────────────────────────────┘ └──────────────────────┘ │
│                                                                                              │
│  Endpoints principales                                                                         │
│  GET/POST /api/exercises      GET /api/exercises/{id}/progress                               │
│  GET/POST /api/workout-sessions                                                               │
│  GET /api/workout-sessions/{id}                                                               │
│  POST /api/workout-sessions/{id}/entries                                                      │
│  DELETE /api/workout-sessions/{id}/entries/{entryId}                                         │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 24. Seccion contribucion

```txt
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Contribuir                                                                                    │
│                                                                                              │
│  ┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐  │
│  │ 1. Haz fork            │ ---> │ 2. Crea una rama       │ ---> │ 3. Abre un Pull Request│  │
│  └────────────────────────┘      └────────────────────────┘      └────────────────────────┘  │
│                                                                                              │
│  Si el cambio toca reglas de negocio o validaciones, incluye pruebas.                         │
│                                                                                              │
│  [Leer CONTRIBUTING.md] [Ver issues] [Abrir PR]                                               │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 25. CTA final

```txt
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                              │
│             Empieza a registrar tus entrenamientos con una app abierta y simple.              │
│                                                                                              │
│             Gym Tracker es PWA, API Symfony, PostgreSQL y documentacion real.                 │
│                                                                                              │
│                         [Ver repositorio]       [Leer documentacion]                         │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# Copy por seccion

## Hero

Titulo:

> Tu diario de gimnasio, rapido y sin complicaciones.

Subtitulo:

> Registra sesiones, series, cardio y progreso desde una PWA open source, instalable y preparada para trabajar incluso con mala conexion.

CTAs:

- Ver repositorio
- Explorar funcionalidades

Badges:

- Open Source
- MIT License
- Angular + Symfony
- PWA
- Offline-ready

## Problema

> Registrar entrenamientos no deberia requerir una app pesada. Gym Tracker se centra en lo esencial: abrir, apuntar pesos o tiempos, guardar y consultar progreso.

## Funcionalidades

> Desde fuerza hasta cardio, cada tipo de ejercicio tiene campos propios. La app evita formularios genericos y mantiene el registro claro incluso en mitad de una sesion.

## Progreso

> Consulta la mejor marca, la ultima sesion, la evolucion y una recomendacion sencilla para la siguiente vez que repitas un ejercicio.

## Backups

> Exporta ejercicios y entrenamientos a un JSON versionado. La importacion funciona en modo merge para reutilizar coincidencias, crear lo que falta y evitar sesiones duplicadas.

## Offline

> Si la conexion falla, la interfaz lo muestra. Las operaciones pendientes quedan visibles en un centro offline con sincronizacion, reintento y descarte.

## Open source

> El proyecto esta publicado bajo licencia MIT e incluye README, documentacion, guia de contribucion, politica de seguridad, codigo de conducta, templates de GitHub y CI base.

---

# Correspondencia con la app real

| Seccion web | Fuente real en `frontend/src/app/` | Mensaje |
| --- | --- | --- |
| Hero preview | `home/home-page.html` | resumen semanal y CTA principal |
| Flujo de sesion | `sessions/new-session-page.html` | crear sesion con fecha, mood y notas |
| Detalle de sesion | `sessions/session-detail-page.html` | resumen, ejercicios y series |
| Registro fuerza | `sessions/add-session-exercise-page.html` | selector, historico y tabla kg/reps |
| Registro cardio/core | `sessions/add-session-exercise-by-type-page.html` | formularios por tipo |
| Catalogo | `exercises/exercises-page.html` | busqueda, filtros y cards |
| Alta/edicion ejercicio | `exercises/create-exercise-page.html`, `edit-exercise-page.html` | formulario compartido y borrado |
| Progreso ejercicio | `exercises/exercise-detail-page.html` | mejor marca, recomendacion, evolucion e historial |
| Calendario | `calendar/calendar-page.html` | constancia mensual y detalle diario |
| Graficas | `charts/charts-page.html` | barras, curva, tarjetas y record |
| Alertas | `alerts/alerts-page.html` | reglas accionables por severidad |
| Backups | `backups/backup-page.html` | export/import JSON, merge seguro y resumen de importacion |
| Offline | `offline/offline-center-page.html`, `app.html` | estado, cola y banners de sincronizacion |
| Navegacion | `shared/bottom-nav.component.html`, `shared/side-menu.component.ts` | PWA mobile-first, menu, tema |

---

# Estados que conviene mostrar en la web

La web de presentacion puede incluir una seccion pequena de "detalles cuidados" mostrando que la app contempla estados reales:

- loading skeletons,
- mensajes de error con reintento,
- estados vacios,
- toasts de exito/error,
- confirmaciones destructivas,
- modo claro/oscuro,
- navegacion inferior movil,
- menu lateral,
- banner offline,
- contador de operaciones pendientes,
- sync OK/error,
- backup JSON seleccionado,
- resumen de importacion merge.

Wireframe:

```txt
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Detalles de producto                                                                          │
│                                                                                              │
│  Loading       Error + retry       Empty states       Toasts       Confirm dialogs            │
│  ┌───────┐     ┌────────────┐      ┌───────────┐      ┌──────┐     ┌───────────────┐        │
│  │ ░░░░  │     │ Algo fallo │      │ Sin datos │      │ OK   │     │ ¿Eliminar?    │        │
│  │ ░░░░  │     │ Reintentar │      │ CTA       │      └──────┘     │ Cancel/Borrar │        │
│  └───────┘     └────────────┘      └───────────┘                   └───────────────┘        │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# Recomendaciones de implementacion visual

## Estructura

- Usar una unica pagina larga con anclas.
- Priorizar capturas o mockups de movil, porque la PWA se usa principalmente en el gimnasio.
- Alternar secciones de texto con mockups para evitar una landing plana.
- Mantener CTAs persistentes hacia GitHub y documentacion.

## Componentes de la landing

- `HeroSection`
- `OpenSourceStrip`
- `ProblemSection`
- `FeatureGrid`
- `TrainingFlowSection`
- `ScreenShowcase`
- `BackupSection`
- `OfflineSection`
- `ArchitectureSection`
- `ContributionSection`
- `FinalCtaSection`

## Estilo

- Fondo principal oscuro tecnico: azul noche o grafito.
- Superficies: tarjetas con borde sutil y blur ligero.
- Acento principal: turquesa/teal, alineado con los charts y estados de la app.
- Acentos secundarios: azul para PWA/offline, rojo controlado para alertas.
- Evitar gradientes genericos morados.
- Usar lineas finas, chips y datos como elementos decorativos.

## Movimiento

- Entrada escalonada del hero y mockup principal.
- Hover leve en tarjetas de funcionalidad.
- Animacion sutil en barras de graficas.
- No abusar de efectos: la sensacion debe ser de herramienta precisa, no de landing ruidosa.

---

# Checklist de contenido para construir la web

- [ ] Enlace al repositorio GitHub.
- [ ] Enlace a `README.md` o documentacion desplegada.
- [ ] Mencion clara de licencia MIT.
- [ ] Stack visible: Angular, Symfony, PostgreSQL, Docker, PWA.
- [ ] Capturas o mockups de dashboard, sesion, ejercicios, progreso, calendario, graficas, backups y offline.
- [ ] CTA principal: ver repositorio.
- [ ] CTA secundario: explorar documentacion.
- [ ] Seccion de contribucion.
- [ ] Seccion de arquitectura.
- [ ] Copy que explique que no es una red social fitness.
- [ ] Copy que destaque registro rapido y campos por tipo.
- [ ] Seccion de backups con export/import JSON y merge seguro.
- [ ] Seccion offline con cola y sincronizacion.
- [ ] Responsive movil.

---

# Resumen final

La web de presentacion debe contar una historia simple:

```txt
Problema: registrar entrenamientos suele ser lento o disperso.
Solucion: una PWA simple para registrar fuerza, cardio, abdomen y otros ejercicios.
Diferencial: progreso por ejercicio, calendario, graficas, alertas, backups y modo offline visible.
Confianza: proyecto open source, MIT, stack moderno, documentacion y CI base.
Accion: ver GitHub, leer docs y contribuir.
```

El objetivo no es vender humo. Es mostrar que Gym Tracker ya tiene una base funcional real, una arquitectura clara y una direccion de producto concreta.
