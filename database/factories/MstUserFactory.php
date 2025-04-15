<?php

namespace Database\Factories;

use App\Models\MstUser;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class MstUserFactory extends Factory
{
    protected $model = MstUser::class;

    public function definition(): array
    {
        $roles = \DB::table('roles')->pluck('name')->toArray();
        $email = fake()->unique()->safeEmail();
        return [
            'name' => fake()->name(),
            'email' => $email,
            'password' => Hash::make(Str::before($email, '@')),
            'group_role' => fake()->randomElement($roles),
            'is_active' => fake()->boolean(),
            'is_delete' => false,
            'last_login_at' => fake()->dateTimeBetween('-1 year', 'now'),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
