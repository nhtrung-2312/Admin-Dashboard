FROM php:8.2-fpm

# Cài đặt các package hệ thống cần thiết
RUN apt-get update && apt-get install -y \
    libzip-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    zip \
    unzip \
    git \
    curl \
    libonig-dev \
    libxml2-dev \
    libicu-dev \
    libxslt1-dev \
    libpq-dev \
    libjpeg62-turbo-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo_mysql \
        mbstring \
        zip \
        exif \
        pcntl \
        bcmath \
        gd \
        intl \
        xsl \
        opcache \
        xml \
        dom

# Cài Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Cài Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Tạo thư mục làm việc
WORKDIR /var/www/html

# Phân quyền
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html

USER www-data
