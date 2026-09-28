<?php

namespace Tests\Feature;

use App\Models\Equipment;
use App\Models\EquipmentRequest;
use App\Models\EquipmentTransaction;
use App\Models\Supply;
use App\Models\SupplyRequest;
use App\Models\SupplyTransaction;
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

    public function test_public_request_tracking_includes_approver_and_releaser_names(): void
    {
        $admin = $this->user('admin', 'phase7-tracking-admin@example.edu');
        $staff = $this->user('staff', 'phase7-tracking-staff@example.edu');
        $faculty = $this->user('faculty', 'phase7-tracking-faculty@example.edu');
        $equipment = Equipment::create([
            'name' => 'Smart TV',
            'asset_code' => 'P7-TRACK-001',
            'total_quantity' => 1,
            'available_quantity' => 0,
            'condition' => 'good',
            'status' => 'unavailable',
        ]);
        $request = EquipmentRequest::create([
            'user_id' => $faculty->id,
            'equipment_id' => $equipment->id,
            'quantity' => 1,
            'purpose' => 'Class presentation',
            'start_date' => now()->subDay(),
            'end_date' => now()->addDay(),
            'status' => 'released',
            'approved_by' => $admin->id,
            'approved_at' => now()->subDay(),
        ]);
        EquipmentTransaction::create([
            'equipment_request_id' => $request->id,
            'released_by' => $staff->id,
            'released_at' => now(),
            'condition_on_release' => 'good',
            'status' => 'released',
        ]);

        $this->getJson("/api/v1/public/requests/{$request->tracking_token}")
            ->assertOk()
            ->assertJsonPath('request.user.name', $faculty->name)
            ->assertJsonPath('request.approver.name', $admin->name)
            ->assertJsonPath('request.transaction.released_by.name', $staff->name);
    }

    public function test_reports_include_request_and_transaction_actor_attribution(): void
    {
        $admin = $this->user('admin', 'phase8-report-admin@example.edu');
        $staff = $this->user('staff', 'phase8-report-staff@example.edu');
        $receiver = $this->user('staff', 'phase8-report-receiver@example.edu');
        $faculty = $this->user('faculty', 'phase8-report-faculty@example.edu');

        $equipment = Equipment::create([
            'name' => 'Report Projector',
            'asset_code' => 'P8-EQ-001',
            'total_quantity' => 1,
            'available_quantity' => 0,
            'condition' => 'good',
            'status' => 'unavailable',
        ]);
        $equipmentRequest = EquipmentRequest::create([
            'user_id' => $faculty->id,
            'equipment_id' => $equipment->id,
            'quantity' => 1,
            'purpose' => 'Report test',
            'start_date' => now()->subDay(),
            'end_date' => now()->addDay(),
            'status' => 'completed',
            'approved_by' => $admin->id,
            'approved_at' => now()->subDays(2),
        ]);
        EquipmentTransaction::create([
            'equipment_request_id' => $equipmentRequest->id,
            'released_by' => $staff->id,
            'released_at' => now()->subDay(),
            'received_by' => $receiver->id,
            'returned_at' => now(),
            'condition_on_release' => 'good',
            'condition_on_return' => 'good',
            'status' => 'returned',
        ]);

        $supply = Supply::create([
            'name' => 'Report Paper',
            'unit' => 'ream',
            'stock_quantity' => 3,
            'reorder_level' => 1,
            'is_active' => true,
        ]);
        $supplyRequest = SupplyRequest::create([
            'user_id' => $faculty->id,
            'supply_id' => $supply->id,
            'quantity' => 2,
            'purpose' => 'Report test',
            'status' => 'completed',
            'approved_by' => $admin->id,
            'approved_at' => now()->subDay(),
        ]);
        SupplyTransaction::create([
            'supply_request_id' => $supplyRequest->id,
            'released_by' => $staff->id,
            'quantity_released' => 2,
            'released_at' => now(),
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/reports/transactions')
            ->assertOk()
            ->assertJsonFragment(['name' => $admin->name])
            ->assertJsonFragment(['name' => $staff->name])
            ->assertJsonFragment(['name' => $receiver->name]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/reports/supply-usage')
            ->assertOk()
            ->assertJsonFragment(['name' => $admin->name])
            ->assertJsonFragment(['name' => $staff->name]);
    }

    public function test_equipment_request_list_can_search_requester_item_reviewer_and_qr_code(): void
    {
        $admin = $this->user('admin', 'request-search-admin@example.edu');
        $faculty = $this->user('faculty', 'request-search-faculty@example.edu');
        $reviewer = $this->user('admin', 'request-search-reviewer@example.edu');
        $equipment = Equipment::create([
            'name' => 'Search Projector',
            'asset_code' => 'SEARCH-EQ-001',
            'barcode' => 'SEARCH-EQ-BARCODE',
            'total_quantity' => 1,
            'available_quantity' => 1,
            'condition' => 'good',
            'status' => 'available',
        ]);
        $request = EquipmentRequest::create([
            'user_id' => $faculty->id,
            'equipment_id' => $equipment->id,
            'quantity' => 1,
            'purpose' => 'Search test',
            'start_date' => now()->addDay(),
            'end_date' => now()->addDays(2),
            'status' => 'approved',
            'approved_by' => $reviewer->id,
            'approved_at' => now(),
        ]);

        foreach ([
            ['search_by' => 'requester', 'search' => 'Faculty User'],
            ['search_by' => 'item', 'search' => 'SEARCH-EQ-BARCODE'],
            ['search_by' => 'reviewer', 'search' => 'Admin User'],
            ['search_by' => 'qr', 'search' => $request->tracking_token],
        ] as $filters) {
            $this->actingAs($admin, 'sanctum')
                ->getJson('/api/v1/equipment-requests?'.http_build_query($filters))
                ->assertOk()
                ->assertJsonPath('data.0.id', $request->id);
        }
    }

    public function test_supply_request_list_can_search_requester_item_reviewer_and_qr_code(): void
    {
        $admin = $this->user('admin', 'supply-search-admin@example.edu');
        $faculty = $this->user('faculty', 'supply-search-faculty@example.edu');
        $reviewer = $this->user('admin', 'supply-search-reviewer@example.edu');
        $supply = Supply::create([
            'name' => 'Search Paper',
            'barcode' => 'SEARCH-SUP-BARCODE',
            'unit' => 'ream',
            'stock_quantity' => 20,
            'reorder_level' => 2,
        ]);
        $request = SupplyRequest::create([
            'user_id' => $faculty->id,
            'supply_id' => $supply->id,
            'quantity' => 2,
            'purpose' => 'Search test',
            'status' => 'approved',
            'approved_by' => $reviewer->id,
            'approved_at' => now(),
        ]);

        foreach ([
            ['search_by' => 'requester', 'search' => 'Faculty User'],
            ['search_by' => 'item', 'search' => 'SEARCH-SUP-BARCODE'],
            ['search_by' => 'reviewer', 'search' => 'Admin User'],
            ['search_by' => 'qr', 'search' => $request->tracking_token],
        ] as $filters) {
            $this->actingAs($admin, 'sanctum')
                ->getJson('/api/v1/supply-requests?'.http_build_query($filters))
                ->assertOk()
                ->assertJsonPath('data.0.id', $request->id);
        }
    }
}
