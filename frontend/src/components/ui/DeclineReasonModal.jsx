import { useState } from 'react';
import Modal from './Modal';
import Textarea from './Textarea';
import Button from './Button';
import ConfirmActionModal from './ConfirmActionModal';

export default function DeclineReasonModal({
	open,
	onClose,
	onConfirm,
	title = 'Decline Request',
	disabled = false,
}) {
	const [reason, setReason] = useState('');
	const [loading, setLoading] = useState(false);
	const [confirming, setConfirming] = useState(false);

	function handleSubmit(e) {
		e.preventDefault();
		if (disabled) return;
		setConfirming(true);
	}

	async function confirmDecline() {
		setLoading(true);
		try {
			await onConfirm(reason);
			setReason('');
			setConfirming(false);
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
				title={title}
				size="sm"
			>
				<form onSubmit={handleSubmit} className="space-y-4">
					<Textarea
						label="Reason for declining"
						required
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						placeholder="Let the requester know why this was declined…"
					/>
					<div className="flex justify-end gap-2">
						<Button type="button" variant="secondary" onClick={onClose}>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="danger"
							loading={loading}
							disabled={disabled}
						>
							Decline
						</Button>
					</div>
				</form>
			</Modal>
			<ConfirmActionModal
				open={open && confirming}
				onClose={() => setConfirming(false)}
				title="Confirm Decline"
				message={`Decline this request${reason ? ` with the reason: ${reason}` : ''}?`}
				confirmLabel="Confirm decline"
				variant="danger"
				onConfirm={confirmDecline}
			/>
		</>
	);
}
