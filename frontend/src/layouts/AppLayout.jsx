import { Suspense, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import NotificationBell from '../features/notifications/NotificationBell';
import Icon from '../components/ui/Icon';
import PageSkeleton from '../components/ui/PageSkeleton';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import { NAV_ITEMS } from './navConfig';
import { useOfflineMode } from '../hooks/useOfflineMode';
import { useTheme } from '../app/useTheme';

function SidebarLinks({ role, onNavigate, mobile = false }) {
	return (
		<nav className="flex-1 space-y-1 px-3 pt-2">
			{NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role)).map(
				(item) => (
					<NavLink
						key={item.to}
						to={item.to}
						end={item.to === '/'}
						onClick={onNavigate}
						className={({ isActive }) =>
							`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
								isActive
									? mobile
										? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20'
										: 'bg-white/15 text-white shadow-sm ring-1 ring-white/20'
									: mobile
										? 'text-orange-50/95 hover:bg-white/10 hover:text-white'
										: 'text-white/90 hover:bg-white/10 hover:text-white'
							}`
						}
					>
						<Icon name={item.icon} className="h-5 w-5 shrink-0" />
						{item.label}
					</NavLink>
				),
			)}
		</nav>
	);
}

export default function AppLayout() {
	const { user, logout } = useAuth();
	const { isReadOnlyAdmin } = useOfflineMode();
	const navigate = useNavigate();
	const location = useLocation();
	const { theme, toggleTheme } = useTheme();
	const [mobileOpen, setMobileOpen] = useState(false);

	useEffect(() => {
		if (!mobileOpen) return undefined;

		const previousOverflow = document.body.style.overflow;
		function handleKeyDown(event) {
			if (event.key === 'Escape') setMobileOpen(false);
		}

		document.body.style.overflow = 'hidden';
		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.body.style.overflow = previousOverflow;
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [mobileOpen]);

	async function handleLogout() {
		await logout();
		navigate('/login', { replace: true });
	}

	return (
		<div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
			{/* Desktop sidebar */}
			<aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-orange-400/30 bg-gradient-to-b from-orange-500 via-orange-500 to-amber-500 text-white shadow-sm lg:flex">
				<div className="flex items-center gap-3 border-b border-orange-200 bg-white px-5 py-5 text-slate-800">
					<img
						src="/palsu-imanage/palsu-imanage-logo.svg"
						alt="PalSU-iManage logo"
						className="h-10 w-10"
					/>
					<div className="leading-tight">
						<span className="brand-text block text-sm font-black tracking-tight text-slate-800">
							PalSU-iManage
						</span>
						<span className="brand-subtitle block text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-600">
							Smarter Management
						</span>
					</div>
				</div>
				<SidebarLinks role={user.role} />
				<div className="border-t border-white/10 p-3">
					<p className="truncate px-3 text-xs text-orange-100/90">
						Signed in as
					</p>
					<p className="truncate px-3 text-sm font-medium text-white">
						{user.name}
					</p>
				</div>
			</aside>

			{/* Mobile sidebar */}
			<div
				className={`fixed inset-0 z-40 transition-opacity duration-300 motion-reduce:transition-none lg:hidden ${
					mobileOpen
						? 'pointer-events-auto opacity-100'
						: 'pointer-events-none opacity-0'
				}`}
				aria-hidden={!mobileOpen}
			>
				<button
					type="button"
					className="absolute inset-0 h-full w-full bg-slate-900/50"
					aria-label="Close navigation menu"
					tabIndex={mobileOpen ? 0 : -1}
					onClick={() => setMobileOpen(false)}
				/>
				<aside
					inert={!mobileOpen}
					aria-label="Mobile navigation"
					className={`relative z-10 flex h-full w-72 flex-col bg-gradient-to-b from-orange-500 via-orange-500 to-amber-500 text-white shadow-2xl transition-transform duration-300 ease-in-out motion-reduce:transition-none ${
						mobileOpen ? 'translate-x-0' : '-translate-x-full'
					}`}
				>
					<div className="flex items-center justify-between border-b border-orange-200 bg-white px-5 py-5 text-slate-800">
						<div className="flex items-center gap-2">
							<img
								src="/palsu-imanage/palsu-imanage-logo.svg"
								alt="PalSU-iManage logo"
								className="h-8 w-8"
							/>
							<span className="brand-text text-sm font-black tracking-tight text-slate-800">
								PalSU-iManage
							</span>
						</div>
						<button
							onClick={() => setMobileOpen(false)}
							aria-label="Close menu"
							className="mobile-close-button rounded-full p-2 text-slate-800 hover:bg-orange-100"
							style={{ color: '#1f2937' }}
						>
							<Icon
								name="close"
								className="h-5 w-5"
								style={{ color: '#1f2937', stroke: '#1f2937' }}
							/>
						</button>
					</div>
					<SidebarLinks
						role={user.role}
						onNavigate={() => setMobileOpen(false)}
						mobile
					/>
				</aside>
			</div>

			<div className="lg:pl-64">
				<header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/80 px-4 py-3 backdrop-blur sm:px-6">
					<button
						className="rounded-lg p-2 text-[var(--text)] transition-transform hover:scale-105 lg:hidden"
						onClick={() => setMobileOpen(true)}
						aria-label="Open menu"
					>
						<Icon name="menu" className="h-6 w-6" />
					</button>
					<span className="hidden text-sm font-medium capitalize text-[var(--text-soft)] lg:block">
						{user.role} portal
					</span>
					<div className="flex items-center gap-3">
						{isReadOnlyAdmin && (
							<span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
								Offline: read-only
							</span>
						)}
						<button
							type="button"
							onClick={toggleTheme}
							className="flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-2 text-[var(--text)] shadow-sm hover:bg-[var(--surface)]"
							aria-label="Toggle theme"
						>
							<Icon
								name={theme === 'light' ? 'moon' : 'sun'}
								className="h-4 w-4 text-[var(--text)]"
							/>
						</button>
						<NotificationBell />
						<NavLink
							to="/profile"
							aria-label={`Profile: ${user.name}`}
							title="Profile"
							className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-muted)] text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface)] sm:h-auto sm:w-auto sm:rounded-lg sm:px-2 sm:py-1.5 sm:font-medium sm:text-[var(--text-soft)] sm:hover:text-[var(--text)]"
						>
							<span className="sm:hidden">
								{user.name.charAt(0).toUpperCase()}
							</span>
							<span className="hidden sm:inline">{user.name}</span>
						</NavLink>
						<button
							onClick={handleLogout}
							className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-[var(--text-soft)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
						>
							<Icon name="logout" className="h-4 w-4" />
							<span className="hidden sm:inline">Logout</span>
						</button>
					</div>
				</header>

				<main className="px-4 py-6 sm:px-6 lg:px-8">
					<ErrorBoundary key={location.pathname}>
						<Suspense fallback={<PageSkeleton />}>
							<Outlet />
						</Suspense>
					</ErrorBoundary>
				</main>
			</div>
		</div>
	);
}
