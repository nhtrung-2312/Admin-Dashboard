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
        // Tạo admin user nếu chưa tồn tại
        if (!MstUser::where('email', 'admin@example.com')->exists()) {
            MstUser::create([
                'name' => 'Admin',
                'email' => 'admin@example.com',
                'password' => bcrypt('password'),
                'group_role' => 'admin',
                'is_active' => true,
                'is_delete' => false,
            ]);
        }

        // Tạo 100 user ngẫu nhiên
        MstUser::factory(100)->create();
    }
}
