<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EquipmentConcernHistory extends Model
{
    public $timestamps = false;

    protected $table = 'equipment_concern_history';

    protected $fillable = [
        'concern_id', 'action', 'equipment_name', 'asset_code', 'reporter_name',
        'description', 'severity', 'status', 'admin_remarks', 'actor_name',
        'actor_role', 'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];
}