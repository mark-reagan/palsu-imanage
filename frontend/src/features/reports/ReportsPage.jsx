import { useState } from 'react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import ErrorAlert from '../../components/ui/ErrorAlert';
import { useApiRequest } from '../../hooks/useApiRequest';
import { formatDateTime } from '../../lib/format';
import { reportsApi } from './api';

const TABS = [
	{ key: 'overview', label: 'Overview' },
	{ key: 'equipment', label: 'Equipment Report' },
	{ key: 'supplies', label: 'Supply Report' },
	{ key: 'supply-usage', label: 'Supply Usage' },
	{ key: 'transactions', label: 'Transactions' },
];

function StatCard({ label, value }) {
	return (
		<div className="card">
			<p className="text-sm text-slate-500">{label}</p>
			<p className="mt-1 text-2xl font-bold text-slate-900">{value ?? '—'}</p>
		</div>
	);
}

function OverviewTab() {
	const { data, error, loading } = useApiRequest(
		(signal) => reportsApi.dashboard(signal),
		[],
	);

	if (loading) return <Spinner />;
	if (error) return <ErrorAlert error={error} />;

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<StatCard label="Total equipment" value={data.total_equipment} />
			<StatCard label="Total supplies" value={data.total_supplies} />
			<StatCard label="Low stock supplies" value={data.low_stock_supplies} />
			<StatCard
				label="Pending equipment requests"
				value={data.pending_equipment_requests}
			/>
			<StatCard
				label="Pending supply requests"
				value={data.pending_supply_requests}
			/>
			<StatCard
				label="Active equipment loans"
				value={data.active_equipment_loans}
			/>
			<StatCard label="Open concerns" value={data.open_concerns} />
		</div>
	);
}

function EquipmentReportTab() {
	const { data, error, loading } = useApiRequest(
		(signal) => reportsApi.equipment({}, signal),
		[],
	);

	const columns = [
		{ key: 'name', header: 'Name' },
		{ key: 'asset_code', header: 'Asset Code' },
		{
			key: 'condition',
			header: 'Condition',
			render: (r) => <Badge status={r.condition} />,
		},
		{
			key: 'status',
			header: 'Status',
			render: (r) => <Badge status={r.status} />,
		},
		{ key: 'requests_count', header: 'Total Requests' },
		{ key: 'concerns_count', header: 'Concerns Filed' },
	];

	if (loading) return <Spinner />;
	if (error) return <ErrorAlert error={error} />;
	return (
		<Table
			columns={columns}
			rows={data?.data}
			emptyMessage="No equipment records."
		/>
	);
}

function SupplyReportTab() {
	const { data, error, loading } = useApiRequest(
		(signal) => reportsApi.supplies(signal),
		[],
	);

	const columns = [
		{ key: 'name', header: 'Name' },
		{ key: 'category', header: 'Category', render: (r) => r.category || '—' },
		{ key: 'stock_quantity', header: 'Stock' },
		{ key: 'reorder_level', header: 'Reorder Level' },
		{ key: 'requests_count', header: 'Total Requests' },
	];

	if (loading) return <Spinner />;
	if (error) return <ErrorAlert error={error} />;
	return (
		<Table
			columns={columns}
			rows={data?.data}
			emptyMessage="No supply records."
		/>
	);
}

function SupplyUsageTab() {
	const [page, setPage] = useState(1);
	const { data, error, loading } = useApiRequest(
		(signal) => reportsApi.supplyUsage({ page }, signal),
		[page],
	);

	const columns = [
		{
			key: 'supply',
			header: 'Supply',
			render: (r) => r.supply_request?.supply?.name || '—',
		},
		{
			key: 'requester',
			header: 'Requester',
			render: (r) => r.supply_request?.user?.name || '—',
		},
		{ key: 'quantity_released', header: 'Qty Released' },
		{
			key: 'released_by',
			header: 'Released By',
			render: (r) => r.released_by?.name || '—',
		},
		{
			key: 'released_at',
			header: 'Released At',
			render: (r) => formatDateTime(r.released_at),
		},
	];

	if (loading) return <Spinner />;
	if (error) return <ErrorAlert error={error} />;
	return (
		<>
			<Table
				columns={columns}
				rows={data?.data}
				emptyMessage="No supply usage recorded yet."
			/>
			<Pagination meta={data} onPageChange={setPage} />
		</>
	);
}

function TransactionsTab() {
	const { data, error, loading } = useApiRequest(
		(signal) => reportsApi.transactions(signal),
		[],
	);

	const equipmentColumns = [
		{
			key: 'equipment',
			header: 'Equipment',
			render: (r) => r.equipment_request?.equipment?.name || '—',
		},
		{
			key: 'borrower',
			header: 'Borrower',
			render: (r) => r.equipment_request?.user?.name || '—',
		},
		{
			key: 'status',
			header: 'Status',
			render: (r) => <Badge status={r.status} />,
		},
		{
			key: 'released_at',
			header: 'Released',
			render: (r) => formatDateTime(r.released_at),
		},
		{
			key: 'returned_at',
			header: 'Returned',
			render: (r) => formatDateTime(r.returned_at),
		},
	];

	const supplyColumns = [
		{
			key: 'supply',
			header: 'Supply',
			render: (r) => r.supply_request?.supply?.name || '—',
		},
		{
			key: 'requester',
			header: 'Requester',
			render: (r) => r.supply_request?.user?.name || '—',
		},
		{ key: 'quantity_released', header: 'Qty' },
		{
			key: 'released_at',
			header: 'Released',
			render: (r) => formatDateTime(r.released_at),
		},
	];

	if (loading) return <Spinner />;
	if (error) return <ErrorAlert error={error} />;

	return (
		<div className="space-y-6">
			<div>
				<h3 className="mb-2 text-sm font-semibold text-slate-700">
					Recent Equipment Transactions
				</h3>
				<Table
					columns={equipmentColumns}
					rows={
						data.equipment_transactions?.data ?? data.equipment_transactions
					}
					emptyMessage="No equipment transactions yet."
				/>
			</div>
			<div>
				<h3 className="mb-2 text-sm font-semibold text-slate-700">
					Recent Supply Transactions
				</h3>
				<Table
					columns={supplyColumns}
					rows={data.supply_transactions?.data ?? data.supply_transactions}
					emptyMessage="No supply transactions yet."
				/>
			</div>
		</div>
	);
}

export default function ReportsPage() {
	const [tab, setTab] = useState('overview');

	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-xl font-bold text-slate-900">Reports</h1>
				<p className="text-sm text-slate-500">
					Inventory, transaction, and usage reports.
				</p>
			</div>

			<div className="flex flex-wrap gap-1 rounded-lg bg-[var(--surface-muted)] p-1">
				{TABS.map((t) => (
					<button
						key={t.key}
						onClick={() => setTab(t.key)}
						className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
							tab === t.key
								? 'bg-[var(--surface-strong)] text-[var(--accent-strong)] shadow-sm'
								: 'text-[var(--text-soft)] hover:text-[var(--text)]'
						}`}
					>
						{t.label}
					</button>
				))}
			</div>

			<Card>
				{tab === 'overview' && <OverviewTab />}
				{tab === 'equipment' && <EquipmentReportTab />}
				{tab === 'supplies' && <SupplyReportTab />}
				{tab === 'supply-usage' && <SupplyUsageTab />}
				{tab === 'transactions' && <TransactionsTab />}
			</Card>
		</div>
	);
}
