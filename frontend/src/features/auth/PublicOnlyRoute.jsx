import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';
import PageSkeleton from '../../components/ui/PageSkeleton';

/**
 * Keeps already-authenticated users away from /login.
 */
export default function PublicOnlyRoute() {
	const { isAuthenticated, initializing } = useAuth();

	if (initializing) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-8">
				<div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-soft">
					<PageSkeleton rows={1} branded />
				</div>
			</div>
		);
	}

	if (isAuthenticated) {
		return <Navigate to="/" replace />;
	}

	return <Outlet />;
}
