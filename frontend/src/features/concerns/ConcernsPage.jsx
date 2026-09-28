import { useState } from 'react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorAlert from '../../components/ui/ErrorAlert';
import Icon from '../../components/ui/Icon';
import { useApiRequest } from '../../hooks/useApiRequest';
import { useAuth } from '../auth/useAuth';
import { ROLES } from '../../lib/constants';
import { formatDateTime } from '../../lib/format';
import { concernsApi } from './api';
import NewConcernModal from './NewConcernModal';
import ReviewConcernModal from './ReviewConcernModal';
import { useOfflineMode } from '../../hooks/useOfflineMode';

export default function ConcernsPage() {
	const { user } = useAuth();
	const { isReadOnlyAdmin } = useOfflineMode();
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState('');
	const [newOpen, setNewOpen] = useState(false);
	const [reviewTarget, setReviewTarget] = useState(null);

	const { data, error, loading, refetch } = useApiRequest(
		(signal) => concernsApi.list({ page, status }, signal),
		[page, status],
	);

	const isAdmin = user.role === ROLES.ADMIN;
	const canReport = [ROLES.FACULTY, ROLES.OUTSIDER, ROLES.STAFF].includes(
		user.role,
	);

	const columns = [
		{
			key: 'equipment',
			header: 'Equipment',
			render: (r) => r.equipment?.name || '—',
		},
		{
			key: 'reporter',
			header: 'Reported by',
			render: (r) => r.reporter?.name || '—',
		},
		{
			key: 'severity',
			header: 'Severity',
			render: (r) => <Badge status={r.severity} className="severity-badge" />,
		},
		{
			key: 'description',
			header: 'Description',
			render: (r) => (
				<span className="line-clamp-1 max-w-xs">{r.description}</span>
			),
		},
		{
			key: 'admin_remarks',
			header: 'Admin remarks',
			render: (r) =>
				r.admin_remarks ? (
					<span className="line-clamp-2 max-w-xs" title={r.admin_remarks}>
						{r.admin_remarks}
					</span>
				) : (
					'—'
				),
		},
		{
			key: 'status',
			header: 'Status',
			render: (r) => <Badge status={r.status} />,
		},
		{
			key: 'created_at',
			header: 'Reported on',
			render: (r) => formatDateTime(r.created_at),
		},
		...(isAdmin
			? [
					{
						key: 'actions',
						header: '',
						render: (r) =>
							r.status === 'open' || r.status === 'reviewed' ? (
								<button
									className="btn-primary btn-sm"
									disabled={isReadOnlyAdmin}
									onClick={() => setReviewTarget(r)}
								>
									Review
								</button>
							) : null,
					},
				]
			: []),
	];

	return (
		<div className="space-y-4">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
				<div>
					<h1 className="text-xl font-bold text-slate-900">
						Damage &amp; Concern Reports
					</h1>
					<p className="text-sm text-slate-500">
						Track reported equipment issues and their resolution.
					</p>
				</div>
				{canReport && (
					<Button onClick={() => setNewOpen(true)}>
						<Icon name="plus" className="h-4 w-4" /> Report Concern
					</Button>
				)}
			</div>

			<Card>
				<div className="mb-4 max-w-xs">
					<Select
						value={status}
						onChange={(e) => {
							setPage(1);
							setStatus(e.target.value);
						}}
					>
						<option value="">All statuses</option>
						<option value="open">Open</option>
						<option value="reviewed">Reviewed</option>
						<option value="resolved">Resolved</option>
					</Select>
				</div>

				{loading && <Spinner />}
				<ErrorAlert error={error} />
				{!loading && !error && (
					<>
						<Table
							columns={columns}
							rows={data?.data}
							emptyMessage="No concerns reported."
						/>
						<Pagination meta={data} onPageChange={setPage} />
					</>
				)}
			</Card>

			<NewConcernModal
				open={newOpen}
				onClose={() => setNewOpen(false)}
				onSaved={() => {
					refetch();
				}}
			/>
			<ReviewConcernModal
				open={!!reviewTarget}
				onClose={() => setReviewTarget(null)}
				concern={reviewTarget}
				onSaved={() => {
					refetch();
				}}
				disabled={isReadOnlyAdmin}
			/>
		</div>
	);
}
