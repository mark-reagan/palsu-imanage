import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-10 transition-colors duration-200">
			<div className="w-full max-w-sm">
				<img
					src="/palsu-imanage/palsu-imanage-branding.png"
					alt="PalSU-iManage branding logo"
					className="block h-auto w-full rounded-t-2xl rounded-b-none"
				/>
				<Outlet />
			</div>
		</div>
	);
}
