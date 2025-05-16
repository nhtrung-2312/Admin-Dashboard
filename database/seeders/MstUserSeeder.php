<?php

namespace Database\Seeders;

use App\Models\MstUser;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Faker\Factory as Faker;

class MstUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();
        $roles = DB::table('roles')->pluck('name')->toArray();

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

        $users = [];

        for ($i = 0; $i < 200; $i++) {
            $email = $faker->unique()->safeEmail();
            $users[] = [
                'name' => $faker->name(),
                'email' => $email,
                'password' => Hash::make(Str::before($email, '@')),
                'group_role' => $faker->randomElement($roles),
                'is_active' => $faker->boolean(),
                'is_delete' => false,
                'last_login_at' => $faker->dateTimeBetween('-1 year', 'now'),
            ];
        }

        // Insert hàng loạt một lần
        DB::table('mst_users')->insert($users);
    }
}
