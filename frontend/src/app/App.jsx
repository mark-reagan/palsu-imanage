import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import ToastViewport from '../components/ui/ToastViewport';
import { AuthProvider } from '../features/auth/AuthContext';
import AppRoutes from './routes';
import { ThemeProvider } from './themeContext';

export default function App() {
	const [theme, setTheme] = useState(() => {
		const saved = localStorage.getItem('palsu-theme');
		return saved || 'light';
	});
	const [booting, setBooting] = useState(true);

	useEffect(() => {
		const timer = window.setTimeout(() => setBooting(false), 700);
		return () => window.clearTimeout(timer);
	}, []);

	useEffect(() => {
		document.documentElement.dataset.theme = theme;
		localStorage.setItem('palsu-theme', theme);
	}, [theme]);

	if (booting) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100">
				<div className="flex flex-col items-center gap-4 text-center">
					<img
						src="/palsu-imanage/palsu-imanage-logo.svg"
						alt="PalSU-iManage logo"
						className="h-20 w-20 drop-shadow-sm"
					/>
					<div>
						<p className="text-3xl font-black tracking-tight text-orange-600">
							PalSU-iManage
						</p>
						<p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-700">
							Smarter Management
						</p>
					</div>
					<div className="h-1.5 w-32 overflow-hidden rounded-full bg-orange-100">
						<div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-amber-600" />
					</div>
				</div>
			</div>
		);
	}

	return (
		<ThemeProvider
			theme={theme}
			toggleTheme={() =>
				setTheme((current) => (current === 'light' ? 'dark' : 'light'))
			}
		>
			<ErrorBoundary>
				<BrowserRouter>
					<AuthProvider>
						<AppRoutes />
					</AuthProvider>
					<ToastViewport />
				</BrowserRouter>
			</ErrorBoundary>
		</ThemeProvider>
	);
}
