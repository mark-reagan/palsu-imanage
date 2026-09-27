import PropTypes from 'prop-types';

export default function SuccessAlert({ message, className = '' }) {
	if (!message) return null;

	return (
		<div
			className={`rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 ${className}`}
			role="status"
			aria-live="polite"
		>
			{message}
		</div>
	);
}

SuccessAlert.propTypes = {
	message: PropTypes.string,
	className: PropTypes.string,
};
