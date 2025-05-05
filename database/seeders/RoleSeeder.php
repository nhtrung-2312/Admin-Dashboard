<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // Tạo permissions
        $permissions = [
            'view_users',
            'create_users',
            'edit_users',
            'delete_users',
            'view_products',
            'create_products',
            'create_bulk_products',
            'edit_products',
            'delete_products',
            'delete_bulk_products',
            'view_roles',
            'create_roles',
            'edit_roles',
            'delete_roles',
        ];
        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission, 'guard_name' => 'api']);
        }

        // Tạo roles và gán permissions
        $admin = Role::create(['name' => 'admin', 'is_system' => 1, 'guard_name' => 'api']);
        $admin->givePermissionTo($permissions);

        $manager = Role::create(['name' => 'manager', 'guard_name' => 'api']);
        $manager->givePermissionTo(['view_products', 'view_users']);

        $user = Role::create(['name' => 'user', 'is_system' => 1, 'guard_name' => 'api']);
    }
}