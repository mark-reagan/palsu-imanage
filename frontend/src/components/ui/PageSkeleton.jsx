export default function PageSkeleton({ rows = 4, branded = false }) {
	return (
		<div
			className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6 animate-pulse sm:space-y-6 sm:px-6 sm:py-8 lg:px-8"
			aria-live="polite"
			aria-busy="true"
		>
			{branded && (
				<div className="flex flex-col items-center gap-3 pb-2 text-center">
					<img
						src="/palsu-imanage/palsu-imanage-logo.svg"
						alt="PalSU-iManage"
						className="h-12 w-12"
					/>
					<div className="h-5 w-36 rounded-lg bg-[var(--surface-muted)]" />
					<div className="h-3 w-24 rounded-lg bg-[var(--surface-muted)]" />
				</div>
			)}
			<div className="space-y-3">
				<div className="h-8 w-40 max-w-full rounded-xl bg-[var(--surface-muted)] sm:w-56" />
				<div className="h-4 w-56 max-w-full rounded-lg bg-[var(--surface-muted)] sm:w-72" />
			</div>

			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
				{Array.from({ length: 4 }).map((_, index) => (
					<div
						key={index}
						className="h-28 rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
					/>
				))}
			</div>

			<div className="space-y-4 sm:space-y-5">
				{Array.from({ length: rows }).map((_, index) => (
					<div
						key={index}
						className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5"
					>
						<div className="h-5 w-40 rounded-lg bg-[var(--surface-muted)]" />
						<div className="h-4 w-full rounded-lg bg-[var(--surface-muted)]" />
						<div className="h-4 w-5/6 rounded-lg bg-[var(--surface-muted)]" />
						<div className="h-4 w-4/6 rounded-lg bg-[var(--surface-muted)]" />
					</div>
				))}
			</div>
		</div>
	);
}
