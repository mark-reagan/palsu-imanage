import { useState } from 'react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import ErrorAlert from '../../components/ui/ErrorAlert';
import DeclineReasonModal from '../../components/ui/DeclineReasonModal';
import ConfirmActionModal from '../../components/ui/ConfirmActionModal';
import { useApiRequest } from '../../hooks/useApiRequest';
import { useAuth } from '../auth/useAuth';
import { ROLES } from '../../lib/constants';
import { formatDate } from '../../lib/format';
import { dispatchSuccess } from '../../lib/toast';
import { equipmentRequestsApi } from './api';
import { useOfflineMode } from '../../hooks/useOfflineMode';
import RequestQrScannerModal from '../request-tracking/RequestQrScannerModal';

export default function EquipmentRequestsPage() {
	const { user } = useAuth();
	const { isReadOnlyAdmin } = useOfflineMode();
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState('');
	const [searchBy, setSearchBy] = useState(
		user.role === ROLES.ADMIN || user.role === ROLES.STAFF
			? 'requester'
			: 'item',
	);
	const [search, setSearch] = useState('');
	const [scannerOpen, setScannerOpen] = useState(false);
	const [declineTarget, setDeclineTarget] = useState(null);
	const [approveTarget, setApproveTarget] = useState(null);
	const [cancelTarget, setCancelTarget] = useState(null);

	const { data, error, loading, refetch } = useApiRequest(
		(signal) =>
			equipmentRequestsApi.list(
				{ page, status, search_by: searchBy, search },
				signal,
			),
		[page, status, searchBy, search],
	);

	const isAdmin = user.role === ROLES.ADMIN;
	const isOwnerRole =
		user.role === ROLES.FACULTY || user.role === ROLES.OUTSIDER;

	async function handleCancel(id) {
		setCancelTarget(data?.data?.find((request) => request.id === id) || { id });
	}

	const columns = [
		{
			key: 'equipment',
			header: 'Equipment',
			truncate: 'responsive',
			render: (r) => r.equipment?.name || '—',
		},
		...(isAdmin
			? [
					{
						key: 'requester',
						header: 'Requester',
						truncate: 'responsive',
						render: (r) => r.user?.name || '—',
					},
				]
			: []),
		{ key: 'quantity', header: 'Qty', truncate: 'responsive' },
		...(isAdmin
			? [
					{
						key: 'approver',
						header: 'Reviewed By',
						truncate: 'responsive',
						render: (r) => r.approver?.name || '—',
					},
				]
			: []),
		{
			key: 'purpose',
			header: 'Purpose',
			truncate: 'responsive',
			render: (r) => r.purpose || '—',
		},
		{
			key: 'dates',
			header: 'Reservation',
			truncate: 'responsive',
			render: (r) => `${formatDate(r.start_date)} – ${formatDate(r.end_date)}`,
		},
		{
			key: 'status',
			header: 'Status',
			minWidth: true,
			render: (r) => <Badge status={r.status} />,
		},
		{
			key: 'tracking',
			header: 'QR',
			minWidth: true,
			render: (r) => (
				<a
					className="text-[var(--accent-strong)] hover:text-[var(--accent)] hover:underline"
					href={r.tracking_url}
				>
					Open
				</a>
			),
		},
		{
			key: 'actions',
			header: 'Actions',
			headerAlign: 'left',
			minWidth: true,
			render: (r) => (
				<div className="flex w-max justify-start gap-2">
					{isAdmin && r.status === 'pending' && (
						<>
							<button
								className="btn-primary btn-sm"
								disabled={isReadOnlyAdmin}
								onClick={() => setApproveTarget(r)}
							>
								Approve
							</button>
							<button
								className="btn-danger btn-sm"
								disabled={isReadOnlyAdmin}
								onClick={() => setDeclineTarget(r)}
							>
								Decline
							</button>
						</>
					)}
					{isOwnerRole && ['pending', 'approved'].includes(r.status) && (
						<button
							className="btn-secondary btn-sm"
							onClick={() => handleCancel(r.id)}
						>
							Cancel
						</button>
					)}
				</div>
			),
		},
	];

	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-xl font-bold text-slate-900">Equipment Requests</h1>
				<p className="text-sm text-slate-500">
					{isAdmin
						? 'Review and approve equipment reservation requests.'
						: 'Track the status of your equipment requests.'}
				</p>
			</div>

			<Card>
				<div className="mb-4 grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
					<Input
						className="h-9"
						label={`Search by ${searchBy === 'item' ? 'equipment' : searchBy === 'qr' ? 'QR code' : searchBy}`}
						placeholder={
							searchBy === 'qr'
								? 'Enter request QR code or token'
								: `Search ${searchBy === 'item' ? 'equipment' : searchBy}...`
						}
						value={search}
						onChange={(event) => {
							setPage(1);
							setSearch(event.target.value);
						}}
					/>
					{searchBy === 'qr' && (isAdmin || user.role === ROLES.STAFF) && (
						<Button
							className="h-9 w-full"
							variant="secondary"
							type="button"
							onClick={() => setScannerOpen(true)}
						>
							Scan QR code
						</Button>
					)}
					<Select
						className="h-9"
						label="Search by"
						value={searchBy}
						onChange={(event) => {
							setPage(1);
							setSearchBy(event.target.value);
							setSearch('');
						}}
					>
						{(isAdmin || user.role === ROLES.STAFF) && (
							<option value="requester">Requester</option>
						)}
						<option value="item">Equipment</option>
						{(isAdmin || user.role === ROLES.STAFF) && (
							<option value="reviewer">Reviewed by</option>
						)}
						<option value="qr">QR code</option>
					</Select>
					<Select
						className="h-9"
						label="Filter by status"
						value={status}
						onChange={(e) => {
							setPage(1);
							setStatus(e.target.value);
						}}
					>
						<option value="">All statuses</option>
						<option value="pending">Pending</option>
						<option value="approved">Approved</option>
						<option value="declined">Declined</option>
						<option value="released">Released</option>
						<option value="completed">Completed</option>
						<option value="cancelled">Cancelled</option>
					</Select>
				</div>
				{loading && <Spinner />}
				<ErrorAlert error={error} />
				{!loading && !error && (
					<>
						<Table
							columns={columns}
							rows={data?.data}
							emptyMessage="No equipment requests found."
							truncateCells
						/>
						<Pagination meta={data} onPageChange={setPage} />
					</>
				)}
			</Card>

			<DeclineReasonModal
				open={!!declineTarget}
				onClose={() => setDeclineTarget(null)}
				disabled={isReadOnlyAdmin}
				title="Decline Equipment Request"
				onConfirm={async (reason) => {
					if (isReadOnlyAdmin) return;
					await equipmentRequestsApi.decline(declineTarget.id, reason);
					refetch();
					dispatchSuccess('Equipment request declined.');
				}}
			/>
			<ConfirmActionModal
				open={!!approveTarget}
				onClose={() => setApproveTarget(null)}
				title="Approve Equipment Request"
				message={`Approve ${approveTarget?.quantity} unit(s) of ${approveTarget?.equipment?.name} for ${approveTarget?.user?.name || 'the requester'}?`}
				confirmLabel="Approve request"
				onConfirm={async () => {
					await equipmentRequestsApi.approve(approveTarget.id);
					refetch();
					dispatchSuccess('Equipment request approved.');
					setApproveTarget(null);
				}}
			/>
			<ConfirmActionModal
				open={!!cancelTarget}
				onClose={() => setCancelTarget(null)}
				title="Cancel Equipment Request"
				message={`Cancel the request for ${cancelTarget?.equipment?.name || 'this equipment'}?`}
				confirmLabel="Cancel request"
				variant="danger"
				onConfirm={async () => {
					await equipmentRequestsApi.cancel(cancelTarget.id);
					refetch();
					dispatchSuccess('Equipment request cancelled.');
					setCancelTarget(null);
				}}
			/>
			<RequestQrScannerModal
				open={scannerOpen}
				onClose={() => setScannerOpen(false)}
				onScanned={(trackingCode) => {
					setSearch(trackingCode);
					setSearchBy('qr');
					setPage(1);
					setScannerOpen(false);
				}}
			/>
		</div>
	);
}
