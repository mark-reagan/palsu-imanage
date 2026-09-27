import { useAuth } from '../auth/useAuth';
import { ROLES } from '../../lib/constants';
import AdminDashboard from './AdminDashboard';
import StaffDashboard from './StaffDashboard';
import RequesterDashboard from './RequesterDashboard';

export default function DashboardPage() {
	const { user } = useAuth();

	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-xl font-bold text-[var(--text)]">
					Welcome back, {user.name}
				</h1>
				<p className="text-sm text-[var(--text-soft)]">
					Here&apos;s what&apos;s happening in the inventory system today.
				</p>
			</div>

			{user.role === ROLES.ADMIN && <AdminDashboard />}
			{user.role === ROLES.STAFF && <StaffDashboard />}
			{(user.role === ROLES.FACULTY || user.role === ROLES.OUTSIDER) && (
				<RequesterDashboard />
			)}
		</div>
	);
}
