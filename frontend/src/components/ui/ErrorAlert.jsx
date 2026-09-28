import { useEffect, useState } from 'react';

const ALERT_TIMEOUT_MS = 5000;

export default function ErrorAlert({ error, className = '' }) {
	const [alertState, setAlertState] = useState({
		error,
		visible: Boolean(error),
	});

	if (alertState.error !== error) {
		setAlertState({ error, visible: Boolean(error) });
	}

	useEffect(() => {
		if (!error) return undefined;

		const timeoutId = window.setTimeout(() => {
			setAlertState((current) =>
				current.error === error ? { ...current, visible: false } : current,
			);
		}, ALERT_TIMEOUT_MS);
		return () => window.clearTimeout(timeoutId);
	}, [error]);

	if (!error || !alertState.visible) return null;

	const fieldErrors = error.errors ? Object.values(error.errors).flat() : [];

	return (
		<div
			className={`rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-inset ring-red-200 ${className}`}
			role="alert"
			aria-live="assertive"
		>
			<p className="font-medium">{error.message || 'Something went wrong.'}</p>
			{fieldErrors.length > 0 && (
				<ul className="mt-1 list-inside list-disc space-y-0.5">
					{fieldErrors.map((msg, i) => (
						<li key={i}>{msg}</li>
					))}
				</ul>
			)}
		</div>
	);
}
