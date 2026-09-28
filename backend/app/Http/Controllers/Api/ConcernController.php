<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReviewConcernRequest;
use App\Http\Requests\StoreConcernRequest;
use App\Http\Resources\ConcernResource;
use App\Models\Equipment;
use App\Models\EquipmentConcern;
use App\Models\EquipmentConcernHistory;
use App\Models\User;
use App\Notifications\ConcernNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

/**
 * Damage & Concern Management.
 * Faculty, Outsiders and Staff may report a concern. Admin reviews and
 * updates the equipment's official condition.
 */
class ConcernController extends Controller
{
    public function index(Request $request)
    {
        $query = EquipmentConcern::with(['equipment', 'reporter', 'reviewer']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return ConcernResource::collection($query->orderByDesc('id')->paginate(20));
    }

    public function store(StoreConcernRequest $request)
    {
        $data = $request->validated();

        $data['reported_by'] = $request->user()->id;

        $concern = DB::transaction(function () use ($data, $request) {
            $concern = EquipmentConcern::create($data);
            $this->recordHistory($concern, 'reported', $request->user());

            return $concern;
        });
        $equipment = $concern->equipment;

        User::query()
            ->where('role', 'admin')
            ->where('is_active', true)
            ->get()
            ->each(fn (User $admin) => $admin->notify(new ConcernNotification(
                $concern->id, $equipment->name, 'reported', $request->user()->name
            )));

        return (new ConcernResource($concern->load('equipment')))->response()->setStatusCode(201);
    }

    public function show(EquipmentConcern $concern)
    {
        return new ConcernResource($concern->load(['equipment', 'reporter', 'reviewer', 'transaction']));
    }

    /**
     * Admin-only: review the concern and optionally update the equipment condition.
     */
    public function review(ReviewConcernRequest $request, EquipmentConcern $concern)
    {
        $data = $request->validated();

        DB::transaction(function () use ($concern, $data, $request) {
            $concern->update([
                'status' => $data['status'],
                'admin_remarks' => $data['admin_remarks'] ?? null,
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);

            if (! empty($data['update_condition'])) {
                $equipment = $concern->equipment;
                $equipment->condition = $data['update_condition'];
                $equipment->save();
            }

            $this->recordHistory($concern, $data['status'], $request->user());
        });

        $concern->reporter->notify(new ConcernNotification(
            $concern->id, $concern->equipment->name, $data['status'], $request->user()->name
        ));

        return new ConcernResource($concern->fresh(['equipment']));
    }

    private function recordHistory(EquipmentConcern $concern, string $action, User $actor): void
    {
        $concern->loadMissing(['equipment', 'reporter']);

        EquipmentConcernHistory::create([
            'concern_id' => $concern->id,
            'action' => $action,
            'equipment_name' => $concern->equipment->name,
            'asset_code' => $concern->equipment->asset_code,
            'reporter_name' => $concern->reporter->name,
            'description' => $concern->description,
            'severity' => $concern->severity,
            'status' => $concern->status ?? 'open',
            'admin_remarks' => $concern->admin_remarks,
            'actor_name' => $actor->name,
            'actor_role' => $actor->role,
            'created_at' => now(),
        ]);
    }
}
