import React from 'react';
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
  ...props
}) => {
  const inputId = `input-${name}-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={styles.formGroup}>
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
          className={`${styles.input} ${error ? styles.error : ''} ${className}`}
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
          className={`${styles.input} ${error ? styles.error : ''} ${className}`}
          {...props}
        >
          {props.children}
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
          className={`${styles.input} ${error ? styles.error : ''} ${className}`}
          {...props}
        />
      )}
      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );
};

export default Input;