<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DeclineRequest;
use App\Http\Requests\StoreEquipmentReservationRequest;
use App\Http\Resources\EquipmentRequestResource;
use App\Models\Equipment;
use App\Models\EquipmentRequest;
use App\Models\User;
use App\Notifications\AwaitingReleaseNotification;
use App\Notifications\NewRequestNotification;
use App\Notifications\RequestStatusNotification;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Equipment Request & Reservation workflow.
 * Faculty and Outsiders/LGU may request+reserve equipment.
 * Admin approves/declines. Staff performs the physical release/return (see ReleaseReturnController).
 */
class EquipmentRequestController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = EquipmentRequest::with(['equipment', 'user', 'approver', 'transaction.releasedBy', 'transaction.receivedBy']);

        // Faculty/outsiders only see their own requests. Admin/staff see all.
        if (in_array($user->role, ['faculty', 'outsider'], true)) {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $search = trim((string) $request->query('search', ''));
        $searchBy = $request->query('search_by');
        if ($search !== '') {
            if ($searchBy === 'qr' && str_contains($search, '/track/')) {
                $search = basename((string) parse_url($search, PHP_URL_PATH));
            }

            match ($searchBy) {
                'requester' => $query->whereHas('user', fn ($userQuery) => $userQuery->where('name', 'like', "%{$search}%")),
                'item' => $query->whereHas('equipment', fn ($equipmentQuery) => $equipmentQuery
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('asset_code', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%")),
                'reviewer' => $query->whereHas('approver', fn ($approverQuery) => $approverQuery->where('name', 'like', "%{$search}%")),
                'qr' => $query->where('tracking_token', 'like', "%{$search}%"),
                default => $query->where(function ($searchQuery) use ($search) {
                    $searchQuery->whereHas('user', fn ($userQuery) => $userQuery->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('equipment', fn ($equipmentQuery) => $equipmentQuery->where('name', 'like', "%{$search}%"))
                        ->orWhere('tracking_token', 'like', "%{$search}%");
                }),
            };
        }

        return EquipmentRequestResource::collection($query->orderByDesc('id')->paginate(20));
    }

    public function show(Request $request, EquipmentRequest $equipmentRequest)
    {
        $this->authorizeOwnerOrStaffAdmin($request, $equipmentRequest);

        return new EquipmentRequestResource($equipmentRequest->load(['equipment', 'user', 'approver', 'transaction.releasedBy', 'transaction.receivedBy']));
    }

    public function store(StoreEquipmentReservationRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        if ($request->filled('items')) {
            $requests = collect();

            foreach ($data['items'] as $item) {
                $equipment = Equipment::findOrFail($item['equipment_id']);

                if (! $equipment->is_active) {
                    return response()->json(['message' => "This equipment is not available for request: {$equipment->name}.",], 422);
                }

                if ($item['quantity'] > $equipment->available_quantity) {
                    throw ValidationException::withMessages([
                        'items' => ["Only {$equipment->available_quantity} unit(s) currently available for {$equipment->name}.",],
                    ]);
                }

                $requests->push([
                    'equipment' => $equipment,
                    'item' => $item,
                ]);
            }

            $created = collect();
            foreach ($requests as $requestEntry) {
                $equipment = $requestEntry['equipment'];
                $item = $requestEntry['item'];

                $equipmentRequest = EquipmentRequest::create([
                    'user_id' => $user->id,
                    'equipment_id' => $equipment->id,
                    'quantity' => $item['quantity'],
                    'purpose' => $item['purpose'],
                    'start_date' => $item['start_date'],
                    'end_date' => $item['end_date'],
                    'status' => 'pending',
                ]);

                User::query()
                    ->where('role', 'admin')
                    ->where('is_active', true)
                    ->get()
                    ->each(fn (User $admin) => $admin->notify(new NewRequestNotification(
                        'equipment',
                        $equipmentRequest->id,
                        $equipment->name,
                        $user->name,
                    )));

                $created->push($equipmentRequest->fresh(['equipment']));
            }

            return response()->json([
                'message' => 'Equipment requests created successfully.',
                'data' => $created->map(fn (EquipmentRequest $item) => new EquipmentRequestResource($item))->values()->all(),
            ], 201);
        }

        $equipment = Equipment::findOrFail($data['equipment_id']);

        if (! $equipment->is_active) {
            return response()->json(['message' => 'This equipment is not available for request.'], 422);
        }

        if ($data['quantity'] > $equipment->available_quantity) {
            throw ValidationException::withMessages([
                'quantity' => "Only {$equipment->available_quantity} unit(s) currently available.",
            ]);
        }

        $equipmentRequest = EquipmentRequest::create([
            'user_id' => $user->id,
            'equipment_id' => $equipment->id,
            'quantity' => $data['quantity'],
            'purpose' => $data['purpose'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'status' => 'pending',
        ]);

        User::query()
            ->where('role', 'admin')
            ->where('is_active', true)
            ->get()
            ->each(fn (User $admin) => $admin->notify(new NewRequestNotification(
                'equipment',
                $equipmentRequest->id,
                $equipment->name,
                $user->name,
            )));

        return (new EquipmentRequestResource($equipmentRequest->load('equipment')))->response()->setStatusCode(201);
    }

    public function approve(Request $request, EquipmentRequest $equipmentRequest)
    {
        if ($equipmentRequest->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be approved.'], 422);
        }

        $equipment = $equipmentRequest->equipment;
        if ($equipmentRequest->quantity > $equipment->available_quantity) {
            return response()->json(['message' => 'Insufficient available quantity to approve this request.'], 422);
        }

        $equipmentRequest->update([
            'status' => 'approved',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        // Reserve the stock so it can't be double-booked while awaiting release.
        $equipment->decrement('available_quantity', $equipmentRequest->quantity);
        $equipment->refreshStatus();

        $equipmentRequest->user->notify(new RequestStatusNotification(
            'equipment', $equipmentRequest->id, 'approved', null, $equipment->name, $request->user()->name
        ));

        User::query()
            ->whereIn('role', ['admin', 'staff'])
            ->where('is_active', true)
            ->get()
            ->each(fn (User $recipient) => $recipient->notify(new AwaitingReleaseNotification(
                'equipment',
                $equipmentRequest->id,
                $equipment->name,
                $request->user()->name,
            )));

        return new EquipmentRequestResource($equipmentRequest->fresh(['equipment', 'approver']));
    }

    public function decline(DeclineRequest $request, EquipmentRequest $equipmentRequest)
    {
        if ($equipmentRequest->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be declined.'], 422);
        }

        $data = $request->validated();

        $equipmentRequest->update([
            'status' => 'declined',
            'decline_reason' => $data['decline_reason'],
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        $equipmentRequest->user->notify(new RequestStatusNotification(
            'equipment', $equipmentRequest->id, 'declined', $data['decline_reason'], $equipmentRequest->equipment->name, $request->user()->name
        ));

        return new EquipmentRequestResource($equipmentRequest->fresh(['approver']));
    }

    public function cancel(Request $request, EquipmentRequest $equipmentRequest)
    {
        $user = $request->user();
        if ($equipmentRequest->user_id !== $user->id) {
            return response()->json(['message' => 'You may only cancel your own requests.'], 403);
        }
        if (! in_array($equipmentRequest->status, ['pending', 'approved'], true)) {
            return response()->json(['message' => 'This request can no longer be cancelled.'], 422);
        }

        if ($equipmentRequest->status === 'approved') {
            // release the reserved stock back
            $equipmentRequest->equipment->increment('available_quantity', $equipmentRequest->quantity);
            $equipmentRequest->equipment->refreshStatus();
        }

        $equipmentRequest->update(['status' => 'cancelled']);

        return new EquipmentRequestResource($equipmentRequest->fresh());
    }

    private function authorizeOwnerOrStaffAdmin(Request $request, EquipmentRequest $equipmentRequest): void
    {
        $user = $request->user();
        if (in_array($user->role, ['faculty', 'outsider'], true) && $equipmentRequest->user_id !== $user->id) {
            abort(403, 'You may only view your own requests.');
        }
    }
}
