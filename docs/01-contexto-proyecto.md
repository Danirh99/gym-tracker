# Contexto del proyecto

## Nombre provisional

**Gym Tracker PWA**

## Idea general

El proyecto consiste en desarrollar una **PWA personal para registrar y analizar entrenamientos de gimnasio**.

La aplicación estará construida con:

- **Frontend:** Angular
- **Backend:** Symfony
- **Formato:** PWA instalable en móvil y escritorio
- **Licencia:** Open Source
- **Uso inicial:** Personal

El objetivo no es crear una red social fitness ni una app compleja de salud, sino una herramienta sencilla para responder a una pregunta muy concreta:

> ¿Qué he entrenado, con qué peso, cuántas repeticiones hice y cómo estoy progresando?

---

## Objetivo del MVP

Tener una primera versión funcional en aproximadamente **1 semana**.

La app debe permitir:

1. Crear ejercicios o máquinas.
2. Registrar sesiones de entrenamiento.
3. Añadir ejercicios a cada sesión.
4. Guardar datos distintos según el tipo de ejercicio.
5. Consultar el historial de ejercicio.
6. Ver un calendario básico.
7. Ver gráficas simples de evolución.

---

## Alcance inicial

### La aplicación debe permitir registrar ejercicios de tipo:

- **Fuerza** (`strength`)
- **Cardio** (`cardio`)
- **Abdomen** (`core`)
- **Otro** (`other`)

Esto permite evitar que todos los ejercicios tengan los mismos campos.

Por ejemplo, una máquina de pecho necesita peso y repeticiones, pero una sesión en cinta necesita duración, distancia o velocidad.

---

## Entidades principales

El sistema se apoyará en cuatro conceptos principales:

```txt
Ejercicio
Sesión de entrenamiento
Registro de ejercicio en sesión
Serie / detalle del registro
```

Ejemplo:

```txt
Sesión: Lunes - Pecho y cardio

Ejercicios:
- Press pecho máquina
  - Serie 1: 12 reps - 40 kg
  - Serie 2: 10 reps - 45 kg

- Cinta
  - 20 min
  - 2.3 km
  - Velocidad media: 6.5 km/h
```

---

## Lo que debe evitarse en el MVP

Para mantener el proyecto simple, la primera versión no incluirá:

- Usuarios múltiples
- Login complejo
- Nutrición
- Fotos de progreso
- IA
- Integraciones con Google Fit / Apple Health
- Rutinas avanzadas
- Recomendaciones automáticas
- Gamificación compleja
- Comunidad o perfiles públicos

---

## Filosofía del producto

La app debe ser:

- **Rápida de usar en el gimnasio**
- **Simple de mantener**
- **Visualmente limpia**
- **Instalable como PWA**
- **Preparada para crecer**
- **Útil incluso sin conexión en el futuro**

La prioridad es registrar entrenamientos sin fricción.

---

## Frase guía del producto

> Registrar rápido, consultar fácil y entender el progreso sin complicaciones.
