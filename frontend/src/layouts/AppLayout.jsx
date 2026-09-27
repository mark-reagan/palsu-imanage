import { Suspense, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import NotificationBell from '../features/notifications/NotificationBell';
import Icon from '../components/ui/Icon';
import Spinner from '../components/ui/Spinner';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import { NAV_ITEMS } from './navConfig';
import { useOfflineMode } from '../hooks/useOfflineMode';

function SidebarLinks({ role, onNavigate }) {
	return (
		<nav className="flex-1 space-y-1 px-3">
			{NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role)).map(
				(item) => (
					<NavLink
						key={item.to}
						to={item.to}
						end={item.to === '/'}
						onClick={onNavigate}
						className={({ isActive }) =>
							`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
								isActive
									? 'bg-brand-700 text-white'
									: 'text-slate-600 hover:bg-slate-100'
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
	const [mobileOpen, setMobileOpen] = useState(false);

	async function handleLogout() {
		await logout();
		navigate('/login', { replace: true });
	}

	return (
		<div className="min-h-screen bg-slate-50">
			{/* Desktop sidebar */}
			<aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
				<div className="flex items-center gap-3 px-5 py-5">
					<img
						src="/palsu-imanage/palsu-imanage-logo.svg"
						alt="PalSU-iManage logo"
						className="h-10 w-10"
					/>
					<div className="leading-tight">
						<span className="block text-sm font-black tracking-tight text-orange-600">
							PalSU-iManage
						</span>
						<span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700">
							Inventory
						</span>
					</div>
				</div>
				<SidebarLinks role={user.role} />
				<div className="border-t border-slate-100 p-3">
					<p className="truncate px-3 text-xs text-slate-400">Signed in as</p>
					<p className="truncate px-3 text-sm font-medium text-slate-800">
						{user.name}
					</p>
				</div>
			</aside>

			{/* Mobile sidebar */}
			{mobileOpen && (
				<div className="fixed inset-0 z-40 lg:hidden">
					<div
						className="absolute inset-0 bg-slate-900/50"
						onClick={() => setMobileOpen(false)}
					/>
					<aside className="relative z-10 flex h-full w-64 flex-col bg-white">
						<div className="flex items-center justify-between px-5 py-5">
							<div className="flex items-center gap-2">
								<img
									src="/palsu-imanage/palsu-imanage-logo.svg"
									alt="PalSU-iManage logo"
									className="h-8 w-8"
								/>
								<span className="text-sm font-black tracking-tight text-orange-600">
									PalSU-iManage
								</span>
							</div>
							<button
								onClick={() => setMobileOpen(false)}
								aria-label="Close menu"
							>
								<Icon name="close" className="h-5 w-5 text-slate-500" />
							</button>
						</div>
						<SidebarLinks
							role={user.role}
							onNavigate={() => setMobileOpen(false)}
						/>
					</aside>
				</div>
			)}

			<div className="lg:pl-64">
				<header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur sm:px-6">
					<button
						className="lg:hidden"
						onClick={() => setMobileOpen(true)}
						aria-label="Open menu"
					>
						<Icon name="menu" className="h-6 w-6 text-slate-600" />
					</button>
					<span className="hidden text-sm font-medium capitalize text-slate-500 lg:block">
						{user.role} portal
					</span>
					<div className="flex items-center gap-3">
						{isReadOnlyAdmin && (
							<span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
								Offline: read-only
							</span>
						)}
						<NotificationBell />
						<NavLink
							to="/profile"
							className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:block"
						>
							{user.name}
						</NavLink>
						<button
							onClick={handleLogout}
							className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
						>
							<Icon name="logout" className="h-4 w-4" />
							<span className="hidden sm:inline">Logout</span>
						</button>
					</div>
				</header>

				<main className="px-4 py-6 sm:px-6 lg:px-8">
					<ErrorBoundary key={location.pathname}>
						<Suspense fallback={<Spinner label="Loading page…" />}>
							<Outlet />
						</Suspense>
					</ErrorBoundary>
				</main>
			</div>
		</div>
	);
}
