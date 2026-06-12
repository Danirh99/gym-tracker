# Gym Tracker

Gym Tracker es una aplicacion open source para registrar entrenamientos de gimnasio y analizar progreso de forma simple. Incluye frontend Angular (PWA) y backend Symfony con API REST para gestionar ejercicios, sesiones y entradas por tipo de ejercicio.

## Stack

- Frontend: Angular 21 + TypeScript + Service Worker (PWA)
- Backend: Symfony 7.4 + PHP 8.2+
- Base de datos: PostgreSQL 16
- Entorno local: Docker Compose

## Funcionalidades principales

- Catalogo de ejercicios (crear, editar, listar y desactivar)
- Tipos de ejercicio: `strength`, `cardio`, `core`, `other`
- Registro de sesiones de entrenamiento
- Registro de entradas por sesion con validacion por tipo
- Vista de detalle de sesion y progreso por ejercicio
- Base preparada para uso offline en PWA

## Arquitectura del proyecto

```txt
gym-tracker/
  frontend/   # Angular app (UI, stores, facades, services)
  backend/    # Symfony API (controllers, entities, repositories)
  docs/       # Documentacion funcional y tecnica
  docker/     # Dockerfiles de frontend y backend
```

## Requisitos

- Docker y Docker Compose

Opcional para ejecucion sin contenedores:

- Node.js 20+
- npm 10+
- PHP 8.2+
- Composer
- PostgreSQL 16

## Inicio rapido con Docker

1. Clona el repositorio.
2. Levanta el entorno:

```bash
docker compose up --build
```

3. Ejecuta migraciones del backend:

```bash
docker compose exec backend php bin/console doctrine:migrations:migrate
```

## Servicios locales

- Frontend: `http://localhost:4200`
- Backend API desde el host: `http://localhost:8001`
- Adminer: `http://localhost:8080`
- PostgreSQL: `localhost:5432`

El backend escucha en el puerto `8000` dentro del contenedor y Docker lo publica como `8001` en el host (`8001:8000`). Otros contenedores en la misma red Docker pueden usar `http://backend:8000`.

Credenciales de base de datos:

- Host interno: `database`
- Database: `app`
- User: `app`
- Password: `app`

## Comandos utiles

```bash
# frontend
docker compose exec frontend npm install
docker compose exec frontend npm start
docker compose exec frontend npm test
docker compose exec frontend npm run build

# backend
docker compose exec backend composer install
docker compose exec backend php bin/console doctrine:migrations:migrate
docker compose exec backend php bin/console doctrine:fixtures:load
# para conservar datos existentes
docker compose exec backend php bin/console doctrine:fixtures:load --append
docker compose exec backend php bin/console cache:clear

# apagar entorno
docker compose down
```

## API principal

### Ejercicios

- `GET /api/exercises`
- `POST /api/exercises`
- `GET /api/exercises/{id}`
- `PUT /api/exercises/{id}`
- `DELETE /api/exercises/{id}`
- `GET /api/exercises/{id}/progress`

### Sesiones

- `GET /api/workout-sessions`
- `POST /api/workout-sessions`
- `GET /api/workout-sessions/{id}`
- `POST /api/workout-sessions/{id}/entries`
- `DELETE /api/workout-sessions/{id}/entries/{entryId}`

## API para n8n/Ollama

Symfony expone una capa independiente para integraciones de IA bajo `/api/assistant/tools/*`. Esta capa esta pensada para n8n, Telegram y un futuro MCP; devuelve un campo `message` listo para responder por Telegram y no permite borrar ni editar registros.

Configura un token en `backend/.env`:

```env
GYM_TRACKER_ASSISTANT_TOKEN=pon-un-token-largo-random
```

Despues levanta Docker con normalidad:

```bash
docker compose up --build
```

Desde n8n usa un nodo `HTTP Request`. La URL depende de donde se ejecute n8n:

- Si n8n corre en el host o fuera de la red Docker del proyecto: `http://HOST_DEL_SERVIDOR:8001`.
- Si n8n corre en la misma red Docker Compose que este proyecto: `http://backend:8000`.

Ejemplo usando el puerto publicado en el host:

```txt
Method: POST
URL: http://HOST_DEL_SERVIDOR:8001/api/assistant/tools/list-exercises
Headers:
  X-Gym-Tracker-Assistant-Token: pon-un-token-largo-random
  Content-Type: application/json
Body: {}
```

Tambien se acepta `Authorization: Bearer <token>`, pero `X-Gym-Tracker-Assistant-Token` evita problemas con servidores o proxies que no reenvian el header `Authorization`.

Endpoints disponibles:

- `POST /api/assistant/tools/list-exercises`
- `POST /api/assistant/tools/create-exercise`
- `POST /api/assistant/tools/get-exercise-progress`
- `POST /api/assistant/tools/list-recent-sessions`
- `POST /api/assistant/tools/get-session`
- `POST /api/assistant/tools/create-workout-session`
- `POST /api/assistant/tools/add-strength-entry`
- `POST /api/assistant/tools/add-cardio-entry`
- `POST /api/assistant/tools/add-core-entry`
- `POST /api/assistant/tools/add-other-entry`

Ejemplo para registrar fuerza:

```json
{
  "sessionId": 12,
  "exerciseId": 3,
  "sets": [
    { "weightKg": 40, "reps": 12 },
    { "weightKg": 45, "reps": 10 },
    { "weightKg": 50, "reps": 8 }
  ],
  "notes": null
}
```

## Testing

Frontend:

```bash
docker compose exec frontend npm test
```

Backend:

```bash
docker compose exec backend php bin/phpunit
```

## Documentacion

La documentacion funcional y tecnica vive en `docs/`. Punto de entrada recomendado: `docs/README.md`.

## Estado del modo offline

El proyecto ya incluye base PWA (manifest + service worker). La sincronizacion completa de escrituras offline se encuentra en evolucion por fases y esta documentada en `docs/03-plan-pwa-offline.md`.

## Roadmap corto

- Mejorar sincronizacion offline para escrituras
- Completar cobertura de tests en flujos criticos
- Añadir vistas de calendario y graficas de progreso avanzadas

## Open source readiness

- [x] Licencia MIT (`LICENSE`)
- [x] Guia de contribucion (`CONTRIBUTING.md`)
- [x] Codigo de conducta (`CODE_OF_CONDUCT.md`)
- [x] Politica de seguridad (`SECURITY.md`)
- [x] Templates de issue y PR (`.github/`)
- [x] CI base (build y tests frontend/backend)

## Contribuir

Las contribuciones son bienvenidas. Si quieres colaborar:

1. Haz fork del repositorio.
2. Crea una rama descriptiva.
3. Envia un Pull Request con una explicacion clara del cambio.

Si el cambio toca reglas de negocio o validaciones, incluye pruebas.

## Licencia

Este proyecto esta publicado bajo licencia MIT. Consulta `LICENSE`.
