<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class RequestStatusNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $requestType,   // 'equipment' | 'supply'
        public int $requestId,
        public string $status,        // approved | declined
        public ?string $reason = null,
        public ?string $itemName = null,
    ) {}

    public function via($notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray($notifiable): array
    {
        return [
            'title' => ucfirst($this->requestType).' request '.$this->status,
            'request_type' => $this->requestType,
            'request_id' => $this->requestId,
            'item_name' => $this->itemName,
            'status' => $this->status,
            'reason' => $this->reason,
        ];
    }
}
