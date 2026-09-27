<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DeclineRequest;
use App\Http\Requests\StoreSupplyRequestRequest;
use App\Http\Resources\SupplyRequestResource;
use App\Models\Supply;
use App\Models\SupplyRequest;
use App\Models\User;
use App\Notifications\AwaitingReleaseNotification;
use App\Notifications\NewRequestNotification;
use App\Notifications\RequestStatusNotification;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Supply Request workflow. Only Faculty may request supplies.
 */
class SupplyRequestController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = SupplyRequest::with(['supply', 'user', 'approver', 'transaction.releasedBy']);

        if (! in_array($user->role, ['admin', 'staff'], true)) {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return SupplyRequestResource::collection($query->orderByDesc('id')->paginate(20));
    }

    public function show(Request $request, SupplyRequest $supplyRequest)
    {
        $user = $request->user();
        if (! in_array($user->role, ['admin', 'staff'], true) && $supplyRequest->user_id !== $user->id) {
            abort(403, 'You may only view your own requests.');
        }

        return new SupplyRequestResource($supplyRequest->load(['supply', 'user', 'approver', 'transaction.releasedBy']));
    }

    public function store(StoreSupplyRequestRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        if ($request->filled('items')) {
            $requests = collect();

            foreach ($data['items'] as $item) {
                $supply = Supply::findOrFail($item['supply_id']);

                if (! $supply->is_active) {
                    return response()->json(['message' => "This supply item is not available: {$supply->name}.",], 422);
                }

                if ($item['quantity'] > $supply->stock_quantity) {
                    throw ValidationException::withMessages([
                        'items' => ["Only {$supply->stock_quantity} unit(s) currently in stock for {$supply->name}.",],
                    ]);
                }

                $requests->push([
                    'supply' => $supply,
                    'item' => $item,
                ]);
            }

            $created = collect();
            foreach ($requests as $requestEntry) {
                $supply = $requestEntry['supply'];
                $item = $requestEntry['item'];

                $supplyRequest = SupplyRequest::create([
                    'user_id' => $user->id,
                    'supply_id' => $supply->id,
                    'quantity' => $item['quantity'],
                    'purpose' => $item['purpose'],
                    'status' => 'pending',
                ]);

                User::query()
                    ->where('role', 'admin')
                    ->where('is_active', true)
                    ->get()
                    ->each(fn (User $admin) => $admin->notify(new NewRequestNotification(
                        'supply',
                        $supplyRequest->id,
                        $supply->name,
                        $user->name,
                    )));

                $created->push($supplyRequest->fresh(['supply']));
            }

            return response()->json([
                'message' => 'Supply requests created successfully.',
                'data' => $created->map(fn (SupplyRequest $item) => new SupplyRequestResource($item))->values()->all(),
            ], 201);
        }

        $supply = Supply::findOrFail($data['supply_id']);

        if (! $supply->is_active) {
            return response()->json(['message' => 'This supply item is not available.'], 422);
        }

        if ($data['quantity'] > $supply->stock_quantity) {
            throw ValidationException::withMessages([
                'quantity' => "Only {$supply->stock_quantity} unit(s) currently in stock.",
            ]);
        }

        $supplyRequest = SupplyRequest::create([
            'user_id' => $user->id,
            'supply_id' => $supply->id,
            'quantity' => $data['quantity'],
            'purpose' => $data['purpose'],
            'status' => 'pending',
        ]);

        User::query()
            ->where('role', 'admin')
            ->where('is_active', true)
            ->get()
            ->each(fn (User $admin) => $admin->notify(new NewRequestNotification(
                'supply',
                $supplyRequest->id,
                $supply->name,
                $user->name,
            )));

        return (new SupplyRequestResource($supplyRequest->load('supply')))->response()->setStatusCode(201);
    }

    public function approve(Request $request, SupplyRequest $supplyRequest)
    {
        if ($supplyRequest->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be approved.'], 422);
        }

        if ($supplyRequest->quantity > $supplyRequest->supply->stock_quantity) {
            return response()->json(['message' => 'Insufficient stock to approve this request.'], 422);
        }

        $supplyRequest->update([
            'status' => 'approved',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        $supplyRequest->user->notify(new RequestStatusNotification(
            'supply', $supplyRequest->id, 'approved', null, $supplyRequest->supply->name
        ));

        User::query()
            ->whereIn('role', ['admin', 'staff'])
            ->where('is_active', true)
            ->get()
            ->each(fn (User $recipient) => $recipient->notify(new AwaitingReleaseNotification(
                'supply',
                $supplyRequest->id,
                $supplyRequest->supply->name,
            )));

        return new SupplyRequestResource($supplyRequest->fresh(['supply', 'approver']));
    }

    public function decline(DeclineRequest $request, SupplyRequest $supplyRequest)
    {
        if ($supplyRequest->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be declined.'], 422);
        }

        $data = $request->validated();

        $supplyRequest->update([
            'status' => 'declined',
            'decline_reason' => $data['decline_reason'],
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        $supplyRequest->user->notify(new RequestStatusNotification(
            'supply', $supplyRequest->id, 'declined', $data['decline_reason'], $supplyRequest->supply->name
        ));

        return new SupplyRequestResource($supplyRequest->fresh(['approver']));
    }

    public function cancel(Request $request, SupplyRequest $supplyRequest)
    {
        $user = $request->user();
        if ($supplyRequest->user_id !== $user->id) {
            return response()->json(['message' => 'You may only cancel your own requests.'], 403);
        }
        if ($supplyRequest->status !== 'pending') {
            return response()->json(['message' => 'This request can no longer be cancelled.'], 422);
        }

        $supplyRequest->update(['status' => 'cancelled']);

        return new SupplyRequestResource($supplyRequest->fresh());
    }
}
