import { useState } from 'react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import ConfirmActionModal from '../../components/ui/ConfirmActionModal';
import Icon from '../../components/ui/Icon';
import { useApiRequest } from '../../hooks/useApiRequest';
import { useAuth } from '../auth/useAuth';
import { ROLES } from '../../lib/constants';
import { suppliesApi } from './api';
import { dispatchSuccess } from '../../lib/toast';
import SupplyFormModal from './SupplyFormModal';
import NewSupplyRequestModal from '../supply-requests/NewSupplyRequestModal';
import SupplyBarcodeModal from './SupplyBarcodeModal';
import { useOfflineMode } from '../../hooks/useOfflineMode';

export default function SuppliesListPage() {
	const { user } = useAuth();
	const { isReadOnlyAdmin } = useOfflineMode();
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [showDeactivated, setShowDeactivated] = useState(false);
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState(null);
	const [requestTarget, setRequestTarget] = useState(null);
	const [requestDialogOpen, setRequestDialogOpen] = useState(false);
	const [requestItems, setRequestItems] = useState([]);
	const [barcodeTarget, setBarcodeTarget] = useState(null);
	const [scannerOpen, setScannerOpen] = useState(false);
	const [confirmTarget, setConfirmTarget] = useState(null);

	const { data, error, loading, refetch } = useApiRequest(
		(signal) =>
			suppliesApi.list(
				{ page, search, deactivated: showDeactivated ? 1 : undefined },
				signal,
			),
		[page, search, showDeactivated],
	);

	const canManage = user.role === ROLES.ADMIN;
	const canScanBarcode = user.role === ROLES.ADMIN || user.role === ROLES.STAFF;
	const canRequest = user.role === ROLES.FACULTY;
	const searchPlaceholder = canScanBarcode
		? 'Search supplies or scan code'
		: 'Search supplies';

	function toggleRequestSelection(item) {
		setRequestItems((current) => {
			const exists = current.some((entry) => entry.id === item.id);
			if (exists) {
				return current.filter((entry) => entry.id !== item.id);
			}
			return [...current, item];
		});
	}

	async function handleRemove(supply) {
		if (isReadOnlyAdmin) return;
		setConfirmTarget({ type: 'delete-supply', item: supply });
	}

	const columns = [
		{
			key: 'name',
			header: 'Name',
			render: (r) => (
				<span className="font-medium text-slate-900">{r.name}</span>
			),
		},
		{ key: 'category', header: 'Category', render: (r) => r.category || '—' },
		{ key: 'unit', header: 'Unit' },
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
		{
			key: 'stock',
			header: 'Stock',
			render: (r) => (
				<span
					className={
						r.stock_quantity <= r.reorder_level
							? 'font-semibold text-red-600'
							: ''
					}
				>
					{r.stock_quantity} {r.unit}
					{r.stock_quantity <= r.reorder_level && ' (low)'}
				</span>
			),
		},
		{ key: 'reorder_level', header: 'Reorder level' },
		{
			key: 'actions',
			header: '',
			render: (r) => (
				<div className="flex justify-end gap-2">
					{canRequest && r.is_active && r.stock_quantity > 0 && (
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
					{canManage &&
						(r.is_active ? (
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
										setConfirmTarget({ type: 'deactivate-supply', item: r })
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
						) : (
							<>
								<button
									className="btn-primary btn-sm"
									disabled={isReadOnlyAdmin}
									onClick={() =>
										setConfirmTarget({ type: 'activate-supply', item: r })
									}
								>
									Activate
								</button>
								<button
									className="btn-danger btn-sm"
									disabled={isReadOnlyAdmin}
									onClick={() => handleRemove(r)}
								>
									Delete
								</button>
							</>
						))}
				</div>
			),
		},
	];

	return (
		<div className="space-y-4">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
				<div>
					<h1 className="text-xl font-bold text-slate-900">Supply Inventory</h1>
					<p className="text-sm text-slate-500">
						Consumable items such as coupon bond, paper, and pens.
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
							<Icon name="plus" className="h-4 w-4" /> Add Supply
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
						label="Search by name or supply code"
						placeholder={searchPlaceholder}
						value={search}
						onChange={(e) => {
							setPage(1);
							setSearch(e.target.value);
						}}
					/>
					{canScanBarcode && (
						<Button
							className="h-9 w-full"
							variant="secondary"
							type="button"
							onClick={() => setScannerOpen(true)}
							title="Scan a supply barcode with your webcam"
						>
							<Icon name="camera" className="h-4 w-4" /> Scan barcode
						</Button>
					)}
					{canManage && (
						<Select
							className="h-9"
							label="Filter by activation"
							value={showDeactivated ? 'deactivated' : 'active'}
							onChange={(event) => {
								setPage(1);
								setShowDeactivated(event.target.value === 'deactivated');
							}}
						>
							<option value="active">Active</option>
							<option value="deactivated">Deactivated</option>
						</Select>
					)}
				</div>

				{loading && <Spinner />}
				{!loading && !error && (
					<>
						<Table
							columns={columns}
							rows={data?.data}
							emptyMessage="No supplies found."
						/>
						<Pagination meta={data} onPageChange={setPage} />
					</>
				)}
			</Card>

			<SupplyFormModal
				open={formOpen}
				onClose={() => setFormOpen(false)}
				supply={editing}
				onSaved={() => {
					refetch();
				}}
			/>
			<ConfirmActionModal
				open={!!confirmTarget}
				onClose={() => setConfirmTarget(null)}
				title={
					confirmTarget?.type === 'delete-supply'
						? 'Delete Supply'
						: confirmTarget?.type === 'activate-supply'
							? 'Activate Supply'
							: 'Deactivate Supply'
				}
				message={
					confirmTarget?.type === 'delete-supply'
						? `Permanently delete ${confirmTarget?.item?.name}? This cannot be undone.`
						: `${confirmTarget?.type === 'activate-supply' ? 'Activate' : 'Deactivate'} ${confirmTarget?.item?.name}?`
				}
				confirmLabel={
					confirmTarget?.type === 'delete-supply'
						? 'Delete supply'
						: confirmTarget?.type === 'activate-supply'
							? 'Activate supply'
							: 'Deactivate'
				}
				variant={
					confirmTarget?.type === 'activate-supply' ? 'primary' : 'danger'
				}
				onConfirm={async () => {
					if (confirmTarget.type === 'delete-supply') {
						await suppliesApi.remove(confirmTarget.item.id);
						dispatchSuccess(`${confirmTarget.item.name} deleted.`);
					} else if (confirmTarget.type === 'activate-supply') {
						await suppliesApi.activate(confirmTarget.item.id);
						dispatchSuccess(`${confirmTarget.item.name} activated.`);
					} else {
						await suppliesApi.deactivate(confirmTarget.item.id);
						dispatchSuccess(`${confirmTarget.item.name} deactivated.`);
					}
					refetch();
					setConfirmTarget(null);
				}}
			/>
			<NewSupplyRequestModal
				open={requestDialogOpen}
				onClose={() => {
					setRequestDialogOpen(false);
					setRequestTarget(null);
					setRequestItems([]);
				}}
				supply={requestTarget}
				items={requestItems}
				onSaved={() => {
					refetch();
					setRequestDialogOpen(false);
					setRequestTarget(null);
					setRequestItems([]);
				}}
			/>
			{barcodeTarget && (
				<SupplyBarcodeModal
					open
					onClose={() => setBarcodeTarget(null)}
					supply={barcodeTarget}
					scanEnabled={canScanBarcode}
				/>
			)}
			{scannerOpen && (
				<SupplyBarcodeModal
					open
					onClose={() => setScannerOpen(false)}
					scanEnabled={canScanBarcode}
					onScanned={(barcode) => {
						setSearch(barcode);
						setPage(1);
						setScannerOpen(false);
					}}
					supply={null}
				/>
			)}
		</div>
	);
}
