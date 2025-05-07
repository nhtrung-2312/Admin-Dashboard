<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FileLog extends Model
{
    protected $fillable = [
        'file_name',
        'type',
        'table_name',
        'filter',
        'total_records',
        'status',
        'user_id'
    ];

    protected $casts = [
        'filter' => 'array'
    ];

    public function user()
    {
        return $this->belongsTo(MstUser::class, 'user_id');
    }

    public function details()
    {
        return $this->hasMany(FileLogDetail::class);
    }
}
