<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSupplyRequest;
use App\Http\Requests\UpdateSupplyRequest;
use App\Http\Resources\SupplyResource;
use App\Models\Supply;
use Illuminate\Http\Request;

class SupplyController extends Controller
{
    public function index(Request $request)
    {
        $showDeactivated = $request->boolean('deactivated')
            && $request->user()?->role === 'admin';
        $query = Supply::query()->where('is_active', ! $showDeactivated);

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($query) use ($search) {
                $query->where('name', 'like', '%'.$search.'%')
                    ->orWhere('barcode', 'like', '%'.$search.'%');
            });
        }
        if ($request->boolean('low_stock')) {
            $query->whereColumn('stock_quantity', '<=', 'reorder_level');
        }

        return SupplyResource::collection($query->orderBy('name')->paginate(20));
    }

    public function show(Supply $supply)
    {
        return new SupplyResource($supply);
    }

    public function statusByBarcode(string $barcode)
    {
        $supply = Supply::where('barcode', $barcode)->first();

        if (! $supply) {
            return response()->json(['message' => 'No supply found for this barcode.'], 404);
        }

        $requests = $supply->requests()->latest()->limit(10)->get();

        return response()->json([
            'supply' => new SupplyResource($supply),
            'latest_request' => $requests->first() ? new \App\Http\Resources\SupplyRequestResource($requests->first()) : null,
            'requests' => \App\Http\Resources\SupplyRequestResource::collection($requests),
        ]);
    }

    public function store(StoreSupplyRequest $request)
    {
        $data = $request->validated();

        $supply = Supply::create($data);

        return (new SupplyResource($supply))->response()->setStatusCode(201);
    }

    public function update(UpdateSupplyRequest $request, Supply $supply)
    {
        $data = $request->validated();

        $supply->update($data);

        return new SupplyResource($supply);
    }

    public function deactivate(Supply $supply)
    {
        $supply->update(['is_active' => false]);

        return (new SupplyResource($supply))->additional(['message' => 'Supply deactivated.']);
    }

    public function activate(Supply $supply)
    {
        $supply->update(['is_active' => true]);

        return (new SupplyResource($supply))->additional(['message' => 'Supply activated.']);
    }

    public function destroy(Supply $supply)
    {
        $supply->delete();

        return response()->json(['message' => 'Supply deleted.']);
    }
}
