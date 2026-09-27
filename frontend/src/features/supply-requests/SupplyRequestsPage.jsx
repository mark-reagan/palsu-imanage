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
import SuccessAlert from '../../components/ui/SuccessAlert';
import { useApiRequest } from '../../hooks/useApiRequest';
import { useAuth } from '../auth/useAuth';
import { ROLES } from '../../lib/constants';
import { supplyRequestsApi } from './api';
import { useOfflineMode } from '../../hooks/useOfflineMode';

export default function SupplyRequestsPage() {
	const { user } = useAuth();
	const { isReadOnlyAdmin } = useOfflineMode();
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState('');
	const [declineTarget, setDeclineTarget] = useState(null);
	const [approveTarget, setApproveTarget] = useState(null);
	const [cancelTarget, setCancelTarget] = useState(null);
	const [actionError, setActionError] = useState(null);
	const [successMessage, setSuccessMessage] = useState('');

	const { data, error, loading, refetch } = useApiRequest(
		(signal) => supplyRequestsApi.list({ page, status }, signal),
		[page, status],
	);

	const isAdmin = user.role === ROLES.ADMIN;
	const isFaculty = user.role === ROLES.FACULTY;

	async function handleCancel(id) {
		setActionError(null);
		setCancelTarget(data?.data?.find((request) => request.id === id) || { id });
	}

	const columns = [
		{ key: 'supply', header: 'Supply', render: (r) => r.supply?.name || '—' },
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
			render: (r) => <span className="line-clamp-1 max-w-xs">{r.purpose}</span>,
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
					{isFaculty && r.status === 'pending' && (
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
				<h1 className="text-xl font-bold text-slate-900">Supply Requests</h1>
				<p className="text-sm text-slate-500">
					{isAdmin
						? 'Review and approve consumable supply requests.'
						: 'Track the status of your supply requests.'}
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
						<option value="completed">Completed</option>
						<option value="cancelled">Cancelled</option>
					</Select>
				</div>

				<ErrorAlert error={actionError} className="mb-4" />
				<SuccessAlert message={successMessage} className="mb-4" />
				{loading && <Spinner />}
				<ErrorAlert error={error} />
				{!loading && !error && (
					<>
						<Table
							columns={columns}
							rows={data?.data}
							emptyMessage="No supply requests found."
						/>
						<Pagination meta={data} onPageChange={setPage} />
					</>
				)}
			</Card>

			<DeclineReasonModal
				open={!!declineTarget}
				onClose={() => setDeclineTarget(null)}
				disabled={isReadOnlyAdmin}
				title="Decline Supply Request"
				onConfirm={async (reason) => {
					if (isReadOnlyAdmin) return;
					await supplyRequestsApi.decline(declineTarget.id, reason);
					refetch();
					setSuccessMessage('Supply request declined.');
				}}
			/>
			<ConfirmActionModal
				open={!!approveTarget}
				onClose={() => setApproveTarget(null)}
				title="Approve Supply Request"
				message={`Approve ${approveTarget?.quantity} ${approveTarget?.supply?.unit || 'unit(s)'} of ${approveTarget?.supply?.name} for ${approveTarget?.user?.name || 'the requester'}?`}
				confirmLabel="Approve request"
				onConfirm={async () => {
					await supplyRequestsApi.approve(approveTarget.id);
					refetch();
					setSuccessMessage('Supply request approved.');
					setApproveTarget(null);
				}}
			/>
			<ConfirmActionModal
				open={!!cancelTarget}
				onClose={() => setCancelTarget(null)}
				title="Cancel Supply Request"
				message={`Cancel the request for ${cancelTarget?.supply?.name || 'this supply'}?`}
				confirmLabel="Cancel request"
				variant="danger"
				onConfirm={async () => {
					await supplyRequestsApi.cancel(cancelTarget.id);
					refetch();
					setSuccessMessage('Supply request cancelled.');
					setCancelTarget(null);
				}}
			/>
		</div>
	);
}
