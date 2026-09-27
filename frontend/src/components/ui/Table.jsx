export default function Table({
	columns,
	rows,
	rowKey = 'id',
	emptyMessage = 'No records found.',
}) {
	if (!rows || rows.length === 0) {
		return (
			<p className="py-8 text-center text-sm text-slate-500" role="status" aria-live="polite">
				{emptyMessage}
			</p>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table className="min-w-full divide-y divide-[var(--border)]" role="table">
				<thead className="bg-[var(--surface-muted)]">
					<tr>
						{columns.map((col) => (
							<th
								key={col.key}
								scope="col"
								className="whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]"
							>
								{col.header}
							</th>
						))}
					</tr>
				</thead>
				<tbody className="divide-y divide-[var(--border)]">
					{rows.map((row) => (
						<tr key={row[rowKey]} className="hover:bg-[var(--surface-muted)] focus-within:bg-[var(--surface-muted)]">
							{columns.map((col) => (
								<td
									key={col.key}
									scope="col"
									className="whitespace-nowrap px-3 py-3 text-sm text-[var(--text)]"
								>
									{col.render ? col.render(row) : row[col.key]}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
