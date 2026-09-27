<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EquipmentTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $equipmentRequest = $this->relationLoaded('equipmentRequest') ? $this->equipmentRequest : null;

        return [
            'id' => $this->id,
            'tracking_token' => $equipmentRequest?->tracking_token,
            'tracking_url' => $equipmentRequest?->tracking_token
                ? rtrim(config('app.frontend_url'), '/').'/track/'.$equipmentRequest->tracking_token
                : null,
            'qr_url' => $equipmentRequest?->tracking_token
                ? rtrim(config('app.url'), '/').'/api/v1/public/requests/'.$equipmentRequest->tracking_token.'/qr'
                : null,
            'released_at' => $this->released_at,
            'returned_at' => $this->returned_at,
            'released_by' => new UserResource($this->whenLoaded('releasedBy')),
            'received_by' => new UserResource($this->whenLoaded('receivedBy')),
            'condition_on_release' => $this->condition_on_release,
            'condition_on_return' => $this->condition_on_return,
            'remarks' => $this->remarks,
            'status' => $this->status,
            'equipment_request' => new EquipmentRequestResource($this->whenLoaded('equipmentRequest')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
