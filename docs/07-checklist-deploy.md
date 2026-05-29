# Checklist de deploy (self-hosted personal)

## Imprescindible antes de exponer fuera de localhost
- [ ] Ejecutar backend en `APP_ENV=prod` (nunca `dev` en servidor).
- [ ] Definir `APP_SECRET` robusto en variables de entorno del servidor (no en archivos versionados).
- [ ] Cambiar credenciales por defecto de base de datos por credenciales unicas y largas.
- [ ] No publicar puerto de PostgreSQL (`5432`) hacia internet.
- [ ] No exponer Adminer en produccion (o protegerlo por VPN/IP allowlist/basic auth fuerte).
- [ ] Configurar proxy reverso con HTTPS (Caddy, Traefik o Nginx + Let's Encrypt).
- [ ] Restringir el acceso segun uso personal (localhost, LAN o VPN).

## Datos y continuidad
- [ ] Configurar backup automatico de base de datos con retencion minima (7-30 dias).
- [ ] Probar restauracion de backup al menos una vez.
- [ ] Documentar ruta de restauracion para recuperacion rapida.

## Validaciones de salida a produccion
- [ ] Confirmar autenticacion activa en endpoints de escritura.
- [ ] Confirmar reglas de autorizacion en `security.yaml`.
- [ ] Confirmar que no hay rutas o herramientas de debug expuestas.
- [ ] Ejecutar `composer audit` sin vulnerabilidades criticas pendientes.
- [ ] Ejecutar `npm audit` sin vulnerabilidades criticas pendientes.

## Operacion recurrente
- [ ] Aplicar parches de sistema y contenedores al menos mensual.
- [ ] Revisar logs de aplicacion/proxy periodicamente.
- [ ] Revisar estado de backups y espacio en disco.
- [ ] Rotar secretos si hay sospecha de exposicion.

## Comandos utiles de verificacion
```bash
# Backend (en /backend)
composer audit

# Frontend (en /frontend)
npm audit
```
