export function dispatchToast(type, message) {
	window.dispatchEvent(
		new CustomEvent('app-toast', {
			detail: { type, message },
		}),
	);
}

export function dispatchSuccess(message) {
	dispatchToast('success', message);
}

export function dispatchError(error) {
	const message =
		error?.message ||
		(typeof error === 'string' ? error : 'Something went wrong.');
	dispatchToast('error', message);
}
