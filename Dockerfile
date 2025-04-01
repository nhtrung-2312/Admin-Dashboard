# Use the official PHP image.
# https://hub.docker.com/_/php
FROM php:8.3-apache

# Install system dependencies and PHP extensions
RUN apt-get update && apt-get install -y \
  libfreetype6-dev \
  libjpeg62-turbo-dev \
  libpng-dev \
  libzip-dev \
  libpq-dev \
  libsqlite3-dev \
  zip \
  unzip \
  postgresql-client \
  default-mysql-client \
  && docker-php-ext-install -j "$(nproc)" opcache gd zip pdo_mysql \
  && docker-php-ext-configure gd --with-freetype --with-jpeg

# Configure PHP for Cloud Run.
RUN set -ex; \
  { \
  echo "; Cloud Run enforces memory & timeouts"; \
  echo "memory_limit = -1"; \
  echo "max_execution_time = 0"; \
  echo "; File upload at Cloud Run network limit"; \
  echo "upload_max_filesize = 1G"; \
  echo "post_max_size = 1G"; \
  echo "; Configure Opcache for Containers"; \
  echo "opcache.enable = On"; \
  echo "opcache.validate_timestamps = Off"; \
  echo "; Configure Opcache Memory (Application-specific)"; \
  echo "opcache.memory_consumption = 32"; \
  } > "$PHP_INI_DIR/conf.d/cloud-run.ini"

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy in custom code from the host machine.
WORKDIR /var/www/html

COPY . ./

COPY 000-default.conf /etc/apache2/sites-available/000-default.conf

RUN chmod 777 -R /var/www
RUN chown -R www-data:www-data /var/www

# Ensure the storage and cache directories exist
RUN mkdir -p /var/www/html/storage/logs /var/www/html/bootstrap/cache

# Set the correct permissions for Laravel
RUN chmod -R 777 /var/www/html/storage /var/www/html/bootstrap/cache

# Use the PORT environment variable in Apache configuration files.
# https://cloud.google.com/run/docs/reference/container-contract#port
ENV PORT=8080

RUN sed -i 's/80/${PORT}/g' /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf

# Configure PHP for development.
RUN mv "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini"

# Enable Apache modules
RUN a2enmod rewrite

# Expose the port
EXPOSE 8080

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
