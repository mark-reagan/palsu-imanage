import { useState } from 'react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
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

export default function EquipmentRequestsPage() {
	const { user } = useAuth();
	const { isReadOnlyAdmin } = useOfflineMode();
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState('');
	const [declineTarget, setDeclineTarget] = useState(null);
	const [approveTarget, setApproveTarget] = useState(null);
	const [cancelTarget, setCancelTarget] = useState(null);

	const { data, error, loading, refetch } = useApiRequest(
		(signal) => equipmentRequestsApi.list({ page, status }, signal),
		[page, status],
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
			render: (r) => r.equipment?.name || '—',
		},
		...(isAdmin
			? [
					{
						key: 'requester',
						header: 'Requester',
						render: (r) => r.user?.name || '—',
					},
				]
			: []),
		{ key: 'quantity', header: 'Qty' },
		...(isAdmin
			? [
					{
						key: 'approver',
						header: 'Reviewed By',
						render: (r) => r.approver?.name || '—',
					},
				]
			: []),
		{
			key: 'purpose',
			header: 'Purpose',
			render: (r) => (
				<span className="line-clamp-1 max-w-xs">{r.purpose || '—'}</span>
			),
		},
		{
			key: 'dates',
			header: 'Reservation',
			render: (r) => `${formatDate(r.start_date)} – ${formatDate(r.end_date)}`,
		},
		{
			key: 'status',
			header: 'Status',
			render: (r) => <Badge status={r.status} />,
		},
		{
			key: 'tracking',
			header: 'QR',
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
			header: '',
			render: (r) => (
				<div className="flex justify-end gap-2">
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
				<div className="mb-4 max-w-xs">
					<Select
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
		</div>
	);
}
