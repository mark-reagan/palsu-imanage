export default function Table({
	columns,
	rows,
	rowKey = 'id',
	emptyMessage = 'No records found.',
	truncateCells = false,
	onRowClick,
}) {
	if (!rows || rows.length === 0) {
		return (
			<p
				className="py-8 text-center text-sm text-slate-500"
				role="status"
				aria-live="polite"
			>
				{emptyMessage}
			</p>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table
				className="min-w-full table-auto divide-y divide-[var(--border)]"
				role="table"
			>
				<thead className="bg-[var(--surface-muted)]">
					<tr>
						{columns.map((col) => (
							<th
								key={col.key}
								scope="col"
								className={`whitespace-nowrap px-3 py-3 ${col.headerAlign === 'center' ? 'text-center' : 'text-left'} text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]${truncateCells ? ' min-w-max' : ''}`}
							>
								{col.header}
							</th>
						))}
					</tr>
				</thead>
				<tbody className="divide-y divide-[var(--border)]">
					{rows.map((row) => (
						<tr
							key={row[rowKey]}
							className={`hover:bg-[var(--surface-muted)] focus-within:bg-[var(--surface-muted)]${onRowClick ? ' cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]' : ''}`}
							tabIndex={onRowClick ? 0 : undefined}
							aria-label={onRowClick ? 'View row details' : undefined}
							onClick={onRowClick ? () => onRowClick(row) : undefined}
							onKeyDown={
								onRowClick
									? (event) => {
											if (event.key === 'Enter' || event.key === ' ') {
												event.preventDefault();
												onRowClick(row);
											}
										}
									: undefined
							}
						>
							{columns.map((col) => (
								<td
									key={col.key}
									scope="col"
									className={`whitespace-nowrap px-3 py-3 text-sm text-[var(--text)]${truncateCells && col.truncate === 'responsive' ? ' max-w-0 overflow-hidden' : truncateCells && col.truncate ? ' w-24 max-w-24 overflow-hidden' : ''}${truncateCells && col.minWidth ? ' min-w-max' : ''}`}
								>
									{truncateCells && col.truncate ? (
										<div className="block truncate">
											{col.render ? col.render(row) : row[col.key]}
										</div>
									) : col.render ? (
										col.render(row)
									) : (
										row[col.key]
									)}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
