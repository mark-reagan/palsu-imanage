import { useState } from 'react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Spinner from '../../components/ui/Spinner';
import ErrorAlert from '../../components/ui/ErrorAlert';
import ConfirmActionModal from '../../components/ui/ConfirmActionModal';
import { useApiRequest } from '../../hooks/useApiRequest';
import { formatDate } from '../../lib/format';
import { equipmentRequestsApi } from '../equipment-requests/api';
import { supplyRequestsApi } from '../supply-requests/api';
import { releaseReturnApi } from './api';
import ReturnEquipmentModal from './ReturnEquipmentModal';
import { dispatchError, dispatchSuccess } from '../../lib/toast';

const TABS = [
	{ key: 'release-equipment', label: 'Release Equipment' },
	{ key: 'return-equipment', label: 'Return Equipment' },
	{ key: 'release-supply', label: 'Release Supplies' },
];

export default function ReleaseReturnPage() {
	const [tab, setTab] = useState('release-equipment');
	const [page, setPage] = useState(1);
	const [confirmTarget, setConfirmTarget] = useState(null);
	const [returnTarget, setReturnTarget] = useState(null);

	const equipmentStatus = tab === 'release-equipment' ? 'approved' : 'released';
	const equipmentRequests = useApiRequest(
		(signal) =>
			equipmentRequestsApi.list({ page, status: equipmentStatus }, signal),
		[page, equipmentStatus, tab],
	);
	const supplyRequests = useApiRequest(
		(signal) =>
			tab === 'release-supply'
				? supplyRequestsApi.list({ page, status: 'approved' }, signal)
				: Promise.resolve(null),
		[page, tab],
	);

	function switchTab(next) {
		setTab(next);
		setPage(1);
	}

	async function handleReleaseEquipment(id) {
		await releaseReturnApi.releaseEquipment(id);
		equipmentRequests.refetch();
		dispatchSuccess('Equipment released successfully.');
	}

	async function handleReleaseSupply(id) {
		await releaseReturnApi.releaseSupply(id);
		supplyRequests.refetch();
		dispatchSuccess('Supplies released successfully.');
	}

	async function openReturnModal(request) {
		try {
			const response = await equipmentRequestsApi.get(request.id);
			const full = response?.data ?? response;
			if (!full.transaction) {
				dispatchError('No active transaction found for this request.');
				return;
			}
			setReturnTarget({ request: full, transactionId: full.transaction.id });
		} catch (err) {
			dispatchError(err);
		}
	}

	const releaseEquipmentColumns = [
		{
			key: 'equipment',
			header: 'Equipment',
			render: (r) => r.equipment?.name || '—',
		},
		{
			key: 'requester',
			header: 'Requester',
			render: (r) => r.user?.name || '—',
		},
		{ key: 'quantity', header: 'Qty' },
		{
			key: 'purpose',
			header: 'Purpose',
			truncate: 'responsive',
			render: (r) => r.purpose || '—',
		},
		{
			key: 'dates',
			header: 'Reservation',
			render: (r) => `${formatDate(r.start_date)} – ${formatDate(r.end_date)}`,
		},
		{
			key: 'actions',
			header: '',
			render: (r) => (
				<button
					className="btn-primary btn-sm"
					onClick={() => setConfirmTarget({ type: 'equipment', request: r })}
				>
					Release
				</button>
			),
		},
	];

	const returnEquipmentColumns = [
		{
			key: 'equipment',
			header: 'Equipment',
			render: (r) => r.equipment?.name || '—',
		},
		{
			key: 'requester',
			header: 'Requester',
			render: (r) => r.user?.name || '—',
		},
		{ key: 'quantity', header: 'Qty' },
		{
			key: 'purpose',
			header: 'Purpose',
			truncate: 'responsive',
			render: (r) => r.purpose || '—',
		},
		{ key: 'end_date', header: 'Due', render: (r) => formatDate(r.end_date) },
		{
			key: 'actions',
			header: '',
			render: (r) => (
				<button
					className="btn-primary btn-sm"
					onClick={() => openReturnModal(r)}
				>
					Return
				</button>
			),
		},
	];

	const releaseSupplyColumns = [
		{ key: 'supply', header: 'Supply', render: (r) => r.supply?.name || '—' },
		{
			key: 'requester',
			header: 'Requester',
			render: (r) => r.user?.name || '—',
		},
		{ key: 'quantity', header: 'Qty' },
		{
			key: 'purpose',
			header: 'Purpose',
			truncate: 'responsive',
			render: (r) => r.purpose || '—',
		},
		{
			key: 'actions',
			header: '',
			render: (r) => (
				<button
					className="btn-primary btn-sm"
					onClick={() => setConfirmTarget({ type: 'supply', request: r })}
				>
					Release
				</button>
			),
		},
	];

	const activeRequest =
		tab === 'release-supply' ? supplyRequests : equipmentRequests;
	const columns =
		tab === 'release-equipment'
			? releaseEquipmentColumns
			: tab === 'return-equipment'
				? returnEquipmentColumns
				: releaseSupplyColumns;

	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-xl font-bold text-slate-900">
					Release &amp; Return
				</h1>
				<p className="text-sm text-slate-500">
					Execute admin-approved requests: physical release, return, and
					condition checks.
				</p>
			</div>

			<div className="flex w-full flex-col gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-1.5 sm:w-auto sm:flex-row">
				{TABS.map((t) => (
					<button
						key={t.key}
						type="button"
						aria-pressed={tab === t.key}
						onClick={() => switchTab(t.key)}
						className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-muted)] sm:w-auto sm:text-center ${
							tab === t.key
								? 'bg-[var(--surface-strong)] text-[var(--accent-strong)] shadow-sm ring-1 ring-[var(--border)]'
								: 'text-[var(--text-soft)] hover:bg-[var(--surface)] hover:text-[var(--text)]'
						}`}
					>
						{t.label}
					</button>
				))}
			</div>

			<Card>
				{activeRequest.loading && <Spinner />}
				<ErrorAlert error={activeRequest.error} />
				{!activeRequest.loading && !activeRequest.error && (
					<>
						<Table
							columns={columns}
							rows={activeRequest.data?.data}
							truncateCells
							emptyMessage={
								tab === 'release-equipment'
									? 'No approved equipment awaiting release.'
									: tab === 'return-equipment'
										? 'No equipment currently out for return.'
										: 'No approved supply requests awaiting release.'
							}
						/>
						<Pagination meta={activeRequest.data} onPageChange={setPage} />
					</>
				)}
			</Card>

			<ReturnEquipmentModal
				open={!!returnTarget}
				onClose={() => setReturnTarget(null)}
				equipmentRequest={returnTarget?.request}
				transactionId={returnTarget?.transactionId}
				onSaved={() => {
					equipmentRequests.refetch();
				}}
			/>
			<ConfirmActionModal
				open={!!confirmTarget}
				onClose={() => setConfirmTarget(null)}
				title={
					confirmTarget?.type === 'supply'
						? 'Confirm Supply Release'
						: 'Confirm Equipment Release'
				}
				message={`Release ${confirmTarget?.request?.quantity} unit(s) of ${confirmTarget?.type === 'supply' ? confirmTarget?.request?.supply?.name : confirmTarget?.request?.equipment?.name} to ${confirmTarget?.request?.user?.name || 'the requester'}?`}
				confirmLabel="Confirm release"
				onConfirm={async () => {
					if (confirmTarget.type === 'supply') {
						await handleReleaseSupply(confirmTarget.request.id);
					} else {
						await handleReleaseEquipment(confirmTarget.request.id);
					}
					setConfirmTarget(null);
				}}
			/>
		</div>
	);
}
