import { useState } from 'react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import ErrorAlert from '../../components/ui/ErrorAlert';
import SuccessAlert from '../../components/ui/SuccessAlert';
import ConfirmActionModal from '../../components/ui/ConfirmActionModal';
import Icon from '../../components/ui/Icon';
import { useApiRequest } from '../../hooks/useApiRequest';
import { useAuth } from '../auth/useAuth';
import { ROLES } from '../../lib/constants';
import { suppliesApi } from './api';
import SupplyFormModal from './SupplyFormModal';
import NewSupplyRequestModal from '../supply-requests/NewSupplyRequestModal';
import SupplyBarcodeModal from './SupplyBarcodeModal';
import { useOfflineMode } from '../../hooks/useOfflineMode';

export default function SuppliesListPage() {
	const { user } = useAuth();
	const { isReadOnlyAdmin } = useOfflineMode();
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState(null);
	const [requestTarget, setRequestTarget] = useState(null);
	const [requestDialogOpen, setRequestDialogOpen] = useState(false);
	const [requestItems, setRequestItems] = useState([]);
	const [barcodeTarget, setBarcodeTarget] = useState(null);
	const [scannerOpen, setScannerOpen] = useState(false);
	const [actionError, setActionError] = useState(null);
	const [successMessage, setSuccessMessage] = useState('');
	const [confirmTarget, setConfirmTarget] = useState(null);

	const { data, error, loading, refetch } = useApiRequest(
		(signal) => suppliesApi.list({ page, search }, signal),
		[page, search],
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
		setActionError(null);
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
					{canRequest && r.stock_quantity > 0 && (
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
					)}
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
				<SuccessAlert message={successMessage} className="mb-4" />
				<div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
					<Input
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
							variant="secondary"
							type="button"
							onClick={() => setScannerOpen(true)}
							title="Scan a supply barcode with your webcam"
						>
							<Icon name="camera" className="h-4 w-4" /> Scan barcode
						</Button>
					)}
				</div>

				{loading && <Spinner />}
				<ErrorAlert error={actionError} />
				<SuccessAlert message={successMessage} className="mb-3" />
				<ErrorAlert error={error} />
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
				onSaved={(saved) => {
					refetch();
					setSuccessMessage(
						`${saved?.name || 'Supply'} ${editing ? 'updated' : 'added'} successfully.`,
					);
				}}
			/>
			<ConfirmActionModal
				open={!!confirmTarget}
				onClose={() => setConfirmTarget(null)}
				title={
					confirmTarget?.type === 'delete-supply'
						? 'Delete Supply'
						: 'Deactivate Supply'
				}
				message={
					confirmTarget?.type === 'delete-supply'
						? `Permanently delete ${confirmTarget?.item?.name}? This cannot be undone.`
						: `Deactivate ${confirmTarget?.item?.name}?`
				}
				confirmLabel={
					confirmTarget?.type === 'delete-supply'
						? 'Delete supply'
						: 'Deactivate'
				}
				variant="danger"
				onConfirm={async () => {
					try {
						if (confirmTarget.type === 'delete-supply') {
							await suppliesApi.remove(confirmTarget.item.id);
							setSuccessMessage(`${confirmTarget.item.name} deleted.`);
						} else {
							await suppliesApi.deactivate(confirmTarget.item.id);
							setSuccessMessage(`${confirmTarget.item.name} deactivated.`);
						}
						refetch();
						setConfirmTarget(null);
					} catch (err) {
						setActionError(err);
						throw err;
					}
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
