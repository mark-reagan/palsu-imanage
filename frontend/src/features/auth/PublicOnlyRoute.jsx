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
			<div className="flex min-h-screen items-center justify-center px-4 py-8">
				<div className="w-full max-w-3xl">
					<PageSkeleton rows={2} />
				</div>
			</div>
		);
	}

	if (isAuthenticated) {
		return <Navigate to="/" replace />;
	}

	return <Outlet />;
}
