import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import ErrorAlert from '../../components/ui/ErrorAlert';
import ConfirmActionModal from '../../components/ui/ConfirmActionModal';
import { EQUIPMENT_CONDITIONS } from '../../lib/constants';
import { concernsApi } from './api';
import { useOfflineMode } from '../../hooks/useOfflineMode';

export default function ReviewConcernModal({
	open,
	onClose,
	concern,
	onSaved,
	disabled = false,
}) {
	const [form, setForm] = useState({
		status: 'reviewed',
		admin_remarks: '',
		update_condition: '',
	});
	const [error, setError] = useState(null);
	const [confirming, setConfirming] = useState(false);
	const { isReadOnlyAdmin } = useOfflineMode();

	function handleSubmit(e) {
		e.preventDefault();
		if (disabled || isReadOnlyAdmin) return;
		setConfirming(true);
	}

	async function confirmReview() {
		setError(null);
		try {
			const payload = { ...form };
			if (!payload.update_condition) delete payload.update_condition;
			await concernsApi.review(concern.id, payload);
			onSaved?.();
			window.dispatchEvent(
				new CustomEvent('app-success', {
					detail: { message: 'Concern review saved successfully.' },
				}),
			);
			onClose();
		} catch (err) {
			setError(err);
			throw err;
		}
	}

	return (
		<>
			<Modal
				open={open && !confirming}
				onClose={onClose}
				title={`Review Concern — ${concern?.equipment?.name || ''}`}
			>
				<form onSubmit={handleSubmit} className="space-y-4">
					<p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
						{concern?.description}
					</p>

					<Select
						label="Status"
						value={form.status}
						onChange={(e) => setForm({ ...form, status: e.target.value })}
					>
						<option value="reviewed">Reviewed</option>
						<option value="resolved">Resolved</option>
					</Select>

					<Select
						label="Update equipment condition (optional)"
						value={form.update_condition}
						onChange={(e) =>
							setForm({ ...form, update_condition: e.target.value })
						}
					>
						<option value="">Don&apos;t change</option>
						{EQUIPMENT_CONDITIONS.map((c) => (
							<option key={c} value={c}>
								{c.replace('_', ' ')}
							</option>
						))}
					</Select>

					<Textarea
						label="Admin remarks (optional)"
						value={form.admin_remarks}
						onChange={(e) =>
							setForm({ ...form, admin_remarks: e.target.value })
						}
					/>

					<ErrorAlert error={error} />

					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="secondary" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={disabled || isReadOnlyAdmin}>
							Review changes
						</Button>
					</div>
				</form>
			</Modal>
			<ConfirmActionModal
				open={open && confirming}
				onClose={() => setConfirming(false)}
				title="Confirm Concern Review"
				message={`Save this concern as ${form.status}${form.update_condition ? ` and change the equipment condition to ${form.update_condition.replace('_', ' ')}` : ''}?`}
				confirmLabel="Save review"
				onConfirm={async () => {
					await confirmReview();
					setConfirming(false);
				}}
			/>
		</>
	);
}
