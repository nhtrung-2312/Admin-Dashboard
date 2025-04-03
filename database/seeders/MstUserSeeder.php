<?php

namespace Database\Seeders;

use App\Models\MstUser;
use Illuminate\Database\Seeder;

class MstUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        MstUser::create([
            'name' => 'Admin',
            'email' => 'admin@gmail.com',
            'password' => bcrypt('123456'),
            'is_active' => 1,
            'is_delete' => 0,
            'group_role' => 'admin',
            'created_at' => now(),
            'updated_at' => now()
        ]);
        MstUser::factory(100)->create();
    }
}
