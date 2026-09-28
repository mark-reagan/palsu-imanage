import { useState } from 'react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import ConfirmActionModal from '../../components/ui/ConfirmActionModal';
import Icon from '../../components/ui/Icon';
import { useApiRequest } from '../../hooks/useApiRequest';
import { useAuth } from '../auth/useAuth';
import { ROLES } from '../../lib/constants';
import { equipmentApi } from './api';
import EquipmentFormModal from './EquipmentFormModal';
import EquipmentBarcodeModal from './EquipmentBarcodeModal';
import NewEquipmentRequestModal from '../equipment-requests/NewEquipmentRequestModal';
import { useOfflineMode } from '../../hooks/useOfflineMode';
import { dispatchSuccess } from '../../lib/toast';

export default function EquipmentListPage() {
	const { user } = useAuth();
	const { isReadOnlyAdmin } = useOfflineMode();
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState('');
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState(null);
	const [barcodeTarget, setBarcodeTarget] = useState(null);
	const [scannerOpen, setScannerOpen] = useState(false);
	const [requestTarget, setRequestTarget] = useState(null);
	const [requestDialogOpen, setRequestDialogOpen] = useState(false);
	const [requestItems, setRequestItems] = useState([]);
	const [confirmTarget, setConfirmTarget] = useState(null);

	const { data, error, loading, refetch } = useApiRequest(
		(signal) => equipmentApi.list({ page, search, status }, signal),
		[page, search, status],
	);

	const canManage = user.role === ROLES.ADMIN;
	const canScanBarcode = user.role === ROLES.ADMIN || user.role === ROLES.STAFF;
	const canRequest =
		user.role === ROLES.FACULTY || user.role === ROLES.OUTSIDER;
	const searchPlaceholder = canScanBarcode
		? 'Search equipment or scan barcode'
		: 'Search equipment';

	function toggleRequestSelection(item) {
		setRequestItems((current) => {
			const exists = current.some((entry) => entry.id === item.id);
			if (exists) {
				return current.filter((entry) => entry.id !== item.id);
			}
			return [...current, item];
		});
	}

	async function handleRemove(equipment) {
		if (isReadOnlyAdmin) return;
		setConfirmTarget({ type: 'delete-equipment', item: equipment });
	}

	const columns = [
		{
			key: 'name',
			header: 'Name',
			render: (r) => (
				<span className="font-medium text-slate-900">{r.name}</span>
			),
		},
		{ key: 'asset_code', header: 'Asset Code' },
		{
			key: 'barcode',
			header: 'Barcode',
			render: (r) => (
				<button
					className="font-mono text-xs text-[var(--accent-strong)] hover:text-[var(--accent)] hover:underline"
					onClick={() => setBarcodeTarget(r)}
				>
					{r.barcode}
				</button>
			),
		},
		{ key: 'category', header: 'Category', render: (r) => r.category || '—' },
		{
			key: 'available',
			header: 'Available',
			render: (r) => `${r.available_quantity} / ${r.total_quantity}`,
		},
		{
			key: 'condition',
			header: 'Condition',
			render: (r) => <Badge status={r.condition} />,
		},
		{
			key: 'status',
			header: 'Status',
			render: (r) => <Badge status={r.status} />,
		},
		{
			key: 'actions',
			header: '',
			render: (r) => (
				<div className="flex justify-end gap-2">
					{canRequest && r.status !== 'unavailable' && (
						<button
							className={
								requestItems.some((item) => item.id === r.id)
									? 'btn-secondary btn-sm'
									: 'btn-primary btn-sm'
							}
							onClick={() => toggleRequestSelection(r)}
						>
							{requestItems.some((item) => item.id === r.id)
								? 'Selected'
								: 'Add to request'}
						</button>
					)}
					{canManage && (
						<>
							<button
								className="btn-secondary btn-sm"
								disabled={isReadOnlyAdmin}
								onClick={() => {
									setEditing(r);
									setFormOpen(true);
								}}
							>
								Edit
							</button>
							<button
								className="btn-danger btn-sm"
								disabled={isReadOnlyAdmin}
								onClick={() =>
									setConfirmTarget({ type: 'deactivate-equipment', item: r })
								}
							>
								Deactivate
							</button>
							<button
								className="btn-danger btn-sm"
								disabled={isReadOnlyAdmin}
								onClick={() => handleRemove(r)}
							>
								Delete
							</button>
						</>
					)}
				</div>
			),
		},
	];

	return (
		<div className="space-y-4">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
				<div>
					<h1 className="text-xl font-bold text-slate-900">
						Equipment Inventory
					</h1>
					<p className="text-sm text-slate-500">
						Reusable properties such as chairs, sound systems, and projectors.
					</p>
				</div>
				<div className="flex items-center gap-2">
					{canManage && (
						<Button
							disabled={isReadOnlyAdmin}
							onClick={() => {
								setEditing(null);
								setFormOpen(true);
							}}
						>
							<Icon name="plus" className="h-4 w-4" /> Add Equipment
						</Button>
					)}
					{requestItems.length > 0 && (
						<Button
							variant="secondary"
							onClick={() => setRequestDialogOpen(true)}
						>
							Review selected ({requestItems.length})
						</Button>
					)}
				</div>
			</div>

			<Card>
				<div className="mb-4 grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
					<Input
						className="h-9"
						label="Search by name, asset code, or barcode"
						placeholder={searchPlaceholder}
						value={search}
						onChange={(e) => {
							setPage(1);
							setSearch(e.target.value);
						}}
					/>
					{canScanBarcode && (
						<Button
							type="button"
							variant="secondary"
							className="h-9 w-full"
							onClick={() => setScannerOpen(true)}
							title="Scan an equipment barcode with your webcam"
						>
							<Icon name="camera" className="h-4 w-4" /> Scan barcode
						</Button>
					)}
					<Select
						className="h-9"
						label="Filter by status"
						value={status}
						onChange={(e) => {
							setPage(1);
							setStatus(e.target.value);
						}}
					>
						<option value="">All statuses</option>
						<option value="available">Available</option>
						<option value="partially_available">Partially available</option>
						<option value="unavailable">Unavailable</option>
					</Select>
				</div>

				{loading && <Spinner />}
				{!loading && !error && (
					<>
						<Table
							columns={columns}
							rows={data?.data}
							emptyMessage="No equipment found."
						/>
						<Pagination meta={data} onPageChange={setPage} />
					</>
				)}
			</Card>

			<EquipmentFormModal
				open={formOpen}
				onClose={() => setFormOpen(false)}
				equipment={editing}
				onSaved={() => {
					refetch();
				}}
			/>
			<ConfirmActionModal
				open={!!confirmTarget}
				onClose={() => setConfirmTarget(null)}
				title={
					confirmTarget?.type === 'delete-equipment'
						? 'Delete Equipment'
						: 'Deactivate Equipment'
				}
				message={
					confirmTarget?.type === 'delete-equipment'
						? `Permanently delete ${confirmTarget?.item?.name}? This cannot be undone.`
						: `Deactivate ${confirmTarget?.item?.name}?`
				}
				confirmLabel={
					confirmTarget?.type === 'delete-equipment'
						? 'Delete equipment'
						: 'Deactivate'
				}
				variant="danger"
				onConfirm={async () => {
					let message;
					if (confirmTarget.type === 'delete-equipment') {
						await equipmentApi.remove(confirmTarget.item.id);
						message = `${confirmTarget.item.name} deleted.`;
					} else {
						await equipmentApi.deactivate(confirmTarget.item.id);
						message = `${confirmTarget.item.name} deactivated.`;
					}
					dispatchSuccess(message);
					refetch();
					setConfirmTarget(null);
				}}
			/>
			{barcodeTarget && (
				<EquipmentBarcodeModal
					open
					onClose={() => setBarcodeTarget(null)}
					equipment={barcodeTarget}
					scanEnabled={canScanBarcode}
				/>
			)}
			{scannerOpen && (
				<EquipmentBarcodeModal
					open
					onClose={() => setScannerOpen(false)}
					equipment={null}
					scanEnabled={canScanBarcode}
					onScanned={(barcode) => {
						setSearch(barcode);
						setPage(1);
						setScannerOpen(false);
					}}
				/>
			)}
			<NewEquipmentRequestModal
				open={requestDialogOpen}
				onClose={() => {
					setRequestDialogOpen(false);
					setRequestTarget(null);
					setRequestItems([]);
				}}
				equipment={requestTarget}
				items={requestItems}
				onSaved={() => {
					refetch();
					setRequestDialogOpen(false);
					setRequestTarget(null);
					setRequestItems([]);
				}}
			/>
		</div>
	);
}
