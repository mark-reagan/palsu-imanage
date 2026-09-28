<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EquipmentResource;
use App\Http\Resources\EquipmentTransactionResource;
use App\Http\Resources\ConcernHistoryResource;
use App\Http\Resources\SupplyResource;
use App\Http\Resources\SupplyTransactionResource;
use App\Models\Equipment;
use App\Models\EquipmentConcern;
use App\Models\EquipmentConcernHistory;
use App\Models\EquipmentRequest;
use App\Models\EquipmentTransaction;
use App\Models\Supply;
use App\Models\SupplyRequest;
use App\Models\SupplyTransaction;
use Illuminate\Http\Request;

/**
 * Admin-only: Records & Reports.
 */
class ReportController extends Controller
{
    public function dashboard()
    {
        return response()->json([
            'total_equipment' => Equipment::where('is_active', true)->count(),
            'total_supplies' => Supply::where('is_active', true)->count(),
            'low_stock_supplies' => Supply::whereColumn('stock_quantity', '<=', 'reorder_level')->count(),
            'pending_equipment_requests' => EquipmentRequest::where('status', 'pending')->count(),
            'pending_supply_requests' => SupplyRequest::where('status', 'pending')->count(),
            'awaiting_equipment_release' => EquipmentRequest::where('status', 'approved')->count(),
            'awaiting_supply_release' => SupplyRequest::where('status', 'approved')->count(),
            'active_equipment_loans' => EquipmentTransaction::where('status', 'released')->count(),
            'open_concerns' => EquipmentConcern::where('status', 'open')->count(),
        ]);
    }

    public function equipmentReport(Request $request)
    {
        $query = Equipment::query();

        if ($request->filled('condition')) {
            $query->where('condition', $request->string('condition'));
        }

        return EquipmentResource::collection($query->withCount(['requests', 'concerns'])->orderBy('name')->get());
    }

    public function supplyReport()
    {
        return SupplyResource::collection(Supply::withCount('requests')->orderBy('name')->get());
    }

    public function supplyUsageReport(Request $request)
    {
        $query = SupplyTransaction::with(['supplyRequest.supply', 'supplyRequest.user', 'supplyRequest.approver', 'releasedBy']);

        if ($request->filled('from')) {
            $query->whereDate('released_at', '>=', $request->date('from'));
        }
        if ($request->filled('to')) {
            $query->whereDate('released_at', '<=', $request->date('to'));
        }

        return SupplyTransactionResource::collection($query->orderByDesc('released_at')->paginate(30));
    }

    public function transactionReport(Request $request)
    {
        $equipmentTx = EquipmentTransaction::with(['equipmentRequest.equipment', 'equipmentRequest.user', 'equipmentRequest.approver', 'releasedBy', 'receivedBy'])
            ->orderByDesc('id')->limit(50)->get();

        $supplyTx = SupplyTransaction::with(['supplyRequest.supply', 'supplyRequest.user', 'supplyRequest.approver', 'releasedBy'])
            ->orderByDesc('id')->limit(50)->get();

        return response()->json([
            'equipment_transactions' => EquipmentTransactionResource::collection($equipmentTx),
            'supply_transactions' => SupplyTransactionResource::collection($supplyTx),
        ]);
    }

    public function concernReport()
    {
        return ConcernHistoryResource::collection(
            EquipmentConcernHistory::query()->orderByDesc('created_at')->orderByDesc('id')->paginate(30)
        );
    }
}
