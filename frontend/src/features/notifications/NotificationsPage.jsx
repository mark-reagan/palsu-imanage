import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Pagination from '../../components/ui/Pagination';
import PageSkeleton from '../../components/ui/PageSkeleton';
import ErrorAlert from '../../components/ui/ErrorAlert';
import { useApiRequest } from '../../hooks/useApiRequest';
import { formatDateTime } from '../../lib/format';
import { notificationsApi } from './api';
import { useOfflineMode } from '../../hooks/useOfflineMode';
import {
	getNotificationPath,
	useNotificationSoundPreference,
} from './notificationUtils';

export default function NotificationsPage() {
	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const [soundEnabled, setSoundPreference] = useNotificationSoundPreference();
	const { isReadOnlyAdmin } = useOfflineMode();
	const { data, error, loading, refetch } = useApiRequest(
		(signal) => notificationsApi.list({ page }, signal),
		[page],
	);

	useEffect(() => {
		window.addEventListener('app-notification-received', refetch);
		return () =>
			window.removeEventListener('app-notification-received', refetch);
	}, [refetch]);

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
	}

	async function handleMarkAll() {
		if (isReadOnlyAdmin) return;
		await notificationsApi.markAllRead();
		refetch();
	}

	function toggleSound() {
		setSoundPreference(!soundEnabled);
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
				<div>
					<h1 className="text-xl font-bold text-slate-900">Notifications</h1>
					<p className="text-sm text-slate-500">
						Review updates about requests, inventory, and account activity.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<button
						className="btn-secondary btn-sm"
						onClick={toggleSound}
						aria-pressed={soundEnabled}
					>
						Sound {soundEnabled ? 'on' : 'off'}
					</button>
					<button
						className="btn-secondary btn-sm"
						onClick={handleMarkAll}
						disabled={
							isReadOnlyAdmin || loading || !data?.data?.some((n) => !n.read_at)
						}
					>
						Mark all read
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
										className={`block w-full rounded-lg px-3 py-4 text-left transition-colors hover:bg-[var(--surface-muted)] ${notification.read_at ? 'bg-transparent' : 'bg-[var(--accent-soft)]'}`}
									>
										<div className="flex items-start justify-between gap-4">
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
												{notification.data?.reason && (
													<p className="mt-1 text-sm text-[var(--text-soft)]">
														Reason: {notification.data.reason}
													</p>
												)}
											</div>
											<time className="shrink-0 text-xs text-[var(--text-soft)]">
												{formatDateTime(notification.created_at)}
											</time>
										</div>
									</button>
								))
							) : (
								<p className="py-10 text-center text-sm text-[var(--text-soft)]">
									No notifications yet.
								</p>
							)}
						</div>
						<Pagination meta={data} onPageChange={setPage} />
					</>
				)}
			</Card>
		</div>
	);
}
