import { useEffect, useRef } from 'react';

export default function Modal({
	open,
	onClose,
	title,
	children,
	footer,
	size = 'md',
}) {
	const contentRef = useRef(null);
	const overlayRef = useRef(null);

	useEffect(() => {
		if (!open) return;
		const onKey = (e) => e.key === 'Escape' && onClose?.();
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [open, onClose]);

	useEffect(() => {
		if (open && contentRef.current) {
			contentRef.current.focus();
		}
	}, [open]);

	// Handle click on overlay to close - but don't close if clicking on modal content
	function handleOverlayClick(e) {
		if (overlayRef.current && overlayRef.current === e.target && onClose) {
			onClose();
		}
	}

	if (!open) return null;

	const widthClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size];

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-4" role="dialog" aria-modal="true">
			<div
				ref={overlayRef}
				className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
				onClick={handleOverlayClick}
				aria-hidden="true"
			/>
			<div
				ref={contentRef}
				tabIndex={-1}
				role="document"
				className={`relative z-10 my-auto max-h-[calc(100dvh-1.5rem)] w-full overflow-y-auto touch-manipulation ${widthClass} rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-[var(--text)] shadow-soft sm:max-h-[calc(100dvh-2rem)] sm:p-6 interactive-focus`}
			>
				<div className="mb-4 flex items-start justify-between gap-3">
					<h3 className="min-w-0 text-lg font-semibold text-[var(--text)]" id="modal-title">
						{title}
					</h3>
					<button
						onClick={onClose}
						className="shrink-0 rounded-md p-1.5 text-[var(--text-soft)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] interactive-focus-sm"
						aria-label="Close dialog"
						type="button"
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
				{footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
			</div>
		</div>
	);
}
