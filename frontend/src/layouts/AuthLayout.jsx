import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-10 transition-colors duration-200">
			<div className="w-full max-w-sm">
				<div className="mb-8 flex flex-col items-center gap-3 text-center">
					<img
						src="/palsu-imanage/palsu-imanage-branding.png"
						alt="PalSU-iManage branding logo"
						className="h-16 w-auto max-w-[220px]"
					/>
					<p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent-strong)]">
						Inventory System
					</p>
				</div>
				<Outlet />
			</div>
		</div>
	);
}
