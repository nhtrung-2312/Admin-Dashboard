<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('file_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('mst_users')->onDelete('cascade');
            $table->string('file_name');
            $table->enum('type', ['import', 'export']);
            $table->string('table_name');
            $table->integer('total_records')->default(0);
            $table->unsignedTinyInteger('status')->default(1)->comment('0:  Error, 1: Success, 2: Partial, 3: On Working');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('file_logs');
    }
};
