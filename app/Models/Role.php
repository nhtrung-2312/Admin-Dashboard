<?php

namespace App\Models;

use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    protected $fillable = [
        'name',
        'guard_name'
    ];

    public $timestamps = true;

    public function toArray()
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'permissions' => $this->permissions,
            'is_system' => $this->is_system,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}