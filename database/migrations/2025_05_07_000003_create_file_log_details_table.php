<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('file_log_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('file_log_id')->constrained('file_logs')->onDelete('cascade');
            $table->integer('row_number');
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('file_log_details');
    }
};