<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConcernHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'concern_id' => $this->concern_id,
            'action' => $this->action,
            'equipment_name' => $this->equipment_name,
            'asset_code' => $this->asset_code,
            'reporter_name' => $this->reporter_name,
            'description' => $this->description,
            'severity' => $this->severity,
            'status' => $this->status,
            'admin_remarks' => $this->admin_remarks,
            'actor_name' => $this->actor_name,
            'actor_role' => $this->actor_role,
            'created_at' => $this->created_at,
        ];
    }
}