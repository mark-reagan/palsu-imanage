import { useState } from 'react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ErrorAlert from '../../components/ui/ErrorAlert';
import ConfirmActionModal from '../../components/ui/ConfirmActionModal';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../auth/useAuth';
import { authApi } from '../auth/api';
import { useOfflineMode } from '../../hooks/useOfflineMode';
import { dispatchSuccess } from '../../lib/toast';

export default function ProfilePage() {
	const { user, refreshUser } = useAuth();
	const { isReadOnlyAdmin } = useOfflineMode();
	const [form, setForm] = useState({
		name: user.name,
		department: user.department || '',
		contact_number: user.contact_number || '',
		password: '',
		password_confirmation: '',
	});
	const [error, setError] = useState(null);
	const [confirmOpen, setConfirmOpen] = useState(false);

	function update(field, value) {
		setForm((f) => ({ ...f, [field]: value }));
	}

	function handleSubmit(e) {
		e.preventDefault();
		setConfirmOpen(true);
	}

	async function confirmSave() {
		if (isReadOnlyAdmin) return;
		setError(null);
		const payload = {
			name: form.name,
			department: form.department,
			contact_number: form.contact_number,
		};
		if (form.password) {
			payload.password = form.password;
			payload.password_confirmation = form.password_confirmation;
		}
		await authApi.updateProfile(payload);
		await refreshUser();
		setForm((f) => ({ ...f, password: '', password_confirmation: '' }));
		dispatchSuccess('Profile updated successfully.');
	}

	return (
		<div className="max-w-lg space-y-4">
			<div>
				<h1 className="text-xl font-bold text-slate-900">Your Profile</h1>
				<p className="text-sm text-slate-500">Update your account details.</p>
			</div>

			<Card>
				<div className="mb-4 flex items-center gap-3">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">
						{user.name.charAt(0).toUpperCase()}
					</div>
					<div>
						<p className="font-medium text-slate-900">{user.email}</p>
						<Badge status={user.role} className="profile-role-badge">
							{user.role}
						</Badge>
					</div>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<Input
						label="Full name"
						name="name"
						value={form.name}
						onChange={(e) => update('name', e.target.value)}
					/>
					<Input
						label="Department / Office"
						name="department"
						value={form.department}
						onChange={(e) => update('department', e.target.value)}
					/>
					<Input
						label="Contact number"
						name="contact_number"
						value={form.contact_number}
						onChange={(e) => update('contact_number', e.target.value)}
					/>
					<hr className="border-slate-100" />
					<Input
						label="New password (leave blank to keep current)"
						type="password"
						name="password"
						value={form.password}
						onChange={(e) => update('password', e.target.value)}
					/>
					<Input
						label="Confirm new password"
						type="password"
						name="password_confirmation"
						value={form.password_confirmation}
						onChange={(e) => update('password_confirmation', e.target.value)}
					/>

					<ErrorAlert error={error} />

					<Button type="submit" disabled={isReadOnlyAdmin}>
						Review changes
					</Button>
				</form>
			</Card>
			<ConfirmActionModal
				open={confirmOpen}
				onClose={() => setConfirmOpen(false)}
				title="Confirm Profile Changes"
				message="Save the profile details and any password change you entered?"
				confirmLabel="Save changes"
				onConfirm={async () => {
					await confirmSave();
					setConfirmOpen(false);
				}}
			/>
		</div>
	);
}
