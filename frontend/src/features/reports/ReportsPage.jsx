import { useState } from 'react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import ErrorAlert from '../../components/ui/ErrorAlert';
import Modal from '../../components/ui/Modal';
import { useApiRequest } from '../../hooks/useApiRequest';
import { formatDate, formatDateTime, titleCase } from '../../lib/format';
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
	const [selectedEquipmentTransaction, setSelectedEquipmentTransaction] =
		useState(null);
	const [transactionViewedAt, setTransactionViewedAt] = useState(null);
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
			key: 'status',
			header: 'Status',
			render: (r) => <Badge status={r.status} />,
		},
		{
			key: 'received_by',
			header: 'Received By',
			render: (r) => (
				<ActorAttribution actor={r.received_by} actionAt={r.returned_at} />
			),
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
						onRowClick={(transaction) => {
							setTransactionViewedAt(Date.now());
							setSelectedEquipmentTransaction(transaction);
						}}
						emptyMessage="No equipment transactions yet."
					/>
				</ReportTable>
			</section>
			<Modal
				open={!!selectedEquipmentTransaction}
				onClose={() => setSelectedEquipmentTransaction(null)}
				title={`${selectedEquipmentTransaction?.equipment_request?.equipment?.name || 'Equipment'} transaction details`}
				size="lg"
			>
				{selectedEquipmentTransaction &&
					(() => {
						const transaction = selectedEquipmentTransaction;
						const request = transaction.equipment_request;
						const dueDate = request?.end_date;
						const hasReturned =
							transaction.status === 'returned' ||
							Boolean(transaction.returned_at);
						const isOverdue =
							!hasReturned &&
							dueDate &&
							transactionViewedAt !== null &&
							new Date(dueDate).getTime() < transactionViewedAt;

						let returnMessage;
						if (hasReturned) {
							returnMessage = `This equipment was already returned${transaction.returned_at ? ` on ${formatDateTime(transaction.returned_at)}` : ''}.`;
						} else if (isOverdue) {
							returnMessage = `The return due date passed on ${formatDate(dueDate)}, but this transaction is still marked as not returned.`;
						} else if (dueDate) {
							returnMessage = `This equipment has not been returned yet. It is due to be returned on ${formatDate(dueDate)}.`;
						} else if (transaction.status === 'released') {
							returnMessage =
								'This equipment has not been returned yet. No return due date was recorded.';
						} else {
							returnMessage = `Return status: ${titleCase(transaction.status) || 'not recorded'}.`;
						}

						return (
							<div className="space-y-4 text-sm">
								<div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">
									<p className="font-semibold text-[var(--text)]">
										Return status
									</p>
									<p className="mt-1 text-[var(--text-soft)]">
										{returnMessage}
									</p>
								</div>
								<dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
									<div>
										<dt className="text-xs font-semibold uppercase text-[var(--text-soft)]">
											Borrower
										</dt>
										<dd className="mt-1">{request?.user?.name || '—'}</dd>
									</div>
									<div>
										<dt className="text-xs font-semibold uppercase text-[var(--text-soft)]">
											Received by
										</dt>
										<dd className="mt-1">
											{transaction.received_by?.name || '—'}
										</dd>
									</div>
									<div>
										<dt className="text-xs font-semibold uppercase text-[var(--text-soft)]">
											Released
										</dt>
										<dd className="mt-1">
											{transaction.released_at
												? formatDateTime(transaction.released_at)
												: '—'}
										</dd>
									</div>
									<div>
										<dt className="text-xs font-semibold uppercase text-[var(--text-soft)]">
											Returned
										</dt>
										<dd className="mt-1">
											{transaction.returned_at
												? formatDateTime(transaction.returned_at)
												: 'Not returned'}
										</dd>
									</div>
									<div>
										<dt className="text-xs font-semibold uppercase text-[var(--text-soft)]">
											Condition on release
										</dt>
										<dd className="mt-1">
											{titleCase(transaction.condition_on_release) || '—'}
										</dd>
									</div>
									<div>
										<dt className="text-xs font-semibold uppercase text-[var(--text-soft)]">
											Condition on return
										</dt>
										<dd className="mt-1">
											{titleCase(transaction.condition_on_return) || '—'}
										</dd>
									</div>
									<div className="sm:col-span-2">
										<dt className="text-xs font-semibold uppercase text-[var(--text-soft)]">
											Return remarks
										</dt>
										<dd className="mt-1 whitespace-pre-wrap break-words">
											{transaction.remarks || 'No return remarks provided.'}
										</dd>
									</div>
								</dl>
							</div>
						);
					})()}
			</Modal>
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
