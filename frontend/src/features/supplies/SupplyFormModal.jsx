import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import ErrorAlert from '../../components/ui/ErrorAlert';
import ConfirmActionModal from '../../components/ui/ConfirmActionModal';
import { suppliesApi } from './api';
import { useOfflineMode } from '../../hooks/useOfflineMode';

const EMPTY = {
	name: '',
	category: '',
	unit: 'pcs',
	stock_quantity: 0,
	reorder_level: 0,
	description: '',
};

export default function SupplyFormModal(props) {
	if (!props.open) return null;
	return <SupplyFormModalContent key={props.supply?.id ?? 'new'} {...props} />;
}

function SupplyFormModalContent({ open, onClose, onSaved, supply }) {
	const isEdit = !!supply;
	const { isReadOnlyAdmin } = useOfflineMode();
	const [form, setForm] = useState(() =>
		supply
			? {
					name: supply.name,
					category: supply.category || '',
					unit: supply.unit || 'pcs',
					stock_quantity: supply.stock_quantity,
					reorder_level: supply.reorder_level,
					description: supply.description || '',
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
		const payload = {
			...form,
			stock_quantity: Number(form.stock_quantity),
			reorder_level: Number(form.reorder_level),
		};
		setPendingPayload(payload);
		setConfirmOpen(true);
	}

	async function confirmSave() {
		if (isReadOnlyAdmin || !pendingPayload) return;
		setLoading(true);
		try {
			const saved = isEdit
				? await suppliesApi.update(supply.id, pendingPayload)
				: await suppliesApi.create(pendingPayload);
			onSaved(saved);
			window.dispatchEvent(
				new CustomEvent('app-success', {
					detail: {
						message: isEdit
							? 'Supply updated successfully.'
							: 'Supply added successfully.',
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
				title={isEdit ? 'Edit Supply' : 'Add Supply'}
			>
				<form onSubmit={handleSubmit} className="space-y-4">
					<Input
						label="Name"
						name="name"
						required
						value={form.name}
						onChange={(e) => update('name', e.target.value)}
					/>
					<div className="grid grid-cols-2 gap-4">
						<Input
							label="Category"
							name="category"
							placeholder="e.g. Office Supplies"
							value={form.category}
							onChange={(e) => update('category', e.target.value)}
						/>
						<Input
							label="Unit"
							name="unit"
							placeholder="pcs, ream, box"
							value={form.unit}
							onChange={(e) => update('unit', e.target.value)}
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<Input
							label="Stock quantity"
							name="stock_quantity"
							type="number"
							min="0"
							required
							value={form.stock_quantity}
							onChange={(e) => update('stock_quantity', e.target.value)}
						/>
						<Input
							label="Reorder level"
							name="reorder_level"
							type="number"
							min="0"
							value={form.reorder_level}
							onChange={(e) => update('reorder_level', e.target.value)}
						/>
					</div>
					<Textarea
						label="Description"
						name="description"
						value={form.description}
						onChange={(e) => update('description', e.target.value)}
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
							{isEdit ? 'Save changes' : 'Add supply'}
						</Button>
					</div>
				</form>
			</Modal>
			<ConfirmActionModal
				open={confirmOpen}
				onClose={() => setConfirmOpen(false)}
				title={isEdit ? 'Confirm Supply Changes' : 'Confirm New Supply'}
				message={`${isEdit ? 'Save changes to' : 'Add'} ${form.name || 'this supply'}${isEdit ? '?' : ' to inventory?'}`}
				confirmLabel={isEdit ? 'Save changes' : 'Add supply'}
				onConfirm={confirmSave}
			/>
		</>
	);
}
