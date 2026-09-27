import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 px-4">
			<div className="w-full max-w-sm">
				<div className="mb-8 flex flex-col items-center gap-3 text-center">
					<img
						src="/palsu-imanage/palsu-imanage-branding.png"
						alt="PalSU-iManage branding logo"
						className="h-16 w-auto max-w-[220px]"
					/>
					<p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-700">
						Inventory System
					</p>
				</div>
				<Outlet />
			</div>
		</div>
	);
}
