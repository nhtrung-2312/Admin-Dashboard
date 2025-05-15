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

# Tạo user với UID và GID phù hợp
ARG USER_ID=1000
ARG GROUP_ID=1000

RUN groupadd -g ${GROUP_ID} appuser && \
    useradd -u ${USER_ID} -g appuser -s /bin/bash -m appuser

# Tạo các thư mục cần thiết và cấp quyền
RUN mkdir -p /var/www/html/storage/framework/{sessions,views,cache} \
    && mkdir -p /var/www/html/storage/framework/cache/laravel-excel \
    && mkdir -p /var/www/html/storage/logs \
    && mkdir -p /var/www/html/bootstrap/cache \
    && mkdir -p /.composer/cache \
    && chown -R appuser:appuser /var/www/html \
    && chown -R appuser:appuser /.composer \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache \
    && chmod -R 775 /.composer

USER appuser
