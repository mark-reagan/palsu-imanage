import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import AppLayout from '../layouts/AppLayout';
import ProtectedRoute from '../features/auth/ProtectedRoute';
import PublicOnlyRoute from '../features/auth/PublicOnlyRoute';
import { ROLES } from '../lib/constants';
import PageSkeleton from '../components/ui/PageSkeleton';

// Route-level code splitting: each page is only downloaded when visited.
const LoginPage = lazy(() => import('../features/auth/LoginPage'));
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'));
const EquipmentListPage = lazy(
	() => import('../features/equipment/EquipmentListPage'),
);
const SuppliesListPage = lazy(
	() => import('../features/supplies/SuppliesListPage'),
);
const EquipmentRequestsPage = lazy(
	() => import('../features/equipment-requests/EquipmentRequestsPage'),
);
const SupplyRequestsPage = lazy(
	() => import('../features/supply-requests/SupplyRequestsPage'),
);
const ReleaseReturnPage = lazy(
	() => import('../features/release-return/ReleaseReturnPage'),
);
const QrScanPage = lazy(() => import('../features/qrcode/QrScanPage'));
const ConcernsPage = lazy(() => import('../features/concerns/ConcernsPage'));
const UsersPage = lazy(() => import('../features/users/UsersPage'));
const ReportsPage = lazy(() => import('../features/reports/ReportsPage'));
const ProfilePage = lazy(() => import('../features/profile/ProfilePage'));
const NotificationsPage = lazy(
	() => import('../features/notifications/NotificationsPage'),
);
const PublicRequestStatusPage = lazy(
	() => import('../features/request-tracking/PublicRequestStatusPage'),
);

export default function AppRoutes() {
	return (
		<Suspense fallback={<PageSkeleton />}>
			<Routes>
				<Route element={<PublicOnlyRoute />}>
					<Route element={<AuthLayout />}>
						<Route path="/login" element={<LoginPage />} />
					</Route>
				</Route>
				<Route
					path="/track/:trackingToken"
					element={<PublicRequestStatusPage />}
				/>

				<Route element={<ProtectedRoute />}>
					<Route element={<AppLayout />}>
						<Route path="/" element={<DashboardPage />} />
						<Route
							element={
								<ProtectedRoute
									roles={[ROLES.ADMIN, ROLES.FACULTY, ROLES.OUTSIDER]}
								/>
							}
						>
							<Route path="/equipment" element={<EquipmentListPage />} />
						</Route>
						<Route
							element={<ProtectedRoute roles={[ROLES.ADMIN, ROLES.FACULTY]} />}
						>
							<Route path="/supplies" element={<SuppliesListPage />} />
						</Route>
						<Route
							path="/equipment-requests"
							element={<EquipmentRequestsPage />}
						/>
						<Route path="/concerns" element={<ConcernsPage />} />
						<Route path="/notifications" element={<NotificationsPage />} />
						<Route path="/profile" element={<ProfilePage />} />

						<Route
							element={
								<ProtectedRoute
									roles={[ROLES.ADMIN, ROLES.STAFF, ROLES.FACULTY]}
								/>
							}
						>
							<Route path="/supply-requests" element={<SupplyRequestsPage />} />
						</Route>

						<Route
							element={<ProtectedRoute roles={[ROLES.ADMIN, ROLES.STAFF]} />}
						>
							<Route path="/release-return" element={<ReleaseReturnPage />} />
						</Route>
						<Route
							element={<ProtectedRoute roles={[ROLES.ADMIN, ROLES.STAFF]} />}
						>
							<Route path="/qr-scan" element={<QrScanPage />} />
						</Route>
						<Route element={<ProtectedRoute roles={[ROLES.STAFF]} />}>
							<Route
								path="/barcode-scan"
								element={<Navigate to="/qr-scan" replace />}
							/>
						</Route>

						<Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
							<Route path="/users" element={<UsersPage />} />
							<Route path="/reports" element={<ReportsPage />} />
						</Route>
					</Route>
				</Route>

				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</Suspense>
	);
}
