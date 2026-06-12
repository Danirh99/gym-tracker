# Proyectos: estructura de caso de estudio y prompts de IA

## 1. Objetivo

Cada proyecto debe presentarse como un caso de estudio completo, no como una simple galeria de capturas.

La pagina debe combinar:

- video;
- imagenes con contexto;
- tecnologias;
- arquitectura;
- proceso;
- retos;
- resultados.

El objetivo es que cada proyecto explique que se hizo, por que se hizo asi y que valor aporto.

---

## 2. Estructura recomendada de la pagina

### 2.1 Hero

- Titulo del proyecto.
- Subtitulo con el problema o el resultado.
- CTA principal: ver demo, ver video o ver codigo.
- CTA secundario: contacto o siguiente proyecto.

### 2.2 Media principal

- Video corto en autoplay o click-to-play.
- Una captura principal o mockup destacado.
- Texto breve explicando lo que se ve.

### 2.3 Ficha rapida

Bloque con datos clave:

- rol;
- año;
- tipo de proyecto;
- stack principal;
- duracion;
- estado;
- enlaces relevantes.

### 2.4 Contexto

- Que problema existia.
- Quien lo necesitaba.
- Por que era importante resolverlo.

### 2.5 Solucion

- Que se construyo.
- Que enfoque se tomo.
- Que partes del producto resuelven el problema.

### 2.6 Features principales

Para cada feature:

- nombre;
- objetivo;
- comportamiento;
- valor aportado;
- captura o video corto.

### 2.7 Galeria con contexto

No solo mostrar imagenes.

Cada captura debe incluir:

- titulo;
- descripcion corta;
- que problema o flujo muestra.

### 2.8 Video walkthrough

- Video mas largo si el proyecto lo justifica.
- Recorrido general del producto.
- Puede incluir narracion o subtitulos.

### 2.9 Tecnologias

Por cada tecnologia importante:

- que hace en el proyecto;
- por que se eligio;
- que parte cubre.

### 2.10 Arquitectura

Debe explicar claramente:

- frontend;
- backend;
- CMS si existe;
- APIs;
- base de datos;
- servicios externos;
- flujo de datos.

Idealmente incluir:

- diagrama simple;
- explicacion de capas;
- decisiones tecnicas relevantes.

### 2.11 Proceso

- discovery;
- investigacion;
- wireframes;
- iteraciones;
- implementacion;
- validacion.

### 2.12 Retos y decisiones

- Problemas encontrados.
- Soluciones aplicadas.
- Compromisos o tradeoffs.

### 2.13 Resultados

- metricas si existen;
- mejoras de rendimiento;
- mejoras de UX;
- impacto real.

### 2.14 Aprendizajes

- que funciono bien;
- que mejoraria;
- que se aprendio.

### 2.15 Cierre

- Resumen final.
- CTA a contacto, demo o siguiente proyecto.

---

## 3. Material que debe preparar la IA

La IA que analice el proyecto debe devolver, como minimo:

- resumen ejecutivo;
- problema;
- solucion;
- publico objetivo;
- funcionalidades;
- stack;
- arquitectura;
- flujo de usuario;
- capturas sugeridas;
- videos sugeridos;
- textos para cada seccion;
- datos faltantes;
- riesgos o dudas abiertas.

---

## 4. Prompt para la IA que analiza el proyecto

```text
Actua como analista de producto, arquitecto tecnico y redactor de casos de estudio.

Tu tarea es analizar un proyecto completo y devolver toda la informacion necesaria para crear una pagina de caso de estudio premium.

Objetivo:
- entender el proyecto de principio a fin;
- extraer su valor real;
- identificar su arquitectura tecnica;
- proponer la estructura de contenido ideal para la pagina;
- preparar material util para que otra IA genere despues el componente .astro.

Instrucciones:
- No te limites a resumir.
- Analiza el proyecto desde producto, negocio, tecnica, UX y contenido.
- Si falta informacion, indicala claramente como pendiente o inferida.
- No inventes datos reales; si algo no se puede confirmar, marcara como supuesto.
- Devuelve el resultado en markdown limpio y estructurado.

Necesito que entregues estas secciones:

1. Vision general
- Que es el proyecto.
- Para quien es.
- Que problema resuelve.
- Cual es su propuesta de valor.

2. Resumen ejecutivo
- 5 a 8 bullets con lo mas importante.

3. Contexto de negocio
- Situacion inicial.
- Necesidad principal.
- Objetivo del proyecto.

4. Publico objetivo
- Usuarios principales.
- Necesidades y expectativas.

5. Funcionalidades clave
- Lista de features.
- Explicacion breve de cada una.

6. Flujo de usuario
- Como se usa el proyecto paso a paso.
- Casos de uso principales.

7. Arquitectura tecnica
- Frontend.
- Backend.
- Base de datos.
- APIs.
- Integraciones externas.
- Autenticacion si existe.
- Flujo de datos.

8. Tecnologias usadas
- Lista completa.
- Motivo de eleccion.
- Papel de cada tecnologia.

9. UI/UX y presentacion visual
- Patrones de interfaz.
- Decisiones visuales.
- Componentes o pantallas relevantes.

10. Contenido visual necesario
- Capturas necesarias.
- Videos necesarios.
- Diagramas necesarios.
- Mockups recomendados.

11. Retos y decisiones
- Problemas tecnicos o de producto.
- Soluciones aplicadas.
- Tradeoffs.

12. Resultados e impacto
- Metricas si existen.
- Impacto esperado o real.

13. Aprendizajes
- Lo aprendido.
- Mejoras futuras.

14. Dudas y datos faltantes
- Lista de informacion que falta para cerrar la pagina.

15. Material listo para la pagina
- Hero copy.
- Subtitulo.
- Texto de contexto.
- Texto de solucion.
- Titulos de secciones.
- Copy breve para features.
- Copy para tecnologia y arquitectura.

Formato de salida:
- Usa encabezados claros.
- Usa tablas solo si aportan claridad.
- Mantén frases concretas.
- Incluye bullets donde ayuden.
- Si puedes, termina con una lista de campos estructurados en JSON o YAML para facilitar la generacion posterior.
```

---

## 5. Prompt para la IA que genera el .astro

```text
Actua como desarrollador frontend senior especializado en Astro.

Tu tarea es convertir el contenido analizado de un proyecto en una pagina .astro completa, limpia y premium.

Objetivo:
- crear una pagina de caso de estudio visualmente fuerte;
- usar una estructura modular y reutilizable;
- preparar la pagina para mostrar video, capturas, tecnologia y arquitectura;
- mantener el codigo ordenado y facil de mantener.

Instrucciones:
- Usa Astro de forma idiomatica.
- Prioriza componentes claros y reutilizables.
- Respeta el contenido entregado por la IA anterior.
- No inventes contenido nuevo salvo texto funcional minimo.
- Si faltan datos, deja marcadores o valores por defecto faciles de detectar.
- Incluye secciones para hero, media, resumen, features, tecnologia, arquitectura, proceso, resultados y cierre.
- Si el proyecto lo necesita, agrega soportes para video embed, galeria y diagrama.
- Mantén una estetica premium, limpia y editorial.

Entrega:
- el archivo .astro principal;
- componentes auxiliares si son necesarios;
- la estructura de props o datos esperada;
- cualquier nota breve sobre supuestos o campos faltantes.
```

---

## 6. Recomendacion de flujo entre IAs

```txt
IA 1: analiza proyecto completo
↓
Devuelve contenido estructurado, arquitectura, media y copy
↓
IA 2: toma ese contenido y genera la pagina .astro
↓
Se revisa visual y funcionalmente
```
