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

    protected $hidden = [];
    protected $fillable = ['name', 'description', 'price', 'quantity', 'status'];
}
