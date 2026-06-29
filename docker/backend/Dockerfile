# syntax=docker/dockerfile:1.7

############################
# Stage 1: composer install (prod deps)
############################
FROM composer:2 AS vendor

WORKDIR /app

# Copiamos solo los manifests primero para cachear la capa de vendor
COPY backend/composer.json backend/composer.lock ./

# --no-scripts evita ejecutar cache:clear/importmap:install/assets:install
# (esos pasos se hacen en el stage de runtime, contra la app completa)
# Retry por errores transitorios de red (codeload.github.com devuelve 400 a veces)
RUN for i in 1 2 3 4 5; do \
        composer install \
            --no-dev \
            --no-scripts \
            --no-autoloader \
            --prefer-dist \
            --no-interaction \
            --no-progress \
        && break; \
        echo "composer install intento $i fallo, reintentando en 5s..."; \
        sleep 5; \
    done

# Ahora copiamos el resto del codigo de la app
COPY backend/ ./

# Generamos el autoloader optimizado (classmap autoritativo = minimo overhead)
RUN for i in 1 2 3; do \
        composer dump-autoload --classmap-authoritative --no-dev --no-scripts \
        && break; \
        echo "dump-autoload intento $i fallo, reintentando en 5s..."; \
        sleep 5; \
    done

############################
# Stage 2: PHP-FPM runtime
############################
FROM php:8.3-fpm-alpine AS runtime

WORKDIR /app

# Dependencias del sistema + extensiones PHP necesarias para Symfony + Doctrine/Postgres
RUN apk add --no-cache \
        bash \
        git \
        icu-dev \
        libzip-dev \
        libpq-dev \
        oniguruma-dev \
        unzip \
        zip \
        $PHPIZE_DEPS \
    && docker-php-ext-install \
        intl \
        mbstring \
        opcache \
        pdo_pgsql \
        zip \
    && apk del $PHPIZE_DEPS

# Configuracion PHP y PHP-FPM
COPY docker/backend/php.ini /usr/local/etc/php/conf.d/zz-app.ini
COPY docker/backend/www.conf /usr/local/etc/php-fpm.d/zz-app.conf

# App + vendor desde el builder
COPY --from=vendor --chown=www-data:www-data /app /app

# Composer CLI (util para el entrypoint de dev y para correr bin/console)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Symfony necesita escribir en var/
RUN mkdir -p var/cache var/log \
    && chown -R www-data:www-data var

# Symfony's Dotenv exige que /app/.env exista para arrancar. Si el repo no lo
# incluye (es lo normal en repos que despliegan a varios entornos), creamos
# uno vacio. Las env vars reales vienen del orquestador y machacan cualquier
# valor. Para warmup en runtime: `php bin/console cache:warmup --env=prod`.
RUN [ -f /app/.env ] || touch /app/.env \
    && chown www-data:www-data /app/.env

# NOTA: No hacemos cache:warmup aqui a proposito.
# Las env vars reales (APP_SECRET, DATABASE_URL, etc.) las proporciona el
# orquestador en runtime. Symfony genera/regenera la cache al primer request
# o cuando se ejecuta `php bin/console cache:warmup` manualmente desde el deploy.

EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD php -r 'exit(@fsockopen("127.0.0.1", 9000) ? 0 : 1);'

CMD ["php-fpm"]
