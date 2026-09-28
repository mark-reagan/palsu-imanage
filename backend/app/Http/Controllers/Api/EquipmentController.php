<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEquipmentRequest;
use App\Http\Requests\UpdateEquipmentRequest;
use App\Http\Resources\EquipmentResource;
use App\Models\Equipment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EquipmentController extends Controller
{
    public function index(Request $request)
    {
        $showDeactivated = $request->boolean('deactivated')
            && $request->user()?->role === 'admin';
        $query = Equipment::query()->where('is_active', ! $showDeactivated);

        if ($request->filled('search')) {
            $s = $request->string('search');
            $query->where(fn ($q) => $q->where('name', 'like', "%{$s}%")
                ->orWhere('asset_code', 'like', "%{$s}%")
                ->orWhere('barcode', 'like', "%{$s}%"));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }
        if ($request->filled('condition')) {
            $query->where('condition', $request->string('condition'));
        }

        return EquipmentResource::collection($query->orderBy('name')->paginate(20));
    }

    public function show(Equipment $equipment)
    {
        return new EquipmentResource($equipment);
    }

    public function statusByBarcode(string $barcode)
    {
        $equipment = Equipment::where('barcode', $barcode)->first();

        if (! $equipment) {
            return response()->json(['message' => 'No equipment found for this barcode.'], 404);
        }

        return response()->json(['equipment' => new EquipmentResource($equipment)]);
    }

    public function store(StoreEquipmentRequest $request)
    {
        $data = $request->validated();

        $data['asset_code'] = 'EQ-'.strtoupper(Str::random(8));
        $data['barcode'] = 'EQ-'.strtoupper(Str::random(10));
        $data['available_quantity'] = $data['total_quantity'];
        $data['status'] = 'available';

        $equipment = Equipment::create($data);

        return (new EquipmentResource($equipment))->response()->setStatusCode(201);
    }

    public function update(UpdateEquipmentRequest $request, Equipment $equipment)
    {
        $data = $request->validated();

        if (isset($data['total_quantity'])) {
            $diff = $data['total_quantity'] - $equipment->total_quantity;
            $equipment->available_quantity = max(0, $equipment->available_quantity + $diff);
        }

        $equipment->fill($data);
        $equipment->save();
        $equipment->refreshStatus();

        return new EquipmentResource($equipment);
    }

    public function deactivate(Equipment $equipment)
    {
        $equipment->update(['is_active' => false]);

        return (new EquipmentResource($equipment))->additional(['message' => 'Equipment deactivated.']);
    }

    public function activate(Equipment $equipment)
    {
        $equipment->update(['is_active' => true]);

        return (new EquipmentResource($equipment))->additional(['message' => 'Equipment activated.']);
    }

    public function destroy(Equipment $equipment)
    {
        $equipment->delete();

        return response()->json(['message' => 'Equipment deleted.']);
    }
}
