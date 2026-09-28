<?php

namespace Tests\Feature;

use App\Models\Equipment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ConcernReportHistoryTest extends TestCase
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

    public function test_concern_report_keeps_every_report_and_review_save(): void
    {
        $admin = $this->user('admin', 'concern-history-admin@example.edu');
        $faculty = $this->user('faculty', 'concern-history-faculty@example.edu');
        $equipment = Equipment::create([
            'name' => 'History Projector',
            'asset_code' => 'CH-001',
            'total_quantity' => 1,
            'available_quantity' => 1,
            'condition' => 'good',
            'status' => 'available',
        ]);

        $report = $this->actingAs($faculty, 'sanctum')
            ->postJson('/api/v1/concerns', [
                'equipment_id' => $equipment->id,
                'description' => 'The lens is cracked.',
                'severity' => 'major',
            ])
            ->assertCreated();

        $concernId = $report->json('data.id');

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/concerns/{$concernId}/review", [
                'status' => 'reviewed',
                'admin_remarks' => 'Initial inspection completed.',
            ])
            ->assertOk();

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/concerns/{$concernId}/review", [
                'status' => 'resolved',
                'admin_remarks' => 'Lens replaced; tested and working.',
            ])
            ->assertOk();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/reports/concerns')
            ->assertOk()
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('data.0.admin_remarks', 'Lens replaced; tested and working.')
            ->assertJsonPath('data.1.admin_remarks', 'Initial inspection completed.')
            ->assertJsonPath('data.2.action', 'reported');
    }

    public function test_non_admin_cannot_access_concern_report_history(): void
    {
        $faculty = $this->user('faculty', 'concern-history-reader@example.edu');

        $this->actingAs($faculty, 'sanctum')
            ->getJson('/api/v1/reports/concerns')
            ->assertForbidden();
    }
}
