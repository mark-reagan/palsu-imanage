<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EquipmentRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tracking_token' => $this->tracking_token,
            'tracking_url' => $this->trackingUrl(),
            'qr_url' => $this->qrUrl(),
            'quantity' => $this->quantity,
            'purpose' => $this->purpose,
            'start_date' => $this->start_date,
            'end_date' => $this->end_date,
            'status' => $this->status,
            'decline_reason' => $this->decline_reason,
            'approved_at' => $this->approved_at,
            'approved_by_id' => $this->approved_by,
            'equipment' => new EquipmentResource($this->whenLoaded('equipment')),
            'user' => new UserResource($this->whenLoaded('user')),
            'approver' => new UserResource($this->whenLoaded('approver')),
            'transaction' => $this->whenLoaded('transaction', function () {
                if (! $this->transaction) {
                    return null;
                }

                return [
                    'id' => $this->transaction->id,
                    'released_at' => $this->transaction->released_at,
                    'returned_at' => $this->transaction->returned_at,
                        'released_by' => $this->transaction->relationLoaded('releasedBy')
                            ? new UserResource($this->transaction->releasedBy)
                            : null,
                        'received_by' => $this->transaction->relationLoaded('receivedBy')
                            ? new UserResource($this->transaction->receivedBy)
                            : null,
                ];
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    private function trackingUrl(): ?string
    {
        return $this->tracking_token
            ? rtrim(config('app.frontend_url'), '/').'/track/'.$this->tracking_token
            : null;
    }

    private function qrUrl(): ?string
    {
        return $this->tracking_token
            ? rtrim(config('app.url'), '/').'/api/v1/public/requests/'.$this->tracking_token.'/qr'
            : null;
    }
}
