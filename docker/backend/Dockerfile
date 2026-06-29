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

# Composer CLI (solo lo necesitamos en el contenedor para que el command de dev
# funcione; en prod no se ejecuta ningun composer install, asi que es solo coste de disco)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Symfony necesita escribir en var/
RUN mkdir -p var/cache var/log \
    && chown -R www-data:www-data var

# Pre-calentamos la cache de Symfony en prod.
# APP_SECRET y DATABASE_URL son obligatorios para que el kernel compile la config.
ENV APP_ENV=prod \
    APP_SECRET=build-time-placeholder-not-used-at-runtime \
    DATABASE_URL="postgresql://app:app@database:5432/app?serverVersion=16&charset=utf8"

RUN php bin/console cache:clear --no-warmup --env=prod \
    && php bin/console cache:warmup --env=prod

EXPOSE 9000

# healthcheck via cgi-fcgi (incluido en php image)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD cgi-fcgi -bind -connect 127.0.0.1:9000 || exit 1

CMD ["php-fpm"]
