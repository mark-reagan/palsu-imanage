import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import ErrorAlert from '../../components/ui/ErrorAlert';
import ConfirmActionModal from '../../components/ui/ConfirmActionModal';
import { useApiRequest } from '../../hooks/useApiRequest';
import { CONCERN_SEVERITIES } from '../../lib/constants';
import { equipmentApi } from '../equipment/api';
import { concernsApi } from './api';

const EMPTY = { equipment_id: '', description: '', severity: 'minor' };

export default function NewConcernModal(props) {
	if (!props.open) return null;
	return <NewConcernModalContent {...props} />;
}

function NewConcernModalContent({ onClose, onSaved }) {
	const [form, setForm] = useState(EMPTY);
	const [error, setError] = useState(null);
	const [confirming, setConfirming] = useState(false);

	const { data: equipmentList } = useApiRequest(
		(signal) => equipmentApi.list({ per_page: 100 }, signal),
		[],
	);

	function handleSubmit(e) {
		e.preventDefault();
		setConfirming(true);
	}

	async function confirmSubmit() {
		setError(null);
		try {
			await concernsApi.create(form);
			onSaved?.();
			window.dispatchEvent(
				new CustomEvent('app-success', {
					detail: { message: 'Concern report submitted successfully.' },
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
				open={!confirming}
				onClose={onClose}
				title="Report Equipment Concern"
			>
				<form onSubmit={handleSubmit} className="space-y-4">
					<Select
						label="Equipment"
						required
						value={form.equipment_id}
						onChange={(e) => setForm({ ...form, equipment_id: e.target.value })}
					>
						<option value="">Select equipment…</option>
						{equipmentList?.data?.map((eq) => (
							<option key={eq.id} value={eq.id}>
								{eq.name} ({eq.asset_code})
							</option>
						))}
					</Select>
					<Select
						label="Severity"
						value={form.severity}
						onChange={(e) => setForm({ ...form, severity: e.target.value })}
					>
						{CONCERN_SEVERITIES.map((s) => (
							<option key={s} value={s}>
								{s}
							</option>
						))}
					</Select>
					<Textarea
						label="Description"
						required
						placeholder="Describe the damage or concern…"
						value={form.description}
						onChange={(e) => setForm({ ...form, description: e.target.value })}
					/>

					<ErrorAlert error={error} />

					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="secondary" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit">Review report</Button>
					</div>
				</form>
			</Modal>
			<ConfirmActionModal
				open={confirming}
				onClose={() => setConfirming(false)}
				title="Confirm Concern Report"
				message={`Submit a ${form.severity} concern for ${equipmentList?.data?.find((item) => String(item.id) === String(form.equipment_id))?.name || 'the selected equipment'}?`}
				confirmLabel="Submit report"
				onConfirm={confirmSubmit}
			/>
		</>
	);
}
