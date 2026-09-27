import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';
import SessionLoadingScreen from './SessionLoadingScreen';

/**
 * Keeps already-authenticated users away from /login.
 */
export default function PublicOnlyRoute() {
	const { isAuthenticated, initializing } = useAuth();

	if (initializing) {
		return <SessionLoadingScreen />;
	}

	if (isAuthenticated) {
		return <Navigate to="/" replace />;
	}

	return <Outlet />;
}
