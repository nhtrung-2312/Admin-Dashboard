<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MstUser extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'mst_users';

    protected $guarded = [];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    public $fillable = [
        'name',
        'email',
        'password',
        'group_role',
        'is_active',
        'is_delete',
        'last_login_at',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_delete' => 'boolean',
        'last_login_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
