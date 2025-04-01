#!/bin/bash

# Ensure composer dependencies are installed
composer install --no-scripts --no-interaction --prefer-dist

# Enable Apache mod_rewrite
a2enmod rewrite

# Run your Laravel artisan command
php artisan migrate:fresh --seed

# Start Apache in the foreground (adjust if needed)
apache2-foreground
