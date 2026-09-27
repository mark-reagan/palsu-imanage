import { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import Button from './Button';
import ErrorAlert from './ErrorAlert';

export default function ConfirmActionModal({
	open,
	onClose,
	onConfirm,
	title,
	message,
	confirmLabel = 'Confirm',
	variant = 'primary',
}) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	async function handleConfirm() {
		setLoading(true);
		setError(null);
		try {
			await onConfirm();
			onClose();
		} catch (actionError) {
			setError(actionError);
		} finally {
			setLoading(false);
		}
	}

	function handleClose() {
		if (loading) return;
		setError(null);
		onClose();
	}

	return (
		<Modal open={open} onClose={handleClose} title={title} size="sm">
			<div className="space-y-4">
				<p className="text-sm leading-6 text-[var(--text-soft)]" id="modal-description">
					{message}
				</p>
				<ErrorAlert error={error} />
				<div className="flex justify-end gap-2" aria-describedby="modal-description">
					<Button
						type="button"
						variant="secondary"
						onClick={handleClose}
						disabled={loading}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant={variant}
						onClick={handleConfirm}
						loading={loading}
					>
						{confirmLabel}
					</Button>
				</div>
			</div>
		</Modal>
	);
}

ConfirmActionModal.propTypes = {
	open: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	onConfirm: PropTypes.func.isRequired,
	title: PropTypes.string.isRequired,
	message: PropTypes.string.isRequired,
	confirmLabel: PropTypes.string,
	variant: PropTypes.string,
};
