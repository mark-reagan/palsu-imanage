import { Navigate, Outlet, useLocation } from 'react-router-dom';
import SessionLoadingScreen from './SessionLoadingScreen';
import { useAuth } from './useAuth';

export default function ProtectedRoute({ roles }) {
	const { isAuthenticated, initializing, user } = useAuth();
	const location = useLocation();

	if (initializing) {
		return <SessionLoadingScreen />;
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	if (roles && !roles.includes(user.role)) {
		return <Navigate to="/" replace />;
	}

	return <Outlet />;
}
