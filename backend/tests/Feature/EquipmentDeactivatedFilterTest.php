<?php

namespace Tests\Feature;

use App\Models\Equipment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class EquipmentDeactivatedFilterTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role): User
    {
        return User::create([
            'name' => ucfirst($role).' User',
            'email' => $role.'-equipment-filter@example.edu',
            'password' => Hash::make('password123'),
            'role' => $role,
            'is_active' => true,
        ]);
    }

    private function equipment(string $name, bool $isActive): Equipment
    {
        return Equipment::create([
            'name' => $name,
            'asset_code' => strtoupper(str_replace(' ', '-', $name)),
            'total_quantity' => 1,
            'available_quantity' => 1,
            'condition' => 'good',
            'status' => 'available',
            'is_active' => $isActive,
        ]);
    }

    public function test_admin_sees_only_deactivated_equipment_when_filter_is_selected(): void
    {
        $admin = $this->user('admin');
        $active = $this->equipment('Active Projector', true);
        $deactivated = $this->equipment('Deactivated Projector', false);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/equipment?deactivated=1')
            ->assertOk()
            ->assertJsonFragment(['id' => $deactivated->id])
            ->assertJsonMissing(['id' => $active->id]);
    }

    public function test_non_admin_cannot_use_deactivated_filter_to_view_inactive_equipment(): void
    {
        $faculty = $this->user('faculty');
        $active = $this->equipment('Faculty Active Equipment', true);
        $deactivated = $this->equipment('Faculty Hidden Equipment', false);

        $this->actingAs($faculty, 'sanctum')
            ->getJson('/api/v1/equipment?deactivated=1')
            ->assertOk()
            ->assertJsonFragment(['id' => $active->id])
            ->assertJsonMissing(['id' => $deactivated->id]);
    }

    public function test_equipment_list_hides_deactivated_items_by_default(): void
    {
        $admin = $this->user('admin');
        $active = $this->equipment('Default Active Equipment', true);
        $deactivated = $this->equipment('Default Hidden Equipment', false);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/equipment')
            ->assertOk()
            ->assertJsonFragment(['id' => $active->id])
            ->assertJsonMissing(['id' => $deactivated->id]);
    }

    public function test_outsider_cannot_use_deactivated_filter_to_view_inactive_equipment(): void
    {
        $outsider = $this->user('outsider', 'equipment-filter-outsider@example.edu');
        $active = $this->equipment('Outsider Active Equipment', true);
        $deactivated = $this->equipment('Outsider Hidden Equipment', false);

        $this->actingAs($outsider, 'sanctum')
            ->getJson('/api/v1/equipment?deactivated=1')
            ->assertOk()
            ->assertJsonFragment(['id' => $active->id])
            ->assertJsonMissing(['id' => $deactivated->id]);
    }
}
