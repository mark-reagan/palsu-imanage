import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Pagination from '../../components/ui/Pagination';
import PageSkeleton from '../../components/ui/PageSkeleton';
import ErrorAlert from '../../components/ui/ErrorAlert';
import ConfirmActionModal from '../../components/ui/ConfirmActionModal';
import { useApiRequest } from '../../hooks/useApiRequest';
import { formatDateTime } from '../../lib/format';
import { notificationsApi } from './api';
import { useOfflineMode } from '../../hooks/useOfflineMode';
import {
	getNotificationPath,
	useNotificationSoundPreference,
} from './notificationUtils';

// App name for dynamic page title
const APP_NAME = 'PalSU-iManage';

export default function NotificationsPage() {
	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const [clearModalOpen, setClearModalOpen] = useState(false);
	const [soundEnabled, setSoundPreference] = useNotificationSoundPreference();
	const { isReadOnlyAdmin } = useOfflineMode();
	const { data, error, loading, refetch } = useApiRequest(
		(signal) => notificationsApi.list({ page }, signal),
		[page],
	);
	const contentRef = useRef(null);

	const unreadCount = data?.data?.filter((n) => !n.read_at).length || 0;

	useEffect(() => {
		document.title =
			unreadCount > 0 ? `(${unreadCount}) ${APP_NAME}` : APP_NAME;
	}, [unreadCount]);

	useEffect(() => {
		window.addEventListener('app-notification-received', refetch);
		return () =>
			window.removeEventListener('app-notification-received', refetch);
	}, [refetch]);

	useEffect(() => {
		if (!loading && contentRef.current) {
			contentRef.current.focus();
		}
	}, [loading]);

	async function handleOpen(notification) {
		if (!notification.read_at && !isReadOnlyAdmin) {
			try {
				await notificationsApi.markRead(notification.id);
				refetch();
			} catch {
				// Keep navigation available even when updating read state fails.
			}
		}
		navigate(getNotificationPath(notification));
		window.dispatchEvent(new Event('app-notification-received'));
	}

	async function handleMarkAll() {
		if (isReadOnlyAdmin) return;
		await notificationsApi.markAllRead();
		refetch();
	}

	async function handleClearNotifications() {
		await notificationsApi.deleteRead();
		if (page === 1) refetch();
		else setPage(1);
	}

	function toggleSound() {
		setSoundPreference(!soundEnabled);
	}

	return (
		<div className="space-y-4" ref={contentRef}>
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
				<div>
					<h1 className="text-xl font-bold text-slate-900">Notifications</h1>
					<p className="text-sm text-slate-500">
						Review updates about requests, inventory, and account activity.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						className="btn-secondary btn-sm interactive-focus-sm"
						onClick={toggleSound}
						aria-pressed={soundEnabled}
					>
						Sound {soundEnabled ? 'on' : 'off'}
					</button>
					<button
						type="button"
						className="btn-secondary btn-sm interactive-focus-sm"
						onClick={handleMarkAll}
						disabled={
							isReadOnlyAdmin || loading || !data?.data?.some((n) => !n.read_at)
						}
						aria-label="Mark all notifications as read"
					>
						Mark all read
					</button>
					<button
						type="button"
						className="btn-secondary btn-sm interactive-focus-sm"
						onClick={() => setClearModalOpen(true)}
						disabled={
							isReadOnlyAdmin || loading || !(data?.total ?? data?.data?.length)
						}
					>
						Clear notifications
					</button>
				</div>
			</div>

			<Card>
				{loading && <PageSkeleton rows={2} />}
				<ErrorAlert error={error} />
				{!loading && !error && (
					<>
						<div className="divide-y divide-[var(--border)] space-y-1">
							{data?.data?.length ? (
								data.data.map((notification) => (
									<button
										key={notification.id}
										onClick={() => handleOpen(notification)}
										className={`block w-full rounded-lg px-3 py-4 text-left transition-colors hover:bg-[var(--surface-muted)] focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 interactive-focus ${
											notification.read_at
												? 'bg-transparent'
												: 'bg-[var(--accent-soft)]'
										}`}
										aria-label={`Notification: ${notification.data?.title || 'Notification'}`}
									>
										<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
											<div>
												<p className="flex items-center gap-2 font-medium text-[var(--text)]">
													{!notification.read_at && (
														<span
															className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent-strong)]"
															aria-hidden="true"
														/>
													)}
													{notification.data?.title || 'Notification'}
												</p>
												{!notification.read_at && (
													<span className="sr-only">Unread</span>
												)}
												{notification.data?.item_name && (
													<p className="mt-1 text-sm text-[var(--text-soft)]">
														{notification.data.item_name}
													</p>
												)}
												{(notification.data?.from_name ||
													notification.data?.requester_name) && (
													<p className="mt-1 text-sm text-[var(--text-soft)]">
														From:{' '}
														{notification.data.from_name ||
															notification.data.requester_name}
													</p>
												)}
											</div>
											<time
												className="shrink-0 text-xs text-[var(--text-soft)]"
												aria-label={`Created at ${formatDateTime(notification.created_at)}`}
											>
												{formatDateTime(notification.created_at)}
											</time>
										</div>
									</button>
								))
							) : (
								<p
									className="py-10 text-center text-sm text-[var(--text-soft)]"
									role="status"
									aria-live="polite"
								>
									No notifications yet.
								</p>
							)}
						</div>
						<Pagination meta={data} onPageChange={setPage} />
					</>
				)}
			</Card>
			<ConfirmActionModal
				open={clearModalOpen}
				onClose={() => setClearModalOpen(false)}
				onConfirm={handleClearNotifications}
				title="Clear read notifications?"
				message="This permanently removes all read notifications. Unread notifications will not be affected. This action cannot be undone."
				confirmLabel="Clear notifications"
				variant="danger"
			/>
		</div>
	);
}
