import { useState } from 'react';
import Card from '../../components/ui/Card';
import Pagination from '../../components/ui/Pagination';
import Spinner from '../../components/ui/Spinner';
import ErrorAlert from '../../components/ui/ErrorAlert';
import { useApiRequest } from '../../hooks/useApiRequest';
import { formatDateTime } from '../../lib/format';
import { notificationsApi } from './api';
import { useOfflineMode } from '../../hooks/useOfflineMode';

export default function NotificationsPage() {
	const [page, setPage] = useState(1);
	const { isReadOnlyAdmin } = useOfflineMode();
	const { data, error, loading, refetch } = useApiRequest(
		(signal) => notificationsApi.list({ page }, signal),
		[page],
	);

	async function handleMarkRead(id) {
		if (isReadOnlyAdmin) return;
		await notificationsApi.markRead(id);
		refetch();
	}

	async function handleMarkAll() {
		if (isReadOnlyAdmin) return;
		await notificationsApi.markAllRead();
		refetch();
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
				<button
					className="btn-secondary btn-sm"
					onClick={handleMarkAll}
					disabled={isReadOnlyAdmin || loading || !data?.data?.length}
				>
					Mark all read
				</button>
			</div>

			<Card>
				{loading && <Spinner />}
				<ErrorAlert error={error} />
				{!loading && !error && (
					<>
						<div className="divide-y divide-slate-100">
							{data?.data?.length ? (
								data.data.map((notification) => (
									<button
										key={notification.id}
										onClick={() => handleMarkRead(notification.id)}
										disabled={isReadOnlyAdmin}
										className="block w-full px-2 py-4 text-left hover:bg-[var(--surface-muted)]"
									>
										<div className="flex items-start justify-between gap-4">
											<div>
												<p className="font-medium text-slate-900">
													{notification.data?.title || 'Notification'}
												</p>
												{notification.data?.item_name && (
													<p className="mt-1 text-sm text-slate-600">
														{notification.data.item_name}
													</p>
												)}
												{notification.data?.reason && (
													<p className="mt-1 text-sm text-slate-600">
														Reason: {notification.data.reason}
													</p>
												)}
											</div>
											<time className="shrink-0 text-xs text-slate-400">
												{formatDateTime(notification.created_at)}
											</time>
										</div>
									</button>
								))
							) : (
								<p className="py-10 text-center text-sm text-slate-400">
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
