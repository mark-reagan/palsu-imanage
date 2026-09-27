import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { getToken } from '../../lib/apiClient';

let echo;
let echoToken;

export function getNotificationEcho() {
	const key = import.meta.env.VITE_REVERB_APP_KEY?.trim();
	const host = import.meta.env.VITE_REVERB_HOST?.trim();
	const token = getToken();
	if (!key || !host || !token || typeof window === 'undefined') return null;
	if (echo && echoToken === token) return echo;
	if (echo) echo.disconnect();

	window.Pusher = Pusher;
	echoToken = token;
	echo = new Echo({
		broadcaster: 'reverb',
		key,
		wsHost: host,
		wsPort: Number(import.meta.env.VITE_REVERB_PORT || 8080),
		wssPort: Number(import.meta.env.VITE_REVERB_PORT || 443),
		forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'https') === 'https',
		enabledTransports: ['ws', 'wss'],
		authEndpoint: `${import.meta.env.VITE_API_URL}/broadcasting/auth`,
		auth: {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	});

	return echo;
}

export function leaveNotificationChannel(userId) {
	if (!echo || !userId) return;
	echo.leave(`App.Models.User.${userId}`);
}
