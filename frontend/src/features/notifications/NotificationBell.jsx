import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { notificationsApi } from './api';
import { formatDateTime } from '../../lib/format';
import { useOfflineMode } from '../../hooks/useOfflineMode';

export default function NotificationBell() {
	const [open, setOpen] = useState(false);
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(false);
	const { isReadOnlyAdmin } = useOfflineMode();
	const ref = useRef(null);

	const loadUnread = useCallback(() => {
		notificationsApi
			.unread()
			.then(setItems)
			.catch(() => setItems([]));
	}, []);

	useEffect(() => {
		loadUnread();
		const interval = setInterval(loadUnread, 30000);
		return () => clearInterval(interval);
	}, [loadUnread]);

	useEffect(() => {
		function onClickOutside(e) {
			if (ref.current && !ref.current.contains(e.target)) setOpen(false);
		}
		document.addEventListener('mousedown', onClickOutside);
		return () => document.removeEventListener('mousedown', onClickOutside);
	}, []);

	async function handleMarkAll() {
		if (isReadOnlyAdmin) return;
		setLoading(true);
		try {
			await notificationsApi.markAllRead();
			setItems([]);
		} finally {
			setLoading(false);
		}
	}

	async function handleMarkOne(id) {
		if (isReadOnlyAdmin) return;
		await notificationsApi.markRead(id);
		setItems((prev) => prev.filter((n) => n.id !== id));
	}

	return (
		<div className="relative" ref={ref}>
			<button
				onClick={() => setOpen((o) => !o)}
				className="relative rounded-full p-2 text-[var(--text-soft)] hover:bg-[var(--surface-muted)]"
				aria-label="Notifications"
			>
				<svg
					className="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={1.5}
						d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
					/>
				</svg>
				{items.length > 0 && (
					<span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
						{items.length > 9 ? '9+' : items.length}
					</span>
				)}
			</button>

			{open && (
				<div className="absolute right-0 z-20 mt-2 w-80 rounded-xl bg-[var(--surface-strong)] p-2 shadow-lg ring-1 ring-[var(--border)]">
					<div className="flex items-center justify-between px-2 py-1">
						<p className="text-sm font-semibold text-[var(--text)]">
							Notifications
						</p>
						<div className="flex items-center gap-3">
							<Link
								to="/notifications"
								onClick={() => setOpen(false)}
								className="text-xs font-medium text-brand-700 hover:text-brand-800"
							>
								View all
							</Link>
							<button
								onClick={handleMarkAll}
								disabled={isReadOnlyAdmin || loading || items.length === 0}
								className="text-xs font-medium text-brand-700 hover:text-brand-800 disabled:opacity-40"
							>
								Mark all read
							</button>
						</div>
					</div>
					<div className="max-h-80 overflow-y-auto">
						{items.length === 0 ? (
							<p className="px-2 py-6 text-center text-sm text-[var(--text-soft)]">
								You&apos;re all caught up.
							</p>
						) : (
							items.map((n) => (
								<button
									key={n.id}
									onClick={() => handleMarkOne(n.id)}
									disabled={isReadOnlyAdmin}
									className="block w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-[var(--surface-muted)]"
								>
									<p className="font-medium text-[var(--text)]">
										{n.data?.title || 'Notification'}
									</p>
									{n.data?.item_name && (
										<p className="text-[var(--text-soft)]">
											{n.data.item_name}
										</p>
									)}
									{n.data?.reason && (
										<p className="text-[var(--text-soft)]">
											Reason: {n.data.reason}
										</p>
									)}
									<p className="mt-0.5 text-xs text-[var(--text-soft)]">
										{formatDateTime(n.created_at)}
									</p>
								</button>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
}
