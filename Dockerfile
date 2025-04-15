FROM php:8.2-fpm

# Cài đặt dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip

# Cài đặt Node.js và npm
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Cài đặt PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd fileinfo

# Cài đặt Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Fix permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html

USER www-data
