export default function PageSkeleton({ rows = 4 }) {
	return (
		<div
			className="space-y-6 animate-pulse"
			aria-live="polite"
			aria-busy="true"
		>
			<div className="space-y-3">
				<div className="h-8 w-56 rounded-xl bg-[var(--surface-muted)]" />
				<div className="h-4 w-72 rounded-lg bg-[var(--surface-muted)]" />
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{Array.from({ length: 4 }).map((_, index) => (
					<div
						key={index}
						className="h-28 rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
					/>
				))}
			</div>

			{Array.from({ length: rows }).map((_, index) => (
				<div
					key={index}
					className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
				>
					<div className="h-5 w-40 rounded-lg bg-[var(--surface-muted)]" />
					<div className="h-4 w-full rounded-lg bg-[var(--surface-muted)]" />
					<div className="h-4 w-5/6 rounded-lg bg-[var(--surface-muted)]" />
					<div className="h-4 w-4/6 rounded-lg bg-[var(--surface-muted)]" />
				</div>
			))}
		</div>
	);
}
