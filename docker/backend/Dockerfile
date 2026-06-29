FROM php:8.3-cli-alpine

WORKDIR /app

RUN apk add --no-cache \
  bash \
  git \
  icu-dev \
  libzip-dev \
  libpq-dev \
  oniguruma-dev \
  unzip \
  zip \
  && docker-php-ext-install \
  intl \
  mbstring \
  pdo_pgsql \
  zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

EXPOSE 8000

CMD ["php", "-S", "0.0.0.0:8000", "-t", "public", "public/index.php"]
