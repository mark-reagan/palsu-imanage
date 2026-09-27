export default function SessionLoadingScreen() {
	return (
		<div
			className="flex min-h-screen w-full items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top,var(--surface-muted),var(--bg)_70%)] px-4 py-8"
			role="status"
			aria-live="polite"
			aria-label="Loading your session"
		>
			<div className="relative w-full max-w-sm rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-[0_24px_80px_var(--shadow)] sm:p-10">
				<div
					className="pointer-events-none absolute -right-3 -top-4 animate-bounce text-2xl motion-reduce:animate-none"
					aria-hidden="true"
				>
					✨
				</div>
				<div
					className="pointer-events-none absolute -bottom-3 -left-3 animate-pulse text-2xl motion-reduce:animate-none"
					aria-hidden="true"
				>
					📦
				</div>

				<div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
					<div className="absolute inset-0 rounded-full border-4 border-[var(--accent-soft)]" />
					<div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[var(--accent-strong)] motion-reduce:animate-none" />
					<div className="flex h-16 w-16 animate-bounce items-center justify-center rounded-2xl bg-white shadow-lg motion-reduce:animate-none">
						<img
							src="/palsu-imanage/palsu-imanage-logo.svg"
							alt=""
							className="h-12 w-12 object-contain"
						/>
					</div>
				</div>

				<p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
					PalSU-iManage
				</p>
				<h1 className="mt-2 text-xl font-extrabold tracking-tight text-[var(--text)] sm:text-2xl">
					Loading your inventory era
				</h1>
				<p className="mt-2 text-sm text-[var(--text-soft)]">
					Locking in your session. The supplies are almost summoned.
				</p>

				<div
					className="mx-auto mt-6 flex w-fit items-center gap-1.5"
					aria-hidden="true"
				>
					{[0, 1, 2].map((dot) => (
						<span
							key={dot}
							className="h-2.5 w-2.5 animate-bounce rounded-full bg-[var(--accent-strong)] motion-reduce:animate-none"
							style={{ animationDelay: `${dot * 120}ms` }}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
