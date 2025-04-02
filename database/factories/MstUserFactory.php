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
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => Hash::make('password'),
            'remember_token' => Str::random(10),
            'group_role' => fake()->randomElement(['admin', 'user']),
            'is_active' => fake()->boolean(80),
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
