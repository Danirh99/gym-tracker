# Seguridad para self-hosted personal

## Contexto
Este proyecto se despliega en modo self-hosted para uso personal.
El objetivo es reducir riesgos reales con una configuracion simple y mantenible.

## Prioridad alta (aplicacion y API)
- [ ] Activar autenticacion real para endpoints de escritura (`POST`, `PUT`, `DELETE`).
- [ ] Definir reglas de autorizacion en `backend/config/packages/security.yaml` (`access_control`).
- [ ] Anadir rate limiting para endpoints sensibles.
- [ ] Mantener validacion estricta de payloads en backend y completar donde falte.
- [ ] Normalizar respuestas de error sin exponer detalles internos.
- [ ] Desactivar o blindar herramientas de debug en produccion.
- [ ] Revisar CORS y permitir solo origenes necesarios.

## Hardening de infraestructura
- [ ] Ejecutar contenedores con usuario no-root cuando sea posible.
- [ ] Minimizar puertos publicados (idealmente solo proxy reverso).
- [ ] Segmentar red Docker para mantener servicios internos no expuestos.
- [ ] Definir politicas de reinicio y healthchecks para servicios criticos.
- [ ] Montar volumenes con permisos minimos necesarios.
- [ ] Rotar secretos si hay sospecha de exposicion.

## Dependencias y mantenimiento
- [ ] Ejecutar `composer audit` de forma periodica.
- [ ] Ejecutar `npm audit` de forma periodica.
- [ ] Actualizar dependencias criticas con prioridad de seguridad.
- [ ] Fijar politica de actualizacion (quincenal o mensual).
- [ ] Evitar paquetes innecesarios en produccion.

## Observabilidad minima
- [ ] Centralizar logs de aplicacion y proxy con rotacion.
- [ ] Configurar alertas basicas (caidas y errores 5xx repetidos).
- [ ] Registrar intentos fallidos de autenticacion.
- [ ] Documentar un procedimiento corto de respuesta ante incidente.

## Decisiones explicitas para este proyecto
- [ ] Definir modalidad de acceso: localhost, LAN, VPN o internet publica con dominio.
- [ ] Definir frecuencia de backup: diaria o semanal.
- [ ] Definir ventana de actualizaciones: mensual o trimestral.

## Nota practica
Para un proyecto self-hosted personal, el mayor salto de seguridad suele venir de:
1. No exponer servicios internos.
2. HTTPS y autenticacion.
3. Backups restaurables.
4. Actualizaciones constantes.
