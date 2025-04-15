<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ProductSeeder::class,
            RoleSeeder::class,
            MstUserSeeder::class,
        ]);
    }
}
