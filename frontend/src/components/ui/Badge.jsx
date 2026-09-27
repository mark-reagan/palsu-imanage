const STATUS_STYLES = {
	pending: 'bg-amber-100 text-amber-800',
	approved: 'bg-blue-100 text-blue-800',
	declined: 'bg-red-100 text-red-800',
	cancelled: 'bg-slate-200 text-slate-600',
	released: 'bg-indigo-100 text-indigo-800',
	returned: 'bg-teal-100 text-teal-800',
	completed: 'bg-green-100 text-green-800',
	good: 'bg-green-100 text-green-800',
	fair: 'bg-amber-100 text-amber-800',
	damaged: 'bg-red-100 text-red-800',
	under_repair: 'bg-orange-100 text-orange-800',
	lost: 'bg-slate-300 text-slate-700',
	available: 'bg-green-100 text-green-800',
	partially_available: 'bg-amber-100 text-amber-800',
	unavailable: 'bg-red-100 text-red-800',
	open: 'bg-amber-100 text-amber-800',
	reviewed: 'bg-blue-100 text-blue-800',
	resolved: 'bg-green-100 text-green-800',
	minor: 'bg-slate-100 text-slate-700',
	major: 'bg-orange-100 text-orange-800',
	critical: 'bg-red-100 text-red-800',
};

export default function Badge({ status, children, className = '' }) {
	const style = STATUS_STYLES[status] || 'bg-slate-100 text-slate-700';
	const label = children ?? String(status || '').replace(/_/g, ' ');
	return (
		<span
			data-status={status || 'default'}
			className={`theme-badge inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style} ${className}`}
		>
			{label}
		</span>
	);
}
