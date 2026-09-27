<?php

namespace Tests\Feature;

use App\Models\Equipment;
use App\Models\EquipmentRequest;
use App\Models\Supply;
use App\Models\SupplyRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class Phase7ActorAndRoleTest extends TestCase
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

    public function test_admin_can_release_approved_equipment_and_actor_is_returned(): void
    {
        $admin = $this->user('admin', 'phase7-admin-eq@example.edu');
        $faculty = $this->user('faculty', 'phase7-faculty-eq@example.edu');
        $equipment = Equipment::create([
            'name' => 'Projector',
            'asset_code' => 'P7-EQ-001',
            'total_quantity' => 1,
            'available_quantity' => 0,
            'condition' => 'good',
            'status' => 'unavailable',
        ]);
        $request = EquipmentRequest::create([
            'user_id' => $faculty->id,
            'equipment_id' => $equipment->id,
            'quantity' => 1,
            'start_date' => now()->addDay(),
            'end_date' => now()->addDays(2),
            'status' => 'approved',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/equipment-requests/{$request->id}/release");

        $response->assertCreated()
            ->assertJsonPath('data.released_by.id', $admin->id)
            ->assertJsonPath('data.released_by.name', $admin->name);
        $this->assertDatabaseHas('equipment_requests', [
            'id' => $request->id,
            'status' => 'released',
        ]);

        $transactionId = $response->json('data.id');
        $returnResponse = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/equipment-transactions/{$transactionId}/return", [
                'condition_on_return' => 'good',
                'remarks' => 'Returned after test.',
            ]);

        $returnResponse->assertOk()
            ->assertJsonPath('data.received_by.id', $admin->id)
            ->assertJsonPath('data.received_by.name', $admin->name);
        $this->assertDatabaseHas('equipment_requests', [
            'id' => $request->id,
            'status' => 'completed',
        ]);
    }

    public function test_admin_can_release_approved_supply_and_actor_is_returned(): void
    {
        $admin = $this->user('admin', 'phase7-admin-supply@example.edu');
        $faculty = $this->user('faculty', 'phase7-faculty-supply@example.edu');
        $supply = Supply::create([
            'name' => 'Bond Paper',
            'unit' => 'ream',
            'stock_quantity' => 5,
            'reorder_level' => 1,
            'is_active' => true,
        ]);
        $request = SupplyRequest::create([
            'user_id' => $faculty->id,
            'supply_id' => $supply->id,
            'quantity' => 2,
            'purpose' => 'Testing',
            'status' => 'approved',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/supply-requests/{$request->id}/release");

        $response->assertCreated()
            ->assertJsonPath('data.released_by.id', $admin->id)
            ->assertJsonPath('data.released_by.name', $admin->name);
        $this->assertDatabaseHas('supplies', [
            'id' => $supply->id,
            'stock_quantity' => 3,
        ]);
    }

    public function test_faculty_cannot_release_approved_requests(): void
    {
        $faculty = $this->user('faculty', 'phase7-faculty-denied@example.edu');
        $equipment = Equipment::create([
            'name' => 'Speaker',
            'asset_code' => 'P7-EQ-002',
            'total_quantity' => 1,
            'available_quantity' => 0,
            'condition' => 'good',
            'status' => 'unavailable',
        ]);
        $request = EquipmentRequest::create([
            'user_id' => $faculty->id,
            'equipment_id' => $equipment->id,
            'quantity' => 1,
            'start_date' => now()->addDay(),
            'end_date' => now()->addDays(2),
            'status' => 'approved',
        ]);

        $this->actingAs($faculty, 'sanctum')
            ->postJson("/api/v1/equipment-requests/{$request->id}/release")
            ->assertForbidden();
    }

    public function test_admin_release_access_does_not_grant_staff_barcode_scanning_permission(): void
    {
        $admin = $this->user('admin', 'phase7-admin-scan@example.edu');

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/barcode/scan', ['barcode' => 'EQ-UNKNOWN'])
            ->assertForbidden();
    }
}
