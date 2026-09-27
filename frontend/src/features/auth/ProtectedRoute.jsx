import { Navigate, Outlet, useLocation } from 'react-router-dom';
import PageSkeleton from '../../components/ui/PageSkeleton';
import { useAuth } from './useAuth';

export default function ProtectedRoute({ roles }) {
	const { isAuthenticated, initializing, user } = useAuth();
	const location = useLocation();

	if (initializing) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-8">
				<div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-soft">
					<PageSkeleton rows={1} branded />
				</div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	if (roles && !roles.includes(user.role)) {
		return <Navigate to="/" replace />;
	}

	return <Outlet />;
}
