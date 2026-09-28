import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ErrorAlert from '../../components/ui/ErrorAlert';

function extractTrackingCode(value) {
	const scannedValue = value.trim();
	if (!scannedValue) return '';
	try {
		const url = new URL(scannedValue);
		const pathParts = url.pathname.split('/');
		const trackIndex = pathParts.indexOf('track');
		return trackIndex >= 0 ? pathParts[trackIndex + 1] || '' : scannedValue;
	} catch {
		return scannedValue;
	}
}

export default function RequestQrScannerModal({ open, onClose, onScanned }) {
	const videoRef = useRef(null);
	const controlsRef = useRef(null);
	const onScannedRef = useRef(onScanned);
	const [value, setValue] = useState('');
	const [cameraError, setCameraError] = useState(null);

	useEffect(() => {
		onScannedRef.current = onScanned;
	}, [onScanned]);

	useEffect(() => {
		if (!open || !videoRef.current) return undefined;
		const reader = new BrowserMultiFormatReader();
		reader
			.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
				if (!result) return;
				const text = result.getText().trim();
				setValue(text);
				controlsRef.current?.stop();
				onScannedRef.current(extractTrackingCode(text));
			})
			.then((controls) => {
				controlsRef.current = controls;
			})
			.catch(() => {
				setCameraError(
					'Camera access is unavailable. Paste the request QR link or token below.',
				);
			});

		return () => {
			controlsRef.current?.stop();
			controlsRef.current = null;
		};
	}, [open]);

	function submit(event) {
		event.preventDefault();
		const trackingCode = extractTrackingCode(value);
		if (!trackingCode) return;
		onScanned(trackingCode);
	}

	return (
		<Modal open={open} onClose={onClose} title="Scan request QR code" size="md">
			<div className="space-y-3">
				<div className="overflow-hidden rounded-lg bg-slate-900">
					<video
						ref={videoRef}
						className="aspect-video w-full object-cover"
						muted
						playsInline
					/>
				</div>
				<p className="text-xs text-[var(--text-soft)]">
					Scan the request status QR code, or paste its link or tracking token.
				</p>
				<ErrorAlert error={cameraError ? new Error(cameraError) : null} />
				<form
					className="flex flex-col gap-2 sm:flex-row sm:items-end"
					onSubmit={submit}
				>
					<Input
						label="QR link or tracking code"
						value={value}
						onChange={(event) => setValue(event.target.value)}
					/>
					<Button type="submit" className="sm:shrink-0">
						Use code
					</Button>
				</form>
			</div>
		</Modal>
	);
}
