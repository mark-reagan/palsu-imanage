<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewRequestNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $requestType,
        public int $requestId,
        public string $itemName,
        public string $requesterName,
    ) {}

    public function via($notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray($notifiable): array
    {
        return [
            'title' => ucfirst($this->requestType).' request received',
            'request_type' => $this->requestType,
            'request_id' => $this->requestId,
            'item_name' => $this->itemName,
            'requester_name' => $this->requesterName,
            'status' => 'pending',
        ];
    }
}