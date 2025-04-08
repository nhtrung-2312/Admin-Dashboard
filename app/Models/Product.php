<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;

class Product extends Model
{
    use HasFactory, Notifiable;

    protected $table = 'product';

    protected $guarded = [];
    protected $primaryKey = 'id';
    protected $hidden = [];
    protected $fillable = ['id' ,'name', 'description', 'price', 'quantity', 'status', 'image_url', 'created_at', 'updated_at'];
    protected $keyType = 'string';
    public $incrementing = false;
}
