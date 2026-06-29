# syntax=docker/dockerfile:1.7

FROM nginx:1.27-alpine

# Config del sitio
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Document root con los assets publicos de Symfony (index.php + assets/ + bundles/ + importmap.php)
# Symfony se encarga de la mayoria del routing, pero nginx sirve los estaticos directamente
# (assets/, bundles/, robots.txt, etc.) sin pasar por PHP-FPM.
COPY backend/public /usr/share/nginx/html

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -q -O- http://127.0.0.1:8000/healthz || exit 1
