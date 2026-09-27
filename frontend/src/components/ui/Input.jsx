import { forwardRef } from 'react';

const Input = forwardRef(function Input({ label, error, id, className = '', ...props }, ref) {
  const inputId = id || props.name;
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`input ${error ? 'ring-red-400' : ''} ${className} interactive-focus`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
});

export default Input;
