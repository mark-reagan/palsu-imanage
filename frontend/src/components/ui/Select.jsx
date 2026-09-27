import { forwardRef } from 'react';

const Select = forwardRef(function Select({ label, error, id, className = '', children, ...props }, ref) {
  const inputId = id || props.name;
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        className={`input ${error ? 'ring-red-400' : ''} ${className} interactive-focus`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
});

export default Select;
