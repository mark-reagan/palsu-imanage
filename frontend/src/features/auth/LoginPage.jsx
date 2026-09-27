import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ErrorAlert from '../../components/ui/ErrorAlert';
import { useAuth } from './useAuth';

export default function LoginPage() {
	const { login } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [form, setForm] = useState({ email: '', password: '' });
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(false);

	const from = location.state?.from?.pathname || '/';

	async function handleSubmit(e) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			await login(form);
			navigate(from, { replace: true });
		} catch (err) {
			setError(err);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="w-full max-w-sm rounded-2xl border border-orange-100 bg-white/90 p-6 shadow-lg shadow-amber-100/60 backdrop-blur-sm">
			<h1 className="mb-1 text-2xl font-bold text-slate-900">Welcome back</h1>
			<p className="mb-6 text-sm text-slate-500">Sign in to PalSU-iManage.</p>

			<form onSubmit={handleSubmit} className="space-y-4">
				<Input
					label="Email address"
					type="email"
					name="email"
					autoComplete="email"
					required
					value={form.email}
					onChange={(e) => setForm({ ...form, email: e.target.value })}
				/>
				<Input
					label="Password"
					type="password"
					name="password"
					autoComplete="current-password"
					required
					value={form.password}
					onChange={(e) => setForm({ ...form, password: e.target.value })}
				/>

				<ErrorAlert error={error} />

				<Button type="submit" className="w-full" loading={loading}>
					Sign in
				</Button>
			</form>
		</div>
	);
}
