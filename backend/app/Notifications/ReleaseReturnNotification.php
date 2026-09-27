<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ReleaseReturnNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $itemType,   // equipment | supply
        public int $requestId,
        public string $event,      // released | returned
        public ?string $itemName = null,
    ) {}

    public function via($notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray($notifiable): array
    {
        return [
            'title' => ucfirst($this->itemType).' '.$this->event,
            'item_type' => $this->itemType,
            'request_id' => $this->requestId,
            'item_name' => $this->itemName,
            'event' => $this->event,
        ];
    }
}
