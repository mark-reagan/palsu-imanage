<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AwaitingReleaseNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $itemType,
        public int $requestId,
        public string $itemName,
        public ?string $fromName = null,
    ) {}

    public function via($notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray($notifiable): array
    {
        return [
            'title' => ucfirst($this->itemType).' awaiting release',
            'item_type' => $this->itemType,
            'request_id' => $this->requestId,
            'item_name' => $this->itemName,
            'from_name' => $this->fromName,
            'status' => 'approved',
        ];
    }
}