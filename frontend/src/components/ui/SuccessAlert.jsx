import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const ALERT_TIMEOUT_MS = 5000;

export default function SuccessAlert({ message, className = '' }) {
	const [alertState, setAlertState] = useState({
		message,
		visible: Boolean(message),
	});

	if (alertState.message !== message) {
		setAlertState({ message, visible: Boolean(message) });
	}

	useEffect(() => {
		if (!message) return undefined;

		const timeoutId = window.setTimeout(() => {
			setAlertState((current) =>
				current.message === message ? { ...current, visible: false } : current,
			);
		}, ALERT_TIMEOUT_MS);
		return () => window.clearTimeout(timeoutId);
	}, [message]);

	if (!message || !alertState.visible) return null;

	return (
		<div
			className={`rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 ${className}`}
			role="status"
			aria-live="polite"
		>
			{message}
		</div>
	);
}

SuccessAlert.propTypes = {
	message: PropTypes.string,
	className: PropTypes.string,
};
