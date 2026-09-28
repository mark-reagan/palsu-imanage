<?php

namespace Tests\Feature;

use App\Models\Supply;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SupplyDeactivatedFilterTest extends TestCase
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

    private function supply(string $name, bool $isActive): Supply
    {
        return Supply::create([
            'name' => $name,
            'unit' => 'pcs',
            'stock_quantity' => 10,
            'reorder_level' => 1,
            'is_active' => $isActive,
        ]);
    }

    public function test_admin_can_filter_to_deactivated_supplies(): void
    {
        $admin = $this->user('admin', 'supply-filter-admin@example.edu');
        $active = $this->supply('Active Paper', true);
        $deactivated = $this->supply('Deactivated Paper', false);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/supplies?deactivated=1')
            ->assertOk()
            ->assertJsonFragment(['id' => $deactivated->id])
            ->assertJsonMissing(['id' => $active->id]);
    }

    public function test_faculty_cannot_use_deactivated_filter_to_view_inactive_supplies(): void
    {
        $faculty = $this->user('faculty', 'supply-filter-faculty@example.edu');
        $active = $this->supply('Faculty Active Paper', true);
        $deactivated = $this->supply('Faculty Hidden Paper', false);

        $this->actingAs($faculty, 'sanctum')
            ->getJson('/api/v1/supplies?deactivated=1')
            ->assertOk()
            ->assertJsonFragment(['id' => $active->id])
            ->assertJsonMissing(['id' => $deactivated->id]);
    }

    public function test_supplies_are_active_only_by_default(): void
    {
        $admin = $this->user('admin', 'supply-filter-default@example.edu');
        $active = $this->supply('Default Active Paper', true);
        $deactivated = $this->supply('Default Hidden Paper', false);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/supplies')
            ->assertOk()
            ->assertJsonFragment(['id' => $active->id])
            ->assertJsonMissing(['id' => $deactivated->id]);
    }

    public function test_admin_can_activate_deactivated_supply(): void
    {
        $admin = $this->user('admin', 'supply-activate-admin@example.edu');
        $supply = $this->supply('Supply to Activate', false);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/supplies/{$supply->id}/activate")
            ->assertOk()
            ->assertJsonPath('data.is_active', true)
            ->assertJsonPath('message', 'Supply activated.');

        $this->assertDatabaseHas('supplies', [
            'id' => $supply->id,
            'is_active' => true,
        ]);
    }

    public function test_non_admin_cannot_activate_supply(): void
    {
        $faculty = $this->user('faculty', 'supply-activate-faculty@example.edu');
        $supply = $this->supply('Hidden Supply', false);

        $this->actingAs($faculty, 'sanctum')
            ->postJson("/api/v1/supplies/{$supply->id}/activate")
            ->assertForbidden();

        $this->assertDatabaseHas('supplies', [
            'id' => $supply->id,
            'is_active' => false,
        ]);
    }
}
