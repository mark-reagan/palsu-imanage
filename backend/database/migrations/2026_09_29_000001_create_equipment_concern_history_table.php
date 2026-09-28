<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipment_concern_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('concern_id')->nullable()->constrained('equipment_concerns')->nullOnDelete();
            $table->string('action');
            $table->string('equipment_name');
            $table->string('asset_code')->nullable();
            $table->string('reporter_name');
            $table->text('description');
            $table->string('severity');
            $table->string('status');
            $table->text('admin_remarks')->nullable();
            $table->string('actor_name');
            $table->string('actor_role');
            $table->timestamp('created_at')->useCurrent();
            $table->index('created_at');
        });

        DB::table('equipment_concern_history')->insertUsing(
            [
                'concern_id', 'action', 'equipment_name', 'asset_code', 'reporter_name',
                'description', 'severity', 'status', 'admin_remarks', 'actor_name',
                'actor_role', 'created_at',
            ],
            DB::table('equipment_concerns as concerns')
                ->join('equipment', 'equipment.id', '=', 'concerns.equipment_id')
                ->join('users as reporter', 'reporter.id', '=', 'concerns.reported_by')
                ->leftJoin('users as reviewer', 'reviewer.id', '=', 'concerns.reviewed_by')
                ->selectRaw("concerns.id, 'existing record', equipment.name, equipment.asset_code, reporter.name, concerns.description, concerns.severity, concerns.status, concerns.admin_remarks, COALESCE(reviewer.name, reporter.name), COALESCE(reviewer.role, reporter.role), concerns.updated_at")
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('equipment_concern_history');
    }
};