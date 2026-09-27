<?php

namespace Tests\Feature;

use App\Models\Equipment;
use App\Models\Supply;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RequestWorkflowPhase6Test extends TestCase
{
    use RefreshDatabase;

    public function test_faculty_can_submit_multiple_equipment_requests_in_one_batch(): void
    {
        $faculty = User::create([
            'name' => 'Faculty User',
            'email' => 'faculty@example.edu',
            'password' => Hash::make('password123'),
            'role' => 'faculty',
            'is_active' => true,
        ]);

        $equipmentOne = Equipment::create([
            'name' => 'Projector',
            'asset_code' => 'EQ-001',
            'category' => 'AV',
            'total_quantity' => 5,
            'available_quantity' => 5,
            'condition' => 'good',
            'status' => 'available',
        ]);

        $equipmentTwo = Equipment::create([
            'name' => 'Laptop',
            'asset_code' => 'EQ-002',
            'category' => 'IT',
            'total_quantity' => 3,
            'available_quantity' => 3,
            'condition' => 'good',
            'status' => 'available',
        ]);

        $response = $this->actingAs($faculty, 'sanctum')
            ->postJson('/api/v1/equipment-requests', [
                'items' => [
                    [
                        'equipment_id' => $equipmentOne->id,
                        'quantity' => 2,
                        'purpose' => 'Classroom presentation',
                        'start_date' => now()->addDay()->toDateString(),
                        'end_date' => now()->addDays(3)->toDateString(),
                    ],
                    [
                        'equipment_id' => $equipmentTwo->id,
                        'quantity' => 1,
                        'purpose' => 'Faculty reporting',
                        'start_date' => now()->addDay()->toDateString(),
                        'end_date' => now()->addDays(2)->toDateString(),
                    ],
                ],
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.0.equipment.id', $equipmentOne->id)
            ->assertJsonPath('data.1.equipment.id', $equipmentTwo->id)
            ->assertJsonCount(2, 'data');

        $this->assertDatabaseHas('equipment_requests', ['user_id' => $faculty->id, 'equipment_id' => $equipmentOne->id]);
        $this->assertDatabaseHas('equipment_requests', ['user_id' => $faculty->id, 'equipment_id' => $equipmentTwo->id]);
    }

    public function test_faculty_can_submit_multiple_supply_requests_in_one_batch(): void
    {
        $faculty = User::create([
            'name' => 'Faculty User',
            'email' => 'faculty2@example.edu',
            'password' => Hash::make('password123'),
            'role' => 'faculty',
            'is_active' => true,
        ]);

        $supplyOne = Supply::create([
            'name' => 'Bond Paper',
            'category' => 'Paper',
            'unit' => 'pack',
            'stock_quantity' => 10,
            'reorder_level' => 2,
            'is_active' => true,
        ]);

        $supplyTwo = Supply::create([
            'name' => 'Marker',
            'category' => 'Office',
            'unit' => 'pcs',
            'stock_quantity' => 8,
            'reorder_level' => 2,
            'is_active' => true,
        ]);

        $response = $this->actingAs($faculty, 'sanctum')
            ->postJson('/api/v1/supply-requests', [
                'items' => [
                    [
                        'supply_id' => $supplyOne->id,
                        'quantity' => 2,
                        'purpose' => 'Exam materials',
                    ],
                    [
                        'supply_id' => $supplyTwo->id,
                        'quantity' => 3,
                        'purpose' => 'Session needs',
                    ],
                ],
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.0.supply.id', $supplyOne->id)
            ->assertJsonPath('data.1.supply.id', $supplyTwo->id)
            ->assertJsonCount(2, 'data');

        $this->assertDatabaseHas('supply_requests', ['user_id' => $faculty->id, 'supply_id' => $supplyOne->id]);
        $this->assertDatabaseHas('supply_requests', ['user_id' => $faculty->id, 'supply_id' => $supplyTwo->id]);
    }
}
