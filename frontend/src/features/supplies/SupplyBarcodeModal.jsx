import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { BrowserMultiFormatReader } from '@zxing/browser';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ErrorAlert from '../../components/ui/ErrorAlert';
import Spinner from '../../components/ui/Spinner';
import BarcodeImage from './BarcodeImage';
import { dispatchError } from '../../lib/toast';
import { suppliesApi } from './api';

export default function SupplyBarcodeModal({
	open,
	onClose,
	supply,
	scanEnabled,
	onScanned,
}) {
	const videoRef = useRef(null);
	const controlsRef = useRef(null);
	const submitBarcodeRef = useRef(null);
	const onScannedRef = useRef(null);
	const barcodeRef = useRef(null);
	const [code, setCode] = useState(supply?.barcode || '');
	const [result, setResult] = useState(null);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(false);
	const [cameraError, setCameraError] = useState(null);

	useEffect(() => {
		submitBarcodeRef.current = submitBarcode;
		onScannedRef.current = onScanned;
	});

	useEffect(() => {
		if (!open || !scanEnabled || !videoRef.current) return undefined;

		const reader = new BrowserMultiFormatReader();
		reader
			.decodeFromVideoDevice(undefined, videoRef.current, (scanResult) => {
				if (scanResult) {
					const scannedCode = scanResult.getText().trim();
					setCode(scannedCode);
					submitBarcodeRef.current?.(scannedCode);
					controlsRef.current?.stop();
				}
			})
			.then((controls) => {
				controlsRef.current = controls;
			})
			.catch(() =>
				setCameraError(
					'Camera access is unavailable. Enter the barcode manually.',
				),
			);

		return () => {
			controlsRef.current?.stop();
			controlsRef.current = null;
		};
	}, [open, scanEnabled]);

	async function lookup(value = code) {
		const barcode = value.trim().toUpperCase();
		if (!barcode) return;
		setLoading(true);
		setError(null);
		try {
			setResult(await suppliesApi.statusByBarcode(barcode));
		} catch (err) {
			setResult(null);
			setError(err);
		} finally {
			setLoading(false);
		}
	}

	function submitBarcode(value = code) {
		const barcode = value.trim().toUpperCase();
		if (!/^SUP-(?:[A-Z0-9]{10}|[0-9]{8})$/.test(barcode)) {
			setResult(null);
			setError(null);
			dispatchError('Enter a valid supply barcode.');
			return;
		}

		setError(null);
		if (onScannedRef.current) {
			onScannedRef.current(barcode);
			controlsRef.current?.stop();
			return;
		}
		lookup(barcode);
	}

	function downloadBarcode() {
		if (!barcodeRef.current || !supply?.barcode) return;

		const svg = new XMLSerializer().serializeToString(barcodeRef.current);
		const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${supply.barcode}-barcode.svg`;
		link.click();
		URL.revokeObjectURL(url);
	}

	return (
		<Modal
			open={open}
			onClose={onClose}
			title={scanEnabled ? 'Scan supply barcode' : 'Supply barcode'}
			size="md"
		>
			<div className="space-y-4">
				{scanEnabled && (
					<>
						<div className="overflow-hidden rounded-lg bg-slate-900">
							<video
								ref={videoRef}
								className="aspect-video w-full object-cover"
								muted
								playsInline
							/>
						</div>
						<p className="text-xs text-slate-500">
							Allow camera access to scan a CODE128 barcode, or enter its code
							below.
						</p>
						<form
							className="flex w-full items-end gap-2"
							onSubmit={(event) => {
								event.preventDefault();
								submitBarcode();
							}}
						>
							<div className="min-w-0 flex-1">
								<Input
									className="w-full"
									label="Barcode code"
									value={code}
									onChange={(event) => setCode(event.target.value)}
									placeholder="SUP-00000001"
								/>
							</div>
							<Button type="submit" loading={loading} className="shrink-0">
								Check
							</Button>
						</form>
						<ErrorAlert error={cameraError ? new Error(cameraError) : error} />
					</>
				)}
				{supply?.barcode && (
					<div className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
						<p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
							Printable barcode
						</p>
						<div className="max-w-full overflow-hidden">
							<BarcodeImage
								value={supply.barcode}
								label={`Barcode for ${supply.name}`}
								svgRef={barcodeRef}
							/>
						</div>
						<Button
							type="button"
							variant="secondary"
							size="sm"
							className="mt-3"
							onClick={downloadBarcode}
						>
							Download barcode
						</Button>
					</div>
				)}
				{scanEnabled && loading && <Spinner />}
				{scanEnabled && result && (
					<div className="space-y-4 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
						<div className="flex items-start justify-between gap-4">
							<div>
								<h2 className="font-semibold text-[var(--text)]">
									{result.supply.name}
								</h2>
								<p className="text-sm text-[var(--text-soft)]">
									{result.supply.barcode}
								</p>
							</div>
							<Badge status={result.supply.is_active ? 'active' : 'inactive'} />
						</div>
						<div className="grid grid-cols-2 gap-3 text-sm">
							<div>
								<p className="text-[var(--text-soft)]">Available stock</p>
								<p className="font-semibold text-[var(--text)]">
									{result.supply.stock_quantity} {result.supply.unit}
								</p>
							</div>
							<div>
								<p className="text-[var(--text-soft)]">Latest request</p>
								<p className="font-semibold capitalize text-[var(--text)]">
									{result.latest_request?.status || 'No requests'}
								</p>
							</div>
						</div>
					</div>
				)}
			</div>
		</Modal>
	);
}

SupplyBarcodeModal.propTypes = {
	open: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	supply: PropTypes.shape({
		barcode: PropTypes.string,
		name: PropTypes.string,
	}),
	scanEnabled: PropTypes.bool.isRequired,
	onScanned: PropTypes.func,
};
