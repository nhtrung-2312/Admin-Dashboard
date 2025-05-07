<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FileLogDetail extends Model
{
    protected $fillable = [
        'file_log_id',
        'row_number',
        'row_data',
        'error_message'
    ];

    protected $casts = [
        'row_data' => 'array'
    ];

    public function fileLog()
    {
        return $this->belongsTo(FileLog::class);
    }
}
