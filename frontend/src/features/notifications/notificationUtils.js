import { useEffect, useState } from 'react';

export function getNotificationPath(notification) {
	const data = notification?.data ?? {};

	if (data.concern_id) return '/concerns';

	const type = data.request_type ?? data.item_type;
	if (type === 'equipment') return '/equipment-requests';
	if (type === 'supply') return '/supply-requests';

	return '/notifications';
}

export function playNotificationSound() {
	if (typeof window === 'undefined') return;
	const AudioContextClass = window.AudioContext || window.webkitAudioContext;
	if (!AudioContextClass) return;

	try {
		const audioContext = new AudioContextClass();
		const masterGain = audioContext.createGain();
		masterGain.gain.value = 0.9;
		masterGain.connect(audioContext.destination);

		const startAt = audioContext.currentTime;
		const notes = [784, 988, 1175];
		const noteDuration = 0.22;

		notes.forEach((frequency, index) => {
			const noteStart = startAt + index * 0.11;
			const noteEnd = noteStart + noteDuration;
			const gain = audioContext.createGain();
			const oscillator = audioContext.createOscillator();
			const overtone = audioContext.createOscillator();
			const overtoneGain = audioContext.createGain();

			oscillator.type = 'triangle';
			oscillator.frequency.setValueAtTime(frequency, noteStart);
			overtone.type = 'sine';
			overtone.frequency.setValueAtTime(frequency * 2, noteStart);
			gain.gain.setValueAtTime(0.001, noteStart);
			gain.gain.exponentialRampToValueAtTime(0.28, noteStart + 0.015);
			gain.gain.exponentialRampToValueAtTime(0.001, noteEnd);
			overtoneGain.gain.value = 0.12;

			oscillator.connect(gain);
			gain.connect(masterGain);
			overtone.connect(overtoneGain);
			overtoneGain.connect(gain);
			oscillator.start(noteStart);
			overtone.start(noteStart);
			oscillator.stop(noteEnd);
			overtone.stop(noteEnd);

			if (index === notes.length - 1) {
				oscillator.onended = () => audioContext.close();
			}
		});
	} catch {
		// Audio is optional; notification delivery should not depend on it.
	}
}

export function useNotificationSoundPreference() {
	const [enabled, setEnabled] = useState(
		() => localStorage.getItem('palsu-notification-sound') === 'enabled',
	);

	useEffect(() => {
		function syncPreference() {
			setEnabled(
				localStorage.getItem('palsu-notification-sound') === 'enabled',
			);
		}
		window.addEventListener('storage', syncPreference);
		window.addEventListener('notification-sound-preference', syncPreference);
		return () => {
			window.removeEventListener('storage', syncPreference);
			window.removeEventListener(
				'notification-sound-preference',
				syncPreference,
			);
		};
	}, []);

	function setPreference(nextEnabled) {
		localStorage.setItem(
			'palsu-notification-sound',
			nextEnabled ? 'enabled' : 'disabled',
		);
		setEnabled(nextEnabled);
		window.dispatchEvent(new Event('notification-sound-preference'));
		if (nextEnabled) playNotificationSound();
	}

	return [enabled, setPreference];
}
