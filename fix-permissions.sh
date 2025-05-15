#!/bin/bash

# Lấy UID và GID của user hiện tại
export UID=$(id -u)
export GID=$(id -g)

# Fix permissions cho các thư mục
sudo chown -R $UID:$GID .
sudo chmod -R 775 storage bootstrap/cache

# Rebuild và restart containers
docker compose down
docker compose build --no-cache
docker compose up -d

# Fix permissions trong container
docker compose exec app chown -R appuser:appuser /var/www/html/storage /var/www/html/bootstrap/cache
docker compose exec app chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache
