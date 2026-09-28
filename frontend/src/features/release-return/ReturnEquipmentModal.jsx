import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import ErrorAlert from '../../components/ui/ErrorAlert';
import ConfirmActionModal from '../../components/ui/ConfirmActionModal';
import { EQUIPMENT_CONDITIONS } from '../../lib/constants';
import { releaseReturnApi } from './api';
import { dispatchSuccess } from '../../lib/toast';

export default function ReturnEquipmentModal({
	open,
	onClose,
	equipmentRequest,
	transactionId,
	onSaved,
}) {
	const [form, setForm] = useState({
		condition_on_return: 'good',
		remarks: '',
	});
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(false);
	const [confirming, setConfirming] = useState(false);

	async function handleSubmit(e) {
		e.preventDefault();
		setConfirming(true);
	}

	async function confirmReturn() {
		setError(null);
		setLoading(true);
		try {
			await releaseReturnApi.returnEquipment(transactionId, form);
			onSaved?.();
			dispatchSuccess('Equipment return recorded successfully.');
			onClose();
		} finally {
			setLoading(false);
		}
	}

	return (
		<>
			<Modal
				open={open && !confirming}
				onClose={onClose}
				title={`Confirm Return — ${equipmentRequest?.equipment?.name || ''}`}
			>
				<form onSubmit={handleSubmit} className="space-y-4">
					<Select
						label="Condition on return"
						value={form.condition_on_return}
						onChange={(e) =>
							setForm({ ...form, condition_on_return: e.target.value })
						}
					>
						{EQUIPMENT_CONDITIONS.map((c) => (
							<option key={c} value={c}>
								{c.replace('_', ' ')}
							</option>
						))}
					</Select>
					<Textarea
						label="Remarks (optional)"
						value={form.remarks}
						onChange={(e) => setForm({ ...form, remarks: e.target.value })}
						placeholder="Any notes about the condition or return…"
					/>

					<ErrorAlert error={error} />

					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="secondary" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" loading={loading}>
							Review return
						</Button>
					</div>
				</form>
			</Modal>
			<ConfirmActionModal
				open={confirming}
				onClose={() => setConfirming(false)}
				title="Confirm Equipment Return"
				message={`Record ${equipmentRequest?.equipment?.name || 'this equipment'} as returned in ${form.condition_on_return.replace('_', ' ')} condition${form.remarks ? ` with remarks: ${form.remarks}` : ''}?`}
				confirmLabel="Confirm return"
				onConfirm={async () => {
					await confirmReturn();
					setConfirming(false);
				}}
			/>
		</>
	);
}
