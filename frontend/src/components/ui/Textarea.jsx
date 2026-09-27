import { forwardRef } from 'react';

const Textarea = forwardRef(function Textarea({ label, error, id, className = '', rows = 3, ...props }, ref) {
  const inputId = id || props.name;
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={`input ${error ? 'ring-red-400' : ''} ${className} interactive-focus`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
});

export default Textarea;
