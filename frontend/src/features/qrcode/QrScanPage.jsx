import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ErrorAlert from '../../components/ui/ErrorAlert';

function getTrackingToken(value) {
	const scannedValue = value.trim();
	if (!scannedValue) return null;

	try {
		const url = new URL(scannedValue);
		const pathParts = url.pathname.split('/');
		const trackIndex = pathParts.indexOf('track');
		return trackIndex >= 0 ? pathParts[trackIndex + 1] : null;
	} catch {
		return scannedValue;
	}
}

export default function QrScanPage() {
	const navigate = useNavigate();
	const videoRef = useRef(null);
	const controlsRef = useRef(null);
	const [cameraError, setCameraError] = useState(null);
	const [code, setCode] = useState('');
	const [error, setError] = useState(null);

	function openRequest(value) {
		const token = getTrackingToken(value);
		if (!token) {
			setError(
				new Error('This QR code does not contain a request status link.'),
			);
			return;
		}

		controlsRef.current?.stop();
		navigate(`/track/${encodeURIComponent(token)}`);
	}

	useEffect(() => {
		if (!videoRef.current) return undefined;

		const reader = new BrowserMultiFormatReader();
		reader
			.decodeFromVideoDevice(undefined, videoRef.current, (scanResult) => {
				if (!scanResult) return;
				const scannedValue = scanResult.getText().trim();
				setCode(scannedValue);
				const token = getTrackingToken(scannedValue);
				if (!token) {
					setError(
						new Error('This QR code does not contain a request status link.'),
					);
					return;
				}
				controlsRef.current?.stop();
				navigate(`/track/${encodeURIComponent(token)}`);
			})
			.then((controls) => {
				controlsRef.current = controls;
			})
			.catch(() =>
				setCameraError(
					'Camera access is unavailable. Paste the request QR code link below.',
				),
			);

		return () => {
			controlsRef.current?.stop();
			controlsRef.current = null;
		};
	}, [navigate]);

	function handleScan(event) {
		event.preventDefault();
		setError(null);
		openRequest(code);
	}

	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-xl font-bold text-slate-900">Request QR Scan</h1>
				<p className="text-sm text-slate-500">
					Scan a request QR code to open its status and release it when
					approved.
				</p>
			</div>

			<Card>
				<div className="overflow-hidden rounded-lg bg-slate-900">
					<video
						ref={videoRef}
						className="aspect-video w-full object-cover"
						muted
						playsInline
					/>
				</div>
				<p className="my-2 text-xs text-slate-500">
					Allow camera access to scan the QR code on the request confirmation.
				</p>
				<ErrorAlert error={cameraError ? new Error(cameraError) : null} />
				<form onSubmit={handleScan} className="mt-2 flex gap-2">
					<div className="flex-1">
						<Input
							placeholder="Paste request status link"
							value={code}
							onChange={(event) => setCode(event.target.value)}
						/>
					</div>
					<Button type="submit">Open</Button>
				</form>
			</Card>

			<ErrorAlert error={error} />
		</div>
	);
}
