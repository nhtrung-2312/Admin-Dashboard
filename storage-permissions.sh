#!/bin/bash

# Xóa và tạo lại thư mục framework
rm -rf storage/framework
mkdir -p storage/framework

# Tạo các thư mục cần thiết
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p storage/framework/cache
mkdir -p storage/logs
mkdir -p bootstrap/cache

# Cấp quyền cho từng thư mục riêng biệt
find storage -type d -exec chmod 775 {} \;
find storage -type f -exec chmod 664 {} \;
chmod -R ug+rwx storage/framework/views
chmod -R ug+rwx bootstrap/cache

# Tạo các file .gitignore để giữ thư mục
echo "*\n!.gitignore" > storage/framework/sessions/.gitignore
echo "*\n!.gitignore" > storage/framework/views/.gitignore
echo "*\n!.gitignore" > storage/framework/cache/.gitignore
echo "*\n!.gitignore" > storage/logs/.gitignore

# Tạo file test trong views để kiểm tra quyền ghi
touch storage/framework/views/test.php
echo "<?php /* Test file */ ?>" > storage/framework/views/test.php

echo "Storage permissions have been set!"
