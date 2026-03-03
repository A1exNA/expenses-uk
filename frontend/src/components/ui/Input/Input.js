import React, { useId } from 'react';
import styles from './Input.module.css';

const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  error,
  required = false,
  placeholder = '',
  disabled = false,
  className = '',
  fullWidth = false,
  ariaDescribedBy,
  children,
  ...props
}) => {
  // Используем useId для генерации стабильного ID
  const id = useId();
  const inputId = `input-${name}-${id}`;
  const errorId = error ? `${inputId}-error` : undefined;
  
  const inputClasses = [
    styles.input,
    error ? styles.error : '',
    className
  ].filter(Boolean).join(' ');

  const fullWidthStyle = fullWidth ? { width: '100%' } : {};

  return (
    <div className={styles.formGroup} style={fullWidthStyle}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}{required && ' *'}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
          style={fullWidthStyle}
          aria-invalid={!!error}
          aria-describedby={errorId || ariaDescribedBy}
          {...props}
        />
      ) : type === 'select' ? (
        <select
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={inputClasses}
          style={fullWidthStyle}
          aria-invalid={!!error}
          aria-describedby={errorId || ariaDescribedBy}
          {...props}
        >
          {children}
        </select>
      ) : (
        <input
          type={type}
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
          style={fullWidthStyle}
          aria-invalid={!!error}
          aria-describedby={errorId || ariaDescribedBy}
          {...props}
        />
      )}
      {error && <div id={errorId} className={styles.errorMessage} role="alert">{error}</div>}
    </div>
  );
};

export default Input;
