import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DeclineReasonModal from '../../components/ui/DeclineReasonModal';
import ErrorAlert from '../../components/ui/ErrorAlert';
import ConfirmActionModal from '../../components/ui/ConfirmActionModal';
import ReturnEquipmentModal from '../release-return/ReturnEquipmentModal';
import { useAuth } from '../auth/useAuth';
import { ROLES } from '../../lib/constants';
import { formatDate } from '../../lib/format';
import { equipmentRequestsApi } from '../equipment-requests/api';
import { supplyRequestsApi } from '../supply-requests/api';
import { releaseReturnApi } from '../release-return/api';
import { requestTrackingApi } from './api';
import { useApiRequest } from '../../hooks/useApiRequest';
import { useOfflineMode } from '../../hooks/useOfflineMode';
import { dispatchError, dispatchSuccess } from '../../lib/toast';

export default function PublicRequestStatusPage() {
	const { trackingToken } = useParams();
	const navigate = useNavigate();
	const { user } = useAuth();
	const { isReadOnlyAdmin } = useOfflineMode();
	const [confirmAction, setConfirmAction] = useState(null);
	const [declineOpen, setDeclineOpen] = useState(false);
	const [returnOpen, setReturnOpen] = useState(false);
	const [downloading, setDownloading] = useState(false);
	const {
		data: result,
		error,
		refetch,
	} = useApiRequest(
		(signal) => requestTrackingApi.get(trackingToken, signal),
		[trackingToken],
	);

	if (error) {
		return (
			<div className="mx-auto max-w-xl px-4 py-8">
				<ErrorAlert error={error} />
			</div>
		);
	}

	if (!result) {
		return (
			<div className="mx-auto max-w-5xl px-4 py-8">
				<div
					className="animate-pulse space-y-4"
					aria-label="Loading request status"
				>
					<div className="h-7 w-36 rounded-lg bg-[var(--surface-muted)]" />
					<div className="h-36 rounded-3xl bg-[var(--surface-muted)]" />
					<div className="h-64 rounded-3xl bg-[var(--surface-muted)]" />
				</div>
			</div>
		);
	}

	const request = result.request;
	const isAdmin = user?.role === ROLES.ADMIN;
	const isStaff = user?.role === ROLES.STAFF;
	const isEquipment = result.type === 'equipment';
	const itemType = isEquipment ? 'Equipment request' : 'Supply request';
	const itemName =
		request.equipment?.name || request.supply?.name || 'Inventory request';
	const detailItems = [
		{ label: 'Quantity', value: request.quantity },
		request.start_date && {
			label: 'Reservation period',
			value: `${formatDate(request.start_date)} – ${formatDate(request.end_date)}`,
		},
		request.user?.name && { label: 'Requested by', value: request.user.name },
		request.approver?.name && {
			label: request.status === 'declined' ? 'Reviewed by' : 'Approved by',
			value: request.approver.name,
		},
		request.approved_at && {
			label: 'Reviewed at',
			value: formatDate(request.approved_at),
		},
		request.transaction?.released_by?.name && {
			label: 'Released by',
			value: request.transaction.released_by.name,
		},
		request.transaction?.released_at && {
			label: 'Released at',
			value: formatDate(request.transaction.released_at),
		},
		request.transaction?.received_by?.name && {
			label: 'Received by',
			value: request.transaction.received_by.name,
		},
		request.transaction?.returned_at && {
			label: 'Returned at',
			value: formatDate(request.transaction.returned_at),
		},
	].filter(Boolean);

	async function downloadQr() {
		setDownloading(true);
		try {
			const response = await fetch(request.qr_url);
			if (!response.ok) throw new Error('Unable to download the QR code.');

			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `request-${request.tracking_token}.png`;
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(url);
		} catch (downloadError) {
			dispatchError(downloadError);
		} finally {
			setDownloading(false);
		}
	}

	async function refreshAfterAction(action) {
		if (isReadOnlyAdmin) return;
		await action();
		await refetch();
		setDeclineOpen(false);
	}

	const transactionId = request.transaction?.id;

	return (
		<div className="mx-auto w-full max-w-5xl space-y-4 px-4 pb-8 pt-3 sm:space-y-6 sm:pt-6">
			<div className="flex items-center gap-3">
				<Button
					type="button"
					variant="secondary"
					size="sm"
					onClick={() => navigate(-1)}
				>
					<span aria-hidden="true">←</span> Back
				</Button>
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-soft)]">
						Request tracking
					</p>
					<p className="text-xs text-[var(--text-soft)]">
						Status and request details
					</p>
				</div>
			</div>
			<div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="min-w-0">
						<p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
							{itemType}
						</p>
						<h1 className="mt-1 break-words text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
							{itemName}
						</h1>
						<p className="mt-2 text-sm text-[var(--text-soft)]">
							Requested by{' '}
							<span className="font-semibold text-[var(--text)]">
								{request.user?.name || 'Unknown requester'}
							</span>
							<span className="mx-2" aria-hidden="true">
								·
							</span>
							Submitted {formatDate(request.created_at)}
						</p>
					</div>
					<div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--surface-muted)] px-3 py-2 sm:justify-start">
						<span className="text-xs font-medium text-[var(--text-soft)]">
							Status
						</span>
						<Badge status={request.status} className="px-3 py-1 text-sm" />
					</div>
				</div>
				<div className="mt-4 border-t border-[var(--border)] pt-3">
					<p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">
						Tracking code
					</p>
					<p className="mt-1 break-all font-mono text-sm font-semibold text-[var(--text)]">
						{request.tracking_token}
					</p>
				</div>
			</div>

			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-6">
				<Card title="Request details" className="h-full">
					<dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						{detailItems.map((item) => (
							<div
								key={item.label}
								className="rounded-xl bg-[var(--surface-muted)] p-3 sm:p-4"
							>
								<dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-soft)]">
									{item.label}
								</dt>
								<dd className="mt-1 break-words text-sm font-semibold text-[var(--text)]">
									{item.value}
								</dd>
							</div>
						))}
						{request.purpose && (
							<div className="rounded-xl bg-[var(--surface-muted)] p-3 sm:col-span-2 sm:p-4">
								<dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-soft)]">
									Purpose
								</dt>
								<dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[var(--text)]">
									{request.purpose}
								</dd>
							</div>
						)}
						{request.decline_reason && (
							<div className="rounded-xl border border-red-200 bg-red-50 p-3 sm:col-span-2 sm:p-4">
								<dt className="text-xs font-medium uppercase tracking-wide text-red-700">
									Reason for decline
								</dt>
								<dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-red-900">
									{request.decline_reason}
								</dd>
							</div>
						)}
					</dl>
				</Card>

				<Card className="flex flex-col items-center text-center">
					<div className="mb-3 self-start text-left">
						<h2 className="font-semibold text-[var(--text)]">
							Keep this request handy
						</h2>
						<p className="mt-1 text-sm text-[var(--text-soft)]">
							Scan the code to reopen this status page.
						</p>
					</div>
					<div className="rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm">
						<img
							src={request.qr_url}
							alt="QR code for request status"
							className="h-36 w-36 max-w-full sm:h-40 sm:w-40"
						/>
					</div>
					<Button
						type="button"
						variant="secondary"
						className="mt-4 w-full"
						onClick={downloadQr}
						loading={downloading}
					>
						Download QR code
					</Button>
				</Card>
			</div>

			{(isAdmin || isStaff) && (
				<Card title="Available actions">
					<p className="mb-4 text-sm text-[var(--text-soft)]">
						Manage this request according to its current status.
					</p>
					<div className="flex flex-col gap-2 sm:flex-row">
						{isAdmin && request.status === 'pending' && (
							<>
								<Button
									className="w-full sm:w-auto"
									disabled={isReadOnlyAdmin}
									onClick={() => setConfirmAction('approve')}
								>
									Approve request
								</Button>
								<Button
									className="w-full sm:w-auto"
									variant="danger"
									disabled={isReadOnlyAdmin}
									onClick={() => setDeclineOpen(true)}
								>
									Decline request
								</Button>
							</>
						)}
						{(isAdmin || isStaff) && request.status === 'approved' && (
							<Button
								className="w-full sm:w-auto"
								onClick={() => setConfirmAction('release')}
							>
								Release item
							</Button>
						)}
						{(isAdmin || isStaff) &&
							isEquipment &&
							request.status === 'released' &&
							transactionId && (
								<Button
									className="w-full sm:w-auto"
									onClick={() => setReturnOpen(true)}
								>
									Return item
								</Button>
							)}
					</div>
				</Card>
			)}

			{!user && (
				<div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-center text-sm text-[var(--text-soft)] sm:p-5">
					<Link
						className="font-semibold text-[var(--accent-strong)] hover:underline"
						to="/login"
					>
						Sign in
					</Link>{' '}
					to manage this request.
				</div>
			)}

			<DeclineReasonModal
				open={declineOpen}
				onClose={() => setDeclineOpen(false)}
				disabled={isReadOnlyAdmin}
				title={`Decline ${isEquipment ? 'Equipment' : 'Supply'} Request`}
				onConfirm={(reason) =>
					refreshAfterAction(async () => {
						if (isEquipment) {
							await equipmentRequestsApi.decline(request.id, reason);
						} else {
							await supplyRequestsApi.decline(request.id, reason);
						}
						dispatchSuccess('Request declined successfully.');
					})
				}
			/>
			<ConfirmActionModal
				open={!!confirmAction}
				onClose={() => setConfirmAction(null)}
				title={
					confirmAction === 'approve' ? 'Approve Request' : 'Release Request'
				}
				message={
					confirmAction === 'approve'
						? `Approve ${request.quantity} unit(s) of ${itemName} for ${request.user?.name || 'the requester'}?`
						: `Confirm that ${request.quantity} unit(s) of ${itemName} are being released to the requester.`
				}
				confirmLabel={
					confirmAction === 'approve' ? 'Approve request' : 'Release item'
				}
				onConfirm={async () => {
					await refreshAfterAction(async () => {
						if (confirmAction === 'approve') {
							await (isEquipment
								? equipmentRequestsApi.approve(request.id)
								: supplyRequestsApi.approve(request.id));
							dispatchSuccess('Request approved successfully.');
							return;
						}
						await (isEquipment
							? releaseReturnApi.releaseEquipment(request.id)
							: releaseReturnApi.releaseSupply(request.id));
						dispatchSuccess('Request released successfully.');
					});
					setConfirmAction(null);
				}}
			/>

			{isEquipment && transactionId && (
				<ReturnEquipmentModal
					open={returnOpen}
					onClose={() => setReturnOpen(false)}
					equipmentRequest={request}
					transactionId={transactionId}
					onSaved={async () => {
						setReturnOpen(false);
						refetch();
					}}
				/>
			)}
		</div>
	);
}
