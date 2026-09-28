import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import ErrorAlert from '../../components/ui/ErrorAlert';
import ConfirmActionModal from '../../components/ui/ConfirmActionModal';
import { EQUIPMENT_CONDITIONS } from '../../lib/constants';
import { equipmentApi } from './api';
import { useOfflineMode } from '../../hooks/useOfflineMode';
import { dispatchSuccess } from '../../lib/toast';

const EMPTY = {
	name: '',
	category: '',
	description: '',
	total_quantity: 1,
	condition: 'good',
};

export default function EquipmentFormModal(props) {
	if (!props.open) return null;
	return (
		<EquipmentFormModalContent key={props.equipment?.id ?? 'new'} {...props} />
	);
}

function EquipmentFormModalContent({ open, onClose, onSaved, equipment }) {
	const isEdit = !!equipment;
	const { isReadOnlyAdmin } = useOfflineMode();
	const [form, setForm] = useState(() =>
		equipment
			? {
					name: equipment.name,
					category: equipment.category || '',
					description: equipment.description || '',
					total_quantity: equipment.total_quantity,
					condition: equipment.condition,
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
		const payload = { ...form, total_quantity: Number(form.total_quantity) };
		setPendingPayload(payload);
		setConfirmOpen(true);
	}

	async function confirmSave() {
		if (isReadOnlyAdmin || !pendingPayload) return;
		setError(null);
		setLoading(true);
		try {
			const saved = isEdit
				? await equipmentApi.update(equipment.id, pendingPayload)
				: await equipmentApi.create(pendingPayload);
			onSaved(saved);
			dispatchSuccess(
				isEdit
					? 'Equipment updated successfully.'
					: 'Equipment added successfully.',
			);
			setConfirmOpen(false);
			onClose();
		} finally {
			setLoading(false);
		}
	}

	return (
		<>
			<Modal
				open={open}
				onClose={onClose}
				title={isEdit ? 'Edit Equipment' : 'Add Equipment'}
			>
				<form onSubmit={handleSubmit} className="space-y-4">
					<Input
						label="Name"
						name="name"
						required
						value={form.name}
						onChange={(e) => update('name', e.target.value)}
					/>
					<Input
						label="Category"
						name="category"
						placeholder="e.g. Audio Visual, Furniture"
						value={form.category}
						onChange={(e) => update('category', e.target.value)}
					/>
					<Textarea
						label="Description"
						name="description"
						value={form.description}
						onChange={(e) => update('description', e.target.value)}
					/>
					<div className="grid grid-cols-2 gap-4">
						<Input
							label="Total quantity"
							name="total_quantity"
							type="number"
							min={isEdit ? 0 : 1}
							required
							value={form.total_quantity}
							onChange={(e) => update('total_quantity', e.target.value)}
						/>
						<Select
							label="Condition"
							name="condition"
							value={form.condition}
							onChange={(e) => update('condition', e.target.value)}
						>
							{EQUIPMENT_CONDITIONS.map((c) => (
								<option key={c} value={c}>
									{c.replace('_', ' ')}
								</option>
							))}
						</Select>
					</div>

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
							{isEdit ? 'Save changes' : 'Add equipment'}
						</Button>
					</div>
				</form>
			</Modal>
			<ConfirmActionModal
				open={confirmOpen}
				onClose={() => setConfirmOpen(false)}
				title={isEdit ? 'Confirm Equipment Changes' : 'Confirm New Equipment'}
				message={`${isEdit ? 'Save changes to' : 'Add'} ${form.name || 'this equipment'}${isEdit ? '?' : ' to inventory?'}`}
				confirmLabel={isEdit ? 'Save changes' : 'Add equipment'}
				onConfirm={confirmSave}
			/>
		</>
	);
}
