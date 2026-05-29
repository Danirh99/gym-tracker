# Contributing to Gym Tracker

Gracias por tu interes en contribuir.

## Flujo recomendado

1. Haz fork del repositorio.
2. Crea una rama desde `main` con un nombre descriptivo:
   - `feat/nombre-cambio`
   - `fix/nombre-bug`
3. Realiza cambios pequenos y enfocados.
4. Asegura que build y tests pasan.
5. Abre un Pull Request con contexto claro.

## Requisitos antes de abrir PR

- Frontend compila y tests en verde.
- Backend compila y tests en verde.
- El cambio incluye pruebas cuando toca reglas de negocio.
- No subir secretos ni credenciales.
- Mantener coherencia con la estructura actual del proyecto.

## Comandos utiles

```bash
# frontend
docker compose exec frontend npm test
docker compose exec frontend npm run build

# backend
docker compose exec backend php bin/phpunit
```

## Estilo de commits

Se recomienda usar Conventional Commits:

- `feat: ...`
- `fix: ...`
- `docs: ...`
- `refactor: ...`
- `test: ...`
- `chore: ...`

## Pull Requests

Incluye en la descripcion:

- Que problema resuelve.
- Que cambia exactamente.
- Como probarlo.
- Riesgos o impactos conocidos.

Si hay cambios visuales, anade capturas o un video corto.
