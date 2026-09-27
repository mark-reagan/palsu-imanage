<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ConcernNotification extends Notification
{
    use Queueable;

    public function __construct(
        public int $concernId,
        public string $equipmentName,
        public string $status, // reported | reviewed | resolved
    ) {}

    public function via($notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray($notifiable): array
    {
        return [
            'title' => 'Equipment concern '.$this->status,
            'concern_id' => $this->concernId,
            'equipment_name' => $this->equipmentName,
            'status' => $this->status,
        ];
    }
}
