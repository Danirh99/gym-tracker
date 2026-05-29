# Plan completo PWA + modo offline

## Objetivo

Convertir el frontend Angular en una PWA instalable que:

1. Funcione correctamente sin conexion para navegar y consultar datos recientes.
2. Permita crear/editar/borrar datos offline.
3. Sincronice automaticamente los cambios pendientes cuando vuelva internet.

---

## Estado actual (resumen)

- No hay `manifest.webmanifest`.
- No hay `ngsw-config.json`.
- No esta activado `serviceWorker` en `angular.json`.
- No esta integrada la provision de service worker en `app.config.ts`.
- Faltan iconos PWA (192, 512, maskable, apple touch).
- El frontend depende de API online para toda escritura de datos.

---

## Alcance por fases

## Fase 1: PWA instalable base

### Objetivo

Que la app sea instalable en movil/escritorio y cumpla los requisitos tecnicos basicos de PWA.

### Tareas

1. **Dependencias y configuracion Angular**
   - Instalar `@angular/service-worker`.
   - Activar `serviceWorker` en `frontend/angular.json` para `production`.
   - Crear `frontend/ngsw-config.json` con configuracion inicial.

2. **Registro del SW**
   - Registrar service worker en `frontend/src/app/app.config.ts` con `provideServiceWorker('ngsw-worker.js', ...)`.
   - Activarlo solo en `production`.

3. **Manifest y metadatos**
   - Crear `frontend/public/manifest.webmanifest`.
   - Enlazarlo desde `frontend/src/index.html`.
   - Añadir metatags clave: `theme-color`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-mobile-web-app-title`.

4. **Iconografia**
   - Añadir iconos en `frontend/public/icons/`:
     - `icon-192x192.png`
     - `icon-512x512.png`
     - `icon-maskable-512x512.png`
     - `apple-touch-icon-180x180.png`

### Criterios de aceptacion

- La app se puede instalar en Chrome/Edge Android y desktop.
- Lighthouse PWA sin errores bloqueantes de installability.

---

## Fase 2: Offline de lectura (cache util)

### Objetivo

Que la app cargue sin conexion y permita consultar informacion relevante reciente.

### Estrategia

- Cachear **app shell** (HTML/CSS/JS/fonts/iconos).
- Cachear **GET de API** de uso frecuente con expiracion controlada.

### Tareas

1. **Configurar `assetGroups` en `ngsw-config.json`**
   - `app`: ficheros de build (`/*.css`, `/*.js`, `index.html`, etc.).
   - `assets`: `public/**`, iconos y fuentes.

2. **Configurar `dataGroups` para API GET**
   - Endpoints iniciales:
     - `/api/exercises`
     - `/api/workout-sessions`
     - `/api/workout-sessions?*`
   - Estrategia sugerida:
     - `freshness` para datos de negocio.
     - `timeout` corto (ej. `5s`).
     - `maxAge` (ej. `1d`) y `maxSize` acotado.

3. **UI de conectividad**
   - Banner o estado global online/offline.
   - Mensajes claros cuando se muestran datos en cache.

### Criterios de aceptacion

- Con modo avion, la app abre y renderiza vistas principales.
- Se pueden consultar listas/cache recientes sin error fatal.

---

## Fase 3: Offline de escritura + sincronizacion

### Objetivo

Permitir que el usuario registre entrenamientos offline y que se sincronicen automaticamente al recuperar red.

### Arquitectura propuesta

1. **Cola local de operaciones pendientes** en IndexedDB.
2. **Interceptor HTTP** para capturar escrituras (`POST/PUT/DELETE`).
3. **Sync service** que reprocesa la cola al volver online.
4. **Feedback de estado** por operacion (pendiente, sincronizada, error).

### Modelo de datos sugerido (IndexedDB)

Store: `pending_operations`

Campos:
- `id` (uuid local)
- `createdAt`
- `endpoint`
- `method` (`POST` | `PUT` | `DELETE`)
- `payload`
- `entityType` (`exercise`, `session`, `entry`, ...)
- `tempEntityId` (opcional)
- `status` (`pending`, `syncing`, `failed`)
- `retryCount`
- `lastError`
- `clientRequestId` (idempotencia)

### Flujo funcional

1. Usuario hace accion de escritura.
2. Si hay red: request normal.
3. Si no hay red:
   - guardar operacion en IndexedDB,
   - responder a UI con exito local,
   - marcar elemento como pendiente de sync.
4. Evento `online` (y proceso periodico) dispara sincronizacion.
5. Reprocesar cola FIFO:
   - enviar request al backend,
   - si ok: marcar completada y limpiar,
   - si error transitorio: reintentar con backoff,
   - si error de validacion/negocio: marcar `failed` y notificar.

### IDs temporales y reconciliacion

- Para creaciones offline, usar IDs temporales locales (ej. `tmp-...`).
- Mantener un mapa `tempId -> serverId` al sincronizar.
- Reescribir referencias dependientes cuando llegue el ID real.

### Conflictos e idempotencia

- Recomendado backend:
  - aceptar `clientRequestId` para evitar duplicados en reintentos.
  - devolver codigos y mensajes de conflicto claros.
- Frontend:
  - clasificar errores recuperables/no recuperables.
  - ofrecer accion manual en UI para reintentar o descartar.

### Criterios de aceptacion

- Se puede crear sesion/ejercicio offline.
- Al volver online, la cola se sincroniza sola.
- No se crean duplicados tras reintentos.

---

## Fase 4: UX y observabilidad

### Objetivo

Que el modo offline sea comprensible y confiable para uso diario.

### Tareas

1. Indicador persistente de conectividad.
2. Indicador de cola pendiente (contador).
3. Historial breve de sync (ultima sincronizacion, errores).
4. Toasts/alertas coherentes:
   - guardado local,
   - sincronizacion completada,
   - sincronizacion con errores.

### Criterios de aceptacion

- El usuario siempre sabe si esta offline.
- El usuario sabe si hay datos pendientes y su estado.

---

## Fase 5: Pruebas y validacion final

### Matriz minima de pruebas

1. **Installability**
   - Android Chrome: instalar desde navegador.
   - Desktop Chrome/Edge: instalar como app.

2. **Offline lectura**
   - Abrir app en modo avion tras haberla usado online.
   - Navegar por pantallas clave y consultar datos cacheados.

3. **Offline escritura**
   - Crear/editar/borrar registros en modo avion.
   - Cerrar y abrir app offline: persistencia local correcta.
   - Volver online: sincronizacion automatica correcta.

4. **Resiliencia**
   - Fallo 500 temporal en backend durante sync: reintentos.
   - Error 400 de validacion: marcar en `failed` y avisar.

5. **Calidad PWA**
   - Lighthouse PWA/Best Practices/Performance.

---

## Cambios por archivo (mapa de implementacion)

### Archivos a crear

- `frontend/ngsw-config.json`
- `frontend/public/manifest.webmanifest`
- `frontend/public/icons/*` (iconos PWA)
- `frontend/src/app/core/offline/offline-queue.service.ts`
- `frontend/src/app/core/offline/offline-sync.service.ts`
- `frontend/src/app/core/offline/offline-status.service.ts`
- `frontend/src/app/core/offline/offline-write.interceptor.ts`

### Archivos a modificar

- `frontend/package.json`
  - dependencia `@angular/service-worker`
- `frontend/angular.json`
  - activar `serviceWorker` en build de produccion
- `frontend/src/app/app.config.ts`
  - `provideServiceWorker`
  - registrar interceptor de escrituras offline
- `frontend/src/index.html`
  - link a `manifest.webmanifest`
  - metatags PWA/apple
- componentes de layout/shell
  - mostrar estado online/offline y cola pendiente

---

## Roadmap sugerido (orden real de ejecucion)

1. Fase 1 completa (instalable).
2. Fase 2 completa (offline lectura).
3. Prototipo Fase 3 solo para `createSession`.
4. Extender Fase 3 a ejercicios y entradas.
5. Fase 4 (UX completa).
6. Fase 5 (QA + ajustes finales).

---

## Riesgos y mitigaciones

- **Complejidad de sincronizacion**: empezar con pocos endpoints y ampliar gradualmente.
- **Conflictos de datos**: definir reglas de resolucion explicitas antes de escalar.
- **Duplicados por reintentos**: usar `clientRequestId` e idempotencia backend.
- **Soporte desigual de Background Sync**: basar sync en evento `online` + scheduler, no depender solo de Background Sync API.

---

## Definicion de terminado (DoD)

Se considera completado cuando:

1. La app es instalable en movil y escritorio.
2. La app abre y permite lectura sin conexion.
3. Se pueden registrar entrenamientos offline.
4. La sincronizacion automatica funciona y reporta errores al usuario.
5. Existe evidencia de pruebas de los escenarios criticos.
