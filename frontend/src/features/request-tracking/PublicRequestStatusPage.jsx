import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DeclineReasonModal from '../../components/ui/DeclineReasonModal';
import ErrorAlert from '../../components/ui/ErrorAlert';
import SuccessAlert from '../../components/ui/SuccessAlert';
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

export default function PublicRequestStatusPage() {
	const { trackingToken } = useParams();
	const navigate = useNavigate();
	const { user } = useAuth();
	const { isReadOnlyAdmin } = useOfflineMode();
	const [actionError, setActionError] = useState(null);
	const [successMessage, setSuccessMessage] = useState('');
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

	async function downloadQr() {
		setDownloading(true);
		setActionError(null);
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
			setActionError({ message: downloadError.message });
		} finally {
			setDownloading(false);
		}
	}

	async function refreshAfterAction(action) {
		if (isReadOnlyAdmin) return;
		setActionError(null);
		setSuccessMessage('');
		try {
			await action();
			await refetch();
			setDeclineOpen(false);
		} catch (requestError) {
			setActionError(requestError);
			throw requestError;
		}
	}

	const transactionId = request.transaction?.id;

	return (
		<div className="mx-auto w-full max-w-5xl space-y-5 px-4 pb-8 pt-3 sm:pt-6">
			<div className="flex items-center justify-between">
				<Button
					type="button"
					variant="secondary"
					size="sm"
					onClick={() => navigate(-1)}
				>
					<span aria-hidden="true">←</span> Back
				</Button>
				<span className="hidden text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-soft)] sm:block">
					Request tracking
				</span>
			</div>
			<div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[linear-gradient(135deg,var(--surface-strong),var(--surface-muted))] p-5 shadow-[0_18px_50px_var(--shadow)] sm:p-8">
				<div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[var(--accent-soft)] opacity-40 blur-3xl" />
				<div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
					<div className="min-w-0">
						<div className="mb-3 flex items-center gap-2">
							<span
								className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-lg"
								aria-hidden="true"
							>
								{isEquipment ? '▣' : '▤'}
							</span>
							<p className="text-sm font-semibold text-[var(--accent-strong)]">
								{itemType}
							</p>
						</div>
						<h1 className="break-words text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
							{itemName}
						</h1>
						<p className="mt-2 text-sm text-[var(--text-soft)]">
							Submitted {formatDate(request.created_at)}
						</p>
						<div className="mt-4 inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
							<span className="text-[var(--text-soft)]">Tracking code</span>
							<span className="break-all font-mono font-semibold text-[var(--text)]">
								{request.tracking_token}
							</span>
						</div>
					</div>
					<div className="flex shrink-0 items-center gap-3 self-start rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:self-center sm:px-4 sm:py-3">
						<span
							className="h-2.5 w-2.5 rounded-full bg-[var(--accent-strong)]"
							aria-hidden="true"
						/>
						<div>
							<p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-soft)]">
								Current status
							</p>
							<div className="mt-1">
								<Badge status={request.status} className="px-3 py-1 text-sm" />
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
				<Card title="Request details" className="h-full">
					<dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
							<dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-soft)]">
								Quantity
							</dt>
							<dd className="mt-1 text-lg font-semibold text-[var(--text)]">
								{request.quantity}
							</dd>
						</div>
						{request.start_date && (
							<div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
								<dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-soft)]">
									Reservation period
								</dt>
								<dd className="mt-1 font-semibold text-[var(--text)]">
									{formatDate(request.start_date)} –{' '}
									{formatDate(request.end_date)}
								</dd>
							</div>
						)}
						{request.approver?.name && (
							<div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
								<dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-soft)]">
									{request.status === 'declined'
										? 'Reviewed by'
										: 'Approved by'}
								</dt>
								<dd className="mt-1 font-semibold text-[var(--text)]">
									{request.approver.name}
								</dd>
							</div>
						)}
						{request.approved_at && (
							<div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
								<dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-soft)]">
									Reviewed at
								</dt>
								<dd className="mt-1 font-semibold text-[var(--text)]">
									{formatDate(request.approved_at)}
								</dd>
							</div>
						)}
						{request.purpose && (
							<div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 sm:col-span-2">
								<dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-soft)]">
									Purpose
								</dt>
								<dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[var(--text)]">
									{request.purpose}
								</dd>
							</div>
						)}
						{request.transaction?.released_by?.name && (
							<div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
								<dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-soft)]">
									Released by
								</dt>
								<dd className="mt-1 font-semibold text-[var(--text)]">
									{request.transaction.released_by.name}
								</dd>
							</div>
						)}
						{request.transaction?.released_at && (
							<div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
								<dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-soft)]">
									Released at
								</dt>
								<dd className="mt-1 font-semibold text-[var(--text)]">
									{formatDate(request.transaction.released_at)}
								</dd>
							</div>
						)}
						{request.transaction?.received_by?.name && (
							<div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
								<dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-soft)]">
									Received by
								</dt>
								<dd className="mt-1 font-semibold text-[var(--text)]">
									{request.transaction.received_by.name}
								</dd>
							</div>
						)}
						{request.transaction?.returned_at && (
							<div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
								<dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-soft)]">
									Returned at
								</dt>
								<dd className="mt-1 font-semibold text-[var(--text)]">
									{formatDate(request.transaction.returned_at)}
								</dd>
							</div>
						)}
						{request.decline_reason && (
							<div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:col-span-2">
								<dt className="text-xs font-medium uppercase tracking-wide text-red-700">
									Reason for decline
								</dt>
								<dd className="mt-1 text-sm leading-6 text-red-900">
									{request.decline_reason}
								</dd>
							</div>
						)}
					</dl>
				</Card>

				<Card className="flex flex-col items-center justify-center text-center">
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
							className="h-40 w-40 max-w-full"
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
					<ErrorAlert error={actionError} className="mt-4" />
					<SuccessAlert message={successMessage} className="mt-4" />
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
						setSuccessMessage('Request declined successfully.');
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
							setSuccessMessage('Request approved successfully.');
							return;
						}
						await (isEquipment
							? releaseReturnApi.releaseEquipment(request.id)
							: releaseReturnApi.releaseSupply(request.id));
						setSuccessMessage('Request released successfully.');
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
						setSuccessMessage('Equipment return recorded successfully.');
					}}
				/>
			)}
		</div>
	);
}
