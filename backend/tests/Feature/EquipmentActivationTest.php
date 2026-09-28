<?php

namespace Tests\Feature;

use App\Models\Equipment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class EquipmentActivationTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role, string $email): User
    {
        return User::create([
            'name' => ucfirst($role).' User',
            'email' => $email,
            'password' => Hash::make('password123'),
            'role' => $role,
            'is_active' => true,
        ]);
    }

    public function test_admin_can_activate_deactivated_equipment(): void
    {
        $admin = $this->user('admin', 'activate-equipment-admin@example.edu');
        $equipment = Equipment::create([
            'name' => 'Test Projector',
            'asset_code' => 'ACT-EQ-001',
            'total_quantity' => 1,
            'available_quantity' => 1,
            'condition' => 'good',
            'status' => 'available',
            'is_active' => false,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/equipment/{$equipment->id}/activate")
            ->assertOk()
            ->assertJsonPath('data.is_active', true)
            ->assertJsonPath('message', 'Equipment activated.');

        $this->assertDatabaseHas('equipment', [
            'id' => $equipment->id,
            'is_active' => true,
        ]);
    }

    public function test_non_admin_cannot_activate_equipment(): void
    {
        $faculty = $this->user('faculty', 'activate-equipment-faculty@example.edu');
        $equipment = Equipment::create([
            'name' => 'Hidden Projector',
            'asset_code' => 'ACT-EQ-002',
            'total_quantity' => 1,
            'available_quantity' => 1,
            'condition' => 'good',
            'status' => 'available',
            'is_active' => false,
        ]);

        $this->actingAs($faculty, 'sanctum')
            ->postJson("/api/v1/equipment/{$equipment->id}/activate")
            ->assertForbidden();

        $this->assertDatabaseHas('equipment', [
            'id' => $equipment->id,
            'is_active' => false,
        ]);
    }
}
