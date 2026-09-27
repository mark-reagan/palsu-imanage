<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\RequestStatusNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class NotificationFeedTest extends TestCase
{
    use RefreshDatabase;

    public function test_notification_history_is_paginated_and_scoped_to_the_authenticated_user(): void
    {
        $user = $this->createUser('faculty@example.edu');
        $otherUser = $this->createUser('other@example.edu');

        foreach (range(1, 21) as $number) {
            $user->notifications()->create([
                'id' => (string) Str::uuid(),
                'type' => 'test-notification',
                'data' => ['title' => "Notification {$number}"],
            ]);
        }

        $otherUser->notifications()->create([
            'id' => (string) Str::uuid(),
            'type' => 'test-notification',
            'data' => ['title' => 'Private notification'],
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/notifications')
            ->assertOk()
            ->assertJsonCount(20, 'data')
            ->assertJsonPath('total', 21)
            ->assertJsonMissing(['title' => 'Private notification']);
    }

    public function test_notifications_broadcast_on_the_recipients_private_user_channel(): void
    {
        $user = $this->createUser('recipient@example.edu');
        $broadcastEvent = 'Illuminate\\Notifications\\Events\\BroadcastNotificationCreated';
        Event::fake([$broadcastEvent]);

        $user->notify(new RequestStatusNotification('equipment', 42, 'approved'));

        Event::assertDispatched(
            $broadcastEvent,
            fn ($event): bool =>
                $event->broadcastOn()[0]->name === 'private-App.Models.User.'.$user->id
                && $event->broadcastWith()['request_id'] === 42,
        );
    }

    private function createUser(string $email): User
    {
        return User::create([
            'name' => 'Notification Recipient',
            'email' => $email,
            'password' => Hash::make('secure-password'),
            'role' => 'faculty',
            'is_active' => true,
        ]);
    }
}