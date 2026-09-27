import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import ErrorAlert from '../../components/ui/ErrorAlert';
import ConfirmActionModal from '../../components/ui/ConfirmActionModal';
import { usersApi } from './api';
import { useOfflineMode } from '../../hooks/useOfflineMode';

const EMPTY = {
	name: '',
	email: '',
	password: '',
	password_confirmation: '',
	role: 'faculty',
	department: '',
	contact_number: '',
};

export default function UserFormModal(props) {
	if (!props.open) return null;
	return <UserFormModalContent key={props.user?.id ?? 'new'} {...props} />;
}

function UserFormModalContent({ open, onClose, onSaved, user }) {
	const isEdit = !!user;
	const { isReadOnlyAdmin } = useOfflineMode();
	const [form, setForm] = useState(() =>
		user
			? {
					name: user.name,
					email: user.email,
					password: '',
					password_confirmation: '',
					role: user.role,
					department: user.department || '',
					contact_number: user.contact_number || '',
				}
			: { ...EMPTY },
	);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(false);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [pendingPayload, setPendingPayload] = useState(null);

	function update(field, value) {
		setForm((f) => ({ ...f, [field]: value }));
	}

	async function handleSubmit(e) {
		e.preventDefault();
		if (isReadOnlyAdmin) return;
		setError(null);
		if (form.password && form.password !== form.password_confirmation) {
			setError('Password confirmation does not match.');
			return;
		}
		if (!isEdit && !form.password_confirmation) {
			setError('Please confirm the password.');
			return;
		}
		const payload = { ...form };
		if (isEdit && !payload.password) {
			delete payload.password;
			delete payload.password_confirmation;
		}
		setPendingPayload(payload);
		setConfirmOpen(true);
	}

	async function confirmSave() {
		if (isReadOnlyAdmin || !pendingPayload) return;
		setLoading(true);
		try {
			const saved = isEdit
				? await usersApi.update(user.id, pendingPayload)
				: await usersApi.create(pendingPayload);
			onSaved(saved);
			window.dispatchEvent(
				new CustomEvent('app-success', {
					detail: {
						message: isEdit
							? 'User updated successfully.'
							: 'User account created successfully.',
					},
				}),
			);
			setConfirmOpen(false);
			onClose();
		} catch (err) {
			setError(err);
			throw err;
		} finally {
			setLoading(false);
		}
	}

	return (
		<>
			<Modal
				open={open}
				onClose={onClose}
				title={isEdit ? 'Edit User' : 'Add User'}
			>
				<form onSubmit={handleSubmit} className="space-y-4">
					<Input
						label="Full name"
						name="name"
						required
						value={form.name}
						onChange={(e) => update('name', e.target.value)}
					/>
					<Input
						label="Email address"
						type="email"
						name="email"
						required
						value={form.email}
						onChange={(e) => update('email', e.target.value)}
					/>
					<Select
						label="Role"
						name="role"
						value={form.role}
						onChange={(e) => update('role', e.target.value)}
					>
						<option value="admin">Admin</option>
						<option value="staff">Staff</option>
						<option value="faculty">Faculty</option>
						<option value="outsider">Outsider / Municipal / LGU</option>
					</Select>
					<div className="grid grid-cols-2 gap-4">
						<Input
							label="Department (optional)"
							name="department"
							value={form.department}
							onChange={(e) => update('department', e.target.value)}
						/>
						<Input
							label="Contact number (optional)"
							name="contact_number"
							value={form.contact_number}
							onChange={(e) => update('contact_number', e.target.value)}
						/>
					</div>
					<Input
						label={
							isEdit ? 'New password (leave blank to keep current)' : 'Password'
						}
						type="password"
						name="password"
						autoComplete="new-password"
						minLength={8}
						required={!isEdit}
						value={form.password}
						onChange={(e) => update('password', e.target.value)}
					/>
					<Input
						label={isEdit ? 'Confirm new password' : 'Confirm password'}
						type="password"
						name="password_confirmation"
						autoComplete="new-password"
						minLength={8}
						required={!isEdit || Boolean(form.password)}
						value={form.password_confirmation}
						onChange={(e) => update('password_confirmation', e.target.value)}
					/>

					<ErrorAlert error={error} />

					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="secondary"
							onClick={() => {
								setError(null);
								onClose();
							}}
						>
							Cancel
						</Button>
						<Button type="submit" loading={loading} disabled={isReadOnlyAdmin}>
							{isEdit ? 'Save changes' : 'Create user'}
						</Button>
					</div>
				</form>
			</Modal>
			<ConfirmActionModal
				open={confirmOpen}
				onClose={() => setConfirmOpen(false)}
				title={isEdit ? 'Confirm User Changes' : 'Confirm New User'}
				message={`${isEdit ? 'Save changes to' : 'Create account for'} ${form.name || 'this user'}?`}
				confirmLabel={isEdit ? 'Save changes' : 'Create user'}
				onConfirm={confirmSave}
			/>
		</>
	);
}
