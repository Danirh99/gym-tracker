# Flujo de usuario

## Objetivo del flujo

El usuario debe poder abrir la aplicación en el móvil, registrar un entrenamiento mientras está en el gimnasio y consultar después su progreso desde calendario o gráficas.

El flujo debe ser sencillo, con pocos pasos y sin pantallas innecesarias.

---

# Flujo principal

## 1. Abrir la aplicación

El usuario entra en la PWA y ve un resumen rápido:

- Próxima acción recomendada: iniciar entrenamiento
- Últimos entrenamientos
- Progreso semanal
- Acceso a calendario
- Acceso a gráficas
- Acceso a ejercicios

---

## 2. Crear o seleccionar ejercicio

Antes de registrar entrenamientos, el usuario puede crear ejercicios.

Campos básicos:

```txt
Nombre
Tipo: fuerza / cardio / abdomen / otro
Músculos trabajados
Notas opcionales
```

Ejemplo:

```txt
Nombre: Press pecho máquina
Tipo: Fuerza
Músculos: Pecho, tríceps, hombro
Notas: Máquina del gimnasio de la entrada
```

---

## 3. Iniciar entrenamiento

El usuario pulsa en **Nuevo entrenamiento**.

La app solicita:

```txt
Fecha
Nombre opcional
Sensación general
Notas
```

Ejemplo:

```txt
Nombre: Pecho + cardio suave
Fecha: Hoy
Sensación: Buena
Notas: Subir peso progresivamente
```

---

## 4. Añadir ejercicios a la sesión

Dentro de la sesión, el usuario añade uno o varios ejercicios.

Primero selecciona el ejercicio.

Después, la app muestra campos distintos según el tipo.

---

## 5. Registrar ejercicio de fuerza

Para ejercicios de fuerza se registran series.

Campos:

```txt
Peso
Repeticiones
Notas opcionales
```

Ejemplo:

```txt
Press pecho máquina

Serie 1: 40 kg - 12 reps
Serie 2: 45 kg - 10 reps
Serie 3: 50 kg - 8 reps
```

---

## 6. Registrar ejercicio de cardio

Para ejercicios de cardio se registran métricas de duración y rendimiento.

Campos:

```txt
Duración
Distancia
Velocidad media opcional
Inclinación / resistencia opcional
Calorías opcional
Notas opcionales
```

Ejemplo:

```txt
Cinta

Duración: 25 min
Distancia: 2.8 km
Velocidad media: 6.7 km/h
Inclinación: 3
```

---

## 7. Registrar abdomen u otros ejercicios

Para abdomen o ejercicios libres, se permite una estructura flexible.

Campos posibles:

```txt
Series
Repeticiones
Tiempo
Notas
```

Ejemplo:

```txt
Plancha

Serie 1: 45 segundos
Serie 2: 40 segundos
Serie 3: 35 segundos
```

---

## 8. Finalizar entrenamiento

Al terminar, el usuario pulsa **Finalizar sesión**.

La app muestra un resumen:

```txt
Duración total
Ejercicios realizados
Series totales
Volumen total de fuerza
Tiempo total de cardio
Notas
```

---

## 9. Consultar calendario

El usuario puede ir al calendario para ver:

- Días entrenados
- Días sin entrenar
- Sesiones por fecha
- Detalle de una sesión concreta

---

## 10. Consultar gráficas

La app muestra gráficas simples:

- Sesiones por semana
- Volumen de fuerza por semana
- Evolución de peso máximo por ejercicio
- Tiempo de cardio por semana
- Distancia de cardio por semana

---

## 10.1 Consultar recomendacion automatica de carga

En el detalle de cada ejercicio de fuerza, la app muestra una sugerencia para la siguiente sesion.

La recomendacion se calcula automaticamente con las dos sesiones mas recientes comparables del mismo ejercicio.

Posibles acciones:

- Subir peso
- Mantener peso
- Bajar peso

La tarjeta tambien muestra el motivo y, cuando aplica, un peso sugerido para la proxima sesion.

---

## 11. Consultar alertas

El usuario puede abrir **Alertas** desde el menu lateral para detectar desajustes recientes.

En el estado actual se muestran reglas con umbrales fijos:

- Ejercicios sin registrar en mas de 21 dias
- Racha en riesgo por mas de 3 dias sin entrenar
- Desbalance de tipos en ventana de 28 dias

Cada alerta incluye una accion rapida para corregirla (crear sesion, ir a ejercicios o calendario).

---

# Flujo resumido

```txt
Inicio
  ↓
Nuevo entrenamiento
  ↓
Crear sesión
  ↓
Añadir ejercicio
  ↓
Registrar datos según tipo
  ↓
Finalizar sesión
  ↓
Ver resumen
  ↓
Consultar calendario / gráficas
  ↓
Consultar alertas
```

---

# Pantallas principales

El MVP tendrá estas pantallas:

1. Dashboard
2. Listado de ejercicios
3. Crear / editar ejercicio
4. Nueva sesión de entrenamiento
5. Detalle de sesión
6. Añadir ejercicio a sesión
7. Calendario
8. Gráficas
9. Historial de ejercicio
10. Alertas
