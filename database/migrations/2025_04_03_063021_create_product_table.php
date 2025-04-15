<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('product', function (Blueprint $table) {
            $table->string('id', 10)->primary();
            $table->string('name', 255);
            $table->string('description', 255)->nullable();
            $table->integer('price')->default(0);
            $table->integer('quantity')->default(0);
            $table->string('image_url', 255)->nullable();
            $table->tinyInteger('status')->default(1)->comment('0: Ngừng bán , 1: Đang bán, 2: Hết hàng');
            $table->timestamp('created_at')->default(now());
            $table->timestamp('updated_at')->default(now());
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    { 
        Schema::dropIfExists('product');
    }
};
