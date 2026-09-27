import { useEffect } from 'react';

export default function Modal({
	open,
	onClose,
	title,
	children,
	footer,
	size = 'md',
}) {
	useEffect(() => {
		if (!open) return;
		const onKey = (e) => e.key === 'Escape' && onClose?.();
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [open, onClose]);

	if (!open) return null;

	const widthClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size];

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				className="absolute inset-0 bg-slate-900/60"
				onClick={onClose}
				aria-hidden="true"
			/>
			<div
				className={`relative z-10 w-full ${widthClass} rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-6 text-[var(--text)] shadow-soft`}
			>
				<div className="mb-4 flex items-center justify-between gap-3">
					<h3 className="text-lg font-semibold text-[var(--text)]">{title}</h3>
					<button
						onClick={onClose}
						className="rounded-md p-1.5 text-[var(--text-soft)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
						aria-label="Close dialog"
					>
						<svg
							className="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
				<div>{children}</div>
				{footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
			</div>
		</div>
	);
}
