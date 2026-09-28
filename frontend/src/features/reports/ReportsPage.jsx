import { useState } from 'react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import ErrorAlert from '../../components/ui/ErrorAlert';
import Modal from '../../components/ui/Modal';
import { useApiRequest } from '../../hooks/useApiRequest';
import { formatDateTime, titleCase } from '../../lib/format';
import { reportsApi } from './api';

const TABS = [
	{ key: 'overview', label: 'Overview' },
	{ key: 'equipment', label: 'Equipment Report' },
	{ key: 'supplies', label: 'Supply Report' },
	{ key: 'supply-usage', label: 'Supply Usage' },
	{ key: 'transactions', label: 'Transactions' },
	{ key: 'concerns', label: 'Damage & Concerns' },
];

function StatCard({ label, value }) {
	return (
		<div className="card">
			<p className="text-sm text-slate-500">{label}</p>
			<p className="mt-1 text-2xl font-bold text-slate-900">{value ?? '—'}</p>
		</div>
	);
}

function ReportTable({ children }) {
	return (
		<div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-strong)]">
			{children}
		</div>
	);
}

function ActorAttribution({ actor, actionAt }) {
	return (
		<div className="min-w-32">
			<p className="font-medium text-[var(--text)]">{actor?.name || '—'}</p>
			{actor?.role && (
				<p className="mt-0.5 text-xs text-[var(--text-soft)]">
					{titleCase(actor.role)}
				</p>
			)}
			{actionAt && (
				<p className="mt-0.5 text-xs text-[var(--text-soft)]">
					{formatDateTime(actionAt)}
				</p>
			)}
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
			render: (r) => (
				<ActorAttribution actor={r.released_by} actionAt={r.released_at} />
			),
		},
		{
			key: 'approved_by',
			header: 'Approved By',
			render: (r) => (
				<ActorAttribution
					actor={r.supply_request?.approver}
					actionAt={r.supply_request?.approved_at}
				/>
			),
		},
	];

	if (loading) return <Spinner />;
	if (error) return <ErrorAlert error={error} />;
	return (
		<>
			<ReportTable>
				<Table
					columns={columns}
					rows={data?.data}
					emptyMessage="No supply usage recorded yet."
				/>
			</ReportTable>
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
			key: 'approved_by',
			header: 'Approved By',
			render: (r) => (
				<ActorAttribution
					actor={r.equipment_request?.approver}
					actionAt={r.equipment_request?.approved_at}
				/>
			),
		},
		{
			key: 'released_by',
			header: 'Released By',
			render: (r) => (
				<ActorAttribution actor={r.released_by} actionAt={r.released_at} />
			),
		},
		{
			key: 'received_by',
			header: 'Received By',
			render: (r) => (
				<ActorAttribution actor={r.received_by} actionAt={r.returned_at} />
			),
		},
		{
			key: 'status',
			header: 'Status',
			render: (r) => <Badge status={r.status} />,
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
		{
			key: 'approved_by',
			header: 'Approved By',
			render: (r) => (
				<ActorAttribution
					actor={r.supply_request?.approver}
					actionAt={r.supply_request?.approved_at}
				/>
			),
		},
		{ key: 'quantity_released', header: 'Qty' },
		{
			key: 'released_by',
			header: 'Released By',
			render: (r) => (
				<ActorAttribution actor={r.released_by} actionAt={r.released_at} />
			),
		},
	];

	if (loading) return <Spinner />;
	if (error) return <ErrorAlert error={error} />;

	return (
		<div className="space-y-5">
			<section
				aria-labelledby="equipment-transactions-heading"
				className="space-y-2"
			>
				<div>
					<h3
						id="equipment-transactions-heading"
						className="text-base font-semibold text-[var(--text)]"
					>
						Equipment transactions
					</h3>
					<p className="text-sm text-[var(--text-soft)]">
						Approver, releasing staff, and return recipient are shown with their
						action times.
					</p>
				</div>
				<ReportTable>
					<Table
						columns={equipmentColumns}
						rows={
							data.equipment_transactions?.data ?? data.equipment_transactions
						}
						emptyMessage="No equipment transactions yet."
					/>
				</ReportTable>
			</section>
			<section
				aria-labelledby="supply-transactions-heading"
				className="space-y-2"
			>
				<div>
					<h3
						id="supply-transactions-heading"
						className="text-base font-semibold text-[var(--text)]"
					>
						Supply transactions
					</h3>
					<p className="text-sm text-[var(--text-soft)]">
						Approval and release attribution are included for each supply issue.
					</p>
				</div>
				<ReportTable>
					<Table
						columns={supplyColumns}
						rows={data.supply_transactions?.data ?? data.supply_transactions}
						emptyMessage="No supply transactions yet."
					/>
				</ReportTable>
			</section>
		</div>
	);
}

function ConcernReportTab() {
	const [page, setPage] = useState(1);
	const [selected, setSelected] = useState(null);
	const { data, error, loading } = useApiRequest(
		(signal) => reportsApi.concerns({ page }, signal),
		[page],
	);

	const columns = [
		{
			key: 'created_at',
			header: 'Saved on',
			render: (r) => formatDateTime(r.created_at),
		},
		{ key: 'action', header: 'Record', render: (r) => titleCase(r.action) },
		{ key: 'equipment_name', header: 'Equipment' },
		{
			key: 'asset_code',
			header: 'Asset Code',
			render: (r) => r.asset_code || '—',
		},
		{ key: 'reporter_name', header: 'Reported by' },
		{
			key: 'severity',
			header: 'Severity',
			render: (r) => <Badge status={r.severity} />,
		},
		{
			key: 'status',
			header: 'Status',
			render: (r) => <Badge status={r.status} />,
		},
		{
			key: 'admin_remarks',
			header: 'Admin remarks',
			width: '16%',
			truncate: 'responsive',
			render: (r) =>
				r.admin_remarks ? (
					<button
						type="button"
						className="block w-full min-w-0 text-left text-[var(--accent-strong)] underline decoration-dotted underline-offset-2 hover:text-[var(--accent)]"
						onClick={() => setSelected(r)}
						aria-label="View full admin remarks"
					>
						<span className="block truncate" title={r.admin_remarks}>
							{r.admin_remarks}
						</span>
						<span className="block text-xs">View remarks</span>
					</button>
				) : (
					'—'
				),
		},
		{
			key: 'actor',
			header: 'Saved by',
			render: (r) => (
				<ActorAttribution actor={{ name: r.actor_name, role: r.actor_role }} />
			),
		},
	];

	if (loading) return <Spinner />;
	if (error) return <ErrorAlert error={error} />;

	return (
		<>
			<p className="mb-3 text-sm text-[var(--text-soft)]">
				Each report and review save is retained as a separate history record.
			</p>
			<ReportTable>
				<Table
					columns={columns}
					rows={data?.data}
					emptyMessage="No damage or concern history recorded."
					truncateCells
					fixedLayout
				/>
			</ReportTable>
			<Pagination meta={data} onPageChange={setPage} />
			<Modal
				open={!!selected}
				onClose={() => setSelected(null)}
				title={`Admin remarks — ${selected?.equipment_name || 'Concern'}`}
			>
				{selected && (
					<div className="space-y-3 text-sm">
						<p className="text-[var(--text-soft)]">
							{titleCase(selected.action)} ·{' '}
							{formatDateTime(selected.created_at)} · {selected.actor_name}
						</p>
						<p className="whitespace-pre-wrap break-words rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">
							{selected.admin_remarks}
						</p>
					</div>
				)}
			</Modal>
		</>
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
				{tab === 'concerns' && <ConcernReportTab />}
			</Card>
		</div>
	);
}
