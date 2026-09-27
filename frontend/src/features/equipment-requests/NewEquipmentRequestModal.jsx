import { useMemo, useState } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import ErrorAlert from '../../components/ui/ErrorAlert';
import { equipmentRequestsApi } from './api';

const EMPTY = { quantity: 1, purpose: '', start_date: '', end_date: '' };

export default function NewEquipmentRequestModal(props) {
	if (!props.open) return null;
	return (
		<NewEquipmentRequestModalContent
			key={
				props.equipment?.id ||
				props.items?.map((item) => item.id).join('-') ||
				'batch'
			}
			{...props}
		/>
	);
}

function NewEquipmentRequestModalContent({
	open,
	onClose,
	equipment,
	items,
	onSaved,
}) {
	const isBatch = Array.isArray(items) && items.length > 0;
	const initialBatch = useMemo(
		() =>
			(items || []).map((item) => ({
				equipment_id: item.id,
				name: item.name,
				available_quantity: item.available_quantity,
				total_quantity: item.total_quantity,
				quantity: 1,
				purpose: '',
				start_date: '',
				end_date: '',
			})),
		[items],
	);
	const [form, setForm] = useState(EMPTY);
	const [batch, setBatch] = useState(initialBatch);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(false);
	const [confirming, setConfirming] = useState(false);

	function update(field, value) {
		setForm((f) => ({ ...f, [field]: value }));
	}

	function updateBatch(index, field, value) {
		setBatch((current) =>
			current.map((item, itemIndex) =>
				itemIndex === index ? { ...item, [field]: value } : item,
			),
		);
	}

	function handleReviewSubmit(e) {
		e.preventDefault();
		setError(null);
		setConfirming(true);
	}

	async function submitRequest() {
		setError(null);
		setLoading(true);
		try {
			const payload = isBatch
				? {
						items: batch.map((item) => ({
							equipment_id: item.equipment_id,
							quantity: Number(item.quantity),
							purpose: item.purpose,
							start_date: item.start_date,
							end_date: item.end_date,
						})),
					}
				: {
						equipment_id: equipment.id,
						quantity: Number(form.quantity),
						purpose: form.purpose,
						start_date: form.start_date,
						end_date: form.end_date,
					};

			await equipmentRequestsApi.create(payload);
			onSaved?.();
			onClose();
		} catch (err) {
			setError(err);
		} finally {
			setLoading(false);
		}
	}

	if (confirming) {
		return (
			<Modal
				open={open}
				onClose={onClose}
				title="Confirm Equipment Request"
				size="lg"
			>
				<div className="space-y-4">
					<p className="text-sm text-[var(--text-soft)]">
						Please review the request details before submitting.
					</p>
					{isBatch ? (
						<div className="max-h-[55vh] space-y-3 overflow-y-auto">
							{batch.map((item) => (
								<div
									key={item.equipment_id}
									className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4"
								>
									<p className="font-medium text-[var(--text)]">{item.name}</p>
									<dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
										<div>
											<dt className="text-[var(--text-soft)]">Quantity</dt>
											<dd>{item.quantity}</dd>
										</div>
										<div>
											<dt className="text-[var(--text-soft)]">Dates</dt>
											<dd>
												{item.start_date} – {item.end_date}
											</dd>
										</div>
										<div className="sm:col-span-2">
											<dt className="text-[var(--text-soft)]">Purpose</dt>
											<dd>{item.purpose}</dd>
										</div>
									</dl>
								</div>
							))}
						</div>
					) : (
						<div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm">
							<p>
								<span className="font-medium">Item:</span> {equipment?.name}
							</p>
							<p>
								<span className="font-medium">Quantity:</span> {form.quantity}
							</p>
							<p>
								<span className="font-medium">Dates:</span> {form.start_date} –{' '}
								{form.end_date}
							</p>
							<p className="mt-2">
								<span className="font-medium">Purpose:</span> {form.purpose}
							</p>
						</div>
					)}
					<ErrorAlert error={error} />
					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="secondary"
							onClick={() => setConfirming(false)}
							disabled={loading}
						>
							Back to edit
						</Button>
						<Button type="button" loading={loading} onClick={submitRequest}>
							Confirm and submit
						</Button>
					</div>
				</div>
			</Modal>
		);
	}

	if (isBatch) {
		return (
			<Modal
				open={open}
				onClose={onClose}
				title="Review Equipment Request"
				size="lg"
			>
				<form onSubmit={handleReviewSubmit} className="space-y-5">
					<div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
						<p className="text-sm font-medium text-[var(--text)]">
							Selected items: {batch.length}
						</p>
					</div>
					<div className="space-y-4">
						{batch.map((item, index) => (
							<div
								key={item.equipment_id}
								className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4"
							>
								<div className="mb-3 flex items-center justify-between gap-2">
									<div>
										<p className="font-medium text-[var(--text)]">
											{item.name}
										</p>
										<p className="text-xs text-[var(--text-soft)]">
											{item.available_quantity} of {item.total_quantity}{' '}
											available
										</p>
									</div>
									<span className="rounded-full bg-[var(--accent-soft)] px-2 py-1 text-xs font-medium text-[var(--accent-strong)]">
										Item {index + 1}
									</span>
								</div>

								<div className="grid gap-3 md:grid-cols-2">
									<Input
										label="Quantity"
										type="number"
										min="1"
										max={item.available_quantity}
										required
										value={item.quantity}
										onChange={(e) =>
											updateBatch(index, 'quantity', e.target.value)
										}
									/>
									<Input
										label="Start date"
										type="date"
										required
										value={item.start_date}
										onChange={(e) =>
											updateBatch(index, 'start_date', e.target.value)
										}
									/>
									<Input
										label="End date"
										type="date"
										required
										value={item.end_date}
										onChange={(e) =>
											updateBatch(index, 'end_date', e.target.value)
										}
									/>
								</div>

								<Textarea
									label="Purpose"
									required
									placeholder="What is this equipment needed for?"
									value={item.purpose}
									onChange={(e) =>
										updateBatch(index, 'purpose', e.target.value)
									}
								/>
							</div>
						))}
					</div>

					<ErrorAlert error={error} />

					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="secondary" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit">Review request</Button>
					</div>
				</form>
			</Modal>
		);
	}

	return (
		<Modal
			open={open}
			onClose={onClose}
			title={`Request Equipment — ${equipment?.name || ''}`}
		>
			<form onSubmit={handleReviewSubmit} className="space-y-4">
				<p className="text-sm text-slate-500">
					{equipment?.available_quantity} of {equipment?.total_quantity} unit(s)
					currently available.
				</p>
				<Input
					label="Quantity"
					name="quantity"
					type="number"
					min="1"
					max={equipment?.available_quantity}
					required
					value={form.quantity}
					onChange={(e) => update('quantity', e.target.value)}
				/>
				<div className="grid grid-cols-2 gap-4">
					<Input
						label="Start date"
						name="start_date"
						type="date"
						required
						value={form.start_date}
						onChange={(e) => update('start_date', e.target.value)}
					/>
					<Input
						label="End date"
						name="end_date"
						type="date"
						required
						value={form.end_date}
						onChange={(e) => update('end_date', e.target.value)}
					/>
				</div>
				<Textarea
					label="Purpose"
					name="purpose"
					required
					placeholder="What is this equipment needed for?"
					value={form.purpose}
					onChange={(e) => update('purpose', e.target.value)}
				/>

				<ErrorAlert error={error} />

				<div className="flex justify-end gap-2 pt-2">
					<Button type="button" variant="secondary" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit">Review request</Button>
				</div>
			</form>
		</Modal>
	);
}
