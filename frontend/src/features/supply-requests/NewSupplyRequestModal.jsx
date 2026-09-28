import { useMemo, useState } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import ErrorAlert from '../../components/ui/ErrorAlert';
import { supplyRequestsApi } from './api';
import { dispatchError, dispatchSuccess } from '../../lib/toast';

const EMPTY = { quantity: 1, purpose: '' };

export default function NewSupplyRequestModal(props) {
	if (!props.open) return null;
	return (
		<NewSupplyRequestModalContent
			key={
				props.supply?.id ||
				props.items?.map((item) => item.id).join('-') ||
				'batch'
			}
			{...props}
		/>
	);
}

function NewSupplyRequestModalContent({
	open,
	onClose,
	supply,
	items,
	onSaved,
}) {
	const isBatch = Array.isArray(items) && items.length > 0;
	const initialBatch = useMemo(
		() =>
			(items || []).map((item) => ({
				supply_id: item.id,
				name: item.name,
				unit: item.unit,
				stock_quantity: item.stock_quantity,
				quantity: 1,
				purpose: '',
			})),
		[items],
	);
	const [form, setForm] = useState(EMPTY);
	const [batch, setBatch] = useState(initialBatch);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(false);
	const [confirming, setConfirming] = useState(false);

	function removeBatchItem(index) {
		setBatch((current) => {
			const next = current.filter((_, i) => i !== index);
			// Nothing left to request, so close the modal
			if (next.length === 0) onClose();
			return next;
		});
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
							supply_id: item.supply_id,
							quantity: Number(item.quantity),
							purpose: item.purpose,
						})),
					}
				: {
						supply_id: supply.id,
						quantity: Number(form.quantity),
						purpose: form.purpose,
					};

			await supplyRequestsApi.create(payload);
			dispatchSuccess('Supply request submitted successfully.');
			onSaved?.();
			onClose();
		} catch (err) {
			dispatchError(err);
		} finally {
			setLoading(false);
		}
	}

	if (confirming) {
		return (
			<Modal
				open={open}
				onClose={onClose}
				title="Confirm Supply Request"
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
									key={item.supply_id}
									className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4"
								>
									<p className="font-medium text-[var(--text)]">{item.name}</p>
									<dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
										<div>
											<dt className="text-[var(--text-soft)]">Quantity</dt>
											<dd>
												{item.quantity} {item.unit}
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
								<span className="font-medium">Item:</span> {supply?.name}
							</p>
							<p>
								<span className="font-medium">Quantity:</span> {form.quantity}{' '}
								{supply?.unit}
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
				title="Review Supply Request"
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
								key={item.supply_id}
								className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 transition-all duration-200 ease-out"
							>
								<div className="mb-3 flex items-center justify-between gap-3">
									<div>
										<p className="font-medium text-[var(--text)]">
											{item.name}
										</p>
										<p className="text-xs text-[var(--text-soft)]">
											{item.stock_quantity} {item.unit} in stock
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
										max={item.stock_quantity}
										required
										value={item.quantity}
										onChange={(e) =>
											setBatch((current) =>
												current.map((entry, entryIndex) =>
													entryIndex === index
														? { ...entry, quantity: e.target.value }
														: entry,
												),
											)
										}
									/>
								</div>

								<Textarea
									label="Purpose"
									required
									placeholder="What is this supply needed for?"
									value={item.purpose}
									onChange={(e) =>
										setBatch((current) =>
											current.map((entry, entryIndex) =>
												entryIndex === index
													? { ...entry, purpose: e.target.value }
													: entry,
											),
										)
									}
								/>

								<div className="flex justify-start pt-2">
									<Button
										type="button"
										variant="danger"
										onClick={() => removeBatchItem(index)}
										className="w-full px-6 sm:w-auto"
									>
										Remove item
									</Button>
								</div>
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
			title={`Request Supply — ${supply?.name || ''}`}
		>
			<form onSubmit={handleReviewSubmit} className="space-y-4">
				<p className="text-sm text-slate-500">
					{supply?.stock_quantity} {supply?.unit} currently in stock.
				</p>
				<Input
					label="Quantity"
					name="quantity"
					type="number"
					min="1"
					max={supply?.stock_quantity}
					required
					value={form.quantity}
					onChange={(e) => setForm({ ...form, quantity: e.target.value })}
				/>
				<Textarea
					label="Purpose"
					name="purpose"
					required
					placeholder="What is this supply needed for?"
					value={form.purpose}
					onChange={(e) => setForm({ ...form, purpose: e.target.value })}
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
