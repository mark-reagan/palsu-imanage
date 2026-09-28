import { useCallback, useEffect, useRef, useState } from 'react';

const TOAST_DURATION_MS = 5000;

function ToastItem({ toast, dismiss }) {
	const [isHovered, setIsHovered] = useState(false);
	const [isPressed, setIsPressed] = useState(false);
	const remaining = useRef(TOAST_DURATION_MS);
	const startedAt = useRef(0);
	const paused = isHovered || isPressed;
	const wasPaused = useRef(false);
	const onDismiss = useCallback(() => dismiss(toast.id), [dismiss, toast.id]);

	useEffect(() => {
		if (paused) {
			if (!wasPaused.current) {
				remaining.current = Math.max(
					0,
					remaining.current - (Date.now() - startedAt.current),
				);
				wasPaused.current = true;
			}
			return undefined;
		}

		startedAt.current = Date.now();
		wasPaused.current = false;
		const timeoutId = window.setTimeout(onDismiss, remaining.current);
		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [onDismiss, paused]);

	return (
		<div
			role={toast.type === 'error' ? 'alert' : 'status'}
			aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
			className={`pointer-events-auto w-full cursor-pointer rounded-xl border px-5 py-4 text-sm shadow-lg backdrop-blur ${
				toast.type === 'error'
					? 'border-red-200 bg-red-50/95 text-red-800'
					: 'border-emerald-200 bg-emerald-50/95 text-emerald-800'
			}`}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onPointerDown={() => setIsPressed(true)}
			onPointerUp={() => setIsPressed(false)}
			onPointerCancel={() => setIsPressed(false)}
			onClick={() => onDismiss()}
		>
			<p className="font-medium">{toast.message}</p>
		</div>
	);
}

export default function ToastViewport() {
	const [toasts, setToasts] = useState([]);

	useEffect(() => {
		function handleToast(event) {
			const { type = 'success', message } = event.detail || {};
			if (!message) return;
			setToasts((current) => [
				...current,
				{ id: `${Date.now()}-${Math.random()}`, type, message },
			]);
		}

		window.addEventListener('app-toast', handleToast);
		return () => {
			window.removeEventListener('app-toast', handleToast);
		};
	}, []);

	const dismiss = useCallback((id) => {
		setToasts((current) => current.filter((toast) => toast.id !== id));
	}, []);

	if (toasts.length === 0) return null;

	return (
		<div
			className="pointer-events-none fixed inset-x-3 top-[calc(env(safe-area-inset-top)+1rem)] z-[100] flex max-h-[70vh] flex-col gap-2 overflow-y-auto sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto sm:w-96 sm:flex-col-reverse"
			aria-label="Notifications"
		>
			{toasts.map((toast) => (
				<ToastItem key={toast.id} toast={toast} dismiss={dismiss} />
			))}
		</div>
	);
}
