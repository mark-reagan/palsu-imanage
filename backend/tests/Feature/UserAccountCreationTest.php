<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserAccountCreationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_cannot_create_a_user_when_password_confirmation_does_not_match(): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/users', [
                'name' => 'New Faculty Member',
                'email' => 'faculty@example.edu',
                'password' => 'secure-password',
                'password_confirmation' => 'different-password',
                'role' => 'faculty',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('password');

        $this->assertDatabaseMissing('users', ['email' => 'faculty@example.edu']);
    }

    public function test_admin_can_create_a_user_when_password_confirmation_matches(): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/users', [
                'name' => 'New Faculty Member',
                'email' => 'faculty@example.edu',
                'password' => 'secure-password',
                'password_confirmation' => 'secure-password',
                'role' => 'faculty',
            ])
            ->assertCreated()
            ->assertJsonPath('data.email', 'faculty@example.edu');

        $this->assertDatabaseHas('users', ['email' => 'faculty@example.edu']);
    }

    private function createAdmin(): User
    {
        return User::create([
            'name' => 'Administrator',
            'email' => 'admin@example.edu',
            'password' => Hash::make('admin-password'),
            'role' => 'admin',
            'is_active' => true,
        ]);
    }
}