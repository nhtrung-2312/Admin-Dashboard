<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $table = 'product';

    protected $guarded = [];
    protected $primaryKey = 'id';
    protected $hidden = [];
    protected $fillable = ['id' ,'name', 'description', 'price', 'quantity', 'status', 'image_url', 'created_at', 'updated_at', 'deleted_at'];
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = true;

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($product) {
            if ($product->quantity == 0) {
                $product->status = 2;
            } elseif($product->status == 2 && $product->quantity > 0) {
                $product->status = 1;
            }
        });
    }
}
