export default function Table({
	columns,
	rows,
	rowKey = 'id',
	emptyMessage = 'No records found.',
}) {
	if (!rows || rows.length === 0) {
		return (
			<p className="py-8 text-center text-sm text-slate-500">{emptyMessage}</p>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table className="min-w-full divide-y divide-slate-200">
				<thead>
					<tr>
						{columns.map((col) => (
							<th
								key={col.key}
								className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
							>
								{col.header}
							</th>
						))}
					</tr>
				</thead>
				<tbody className="divide-y divide-slate-100">
					{rows.map((row) => (
						<tr key={row[rowKey]} className="hover:bg-[var(--surface-muted)]">
							{columns.map((col) => (
								<td
									key={col.key}
									className="whitespace-nowrap px-3 py-3 text-sm text-slate-700"
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
