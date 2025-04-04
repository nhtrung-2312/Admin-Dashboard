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
            'view users',
            'create users',
            'edit users',
            'delete users',
            'view products',
            'create products',
            'edit products',
            'delete products'
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Tạo roles và gán permissions
        $admin = Role::create(['name' => 'admin']);
        $admin->givePermissionTo($permissions);

        $manager = Role::create(['name' => 'manager']);
        $manager->givePermissionTo(['view products', 'view users']);

        $user = Role::create(['name' => 'user']);
    }
} 