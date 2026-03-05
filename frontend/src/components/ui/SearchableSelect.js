import React, { useState, useMemo, useRef, useEffect } from 'react';
import styles from './Input/Input.module.css';

const SearchableSelect = ({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  placeholder = 'Поиск...',
  disabled = false,
  error,
  className = '',
  ...props
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Фильтрация опций по поисковому запросу
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    return options.filter(option => 
      option.label?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  // Находим выбранную опцию
  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (option) => {
    onChange({ target: { name, value: option.value } });
    setIsOpen(false);
    setSearchTerm('');
  };

  const inputId = `select-${name}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={styles.formGroup} ref={wrapperRef}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}{required && ' *'}
        </label>
      )}
      
      <div className={styles.selectWrapper}>
        {/* Поле для отображения выбранного значения и поиска */}
        <div 
          className={`${styles.selectInput} ${error ? styles.error : ''} ${isOpen ? styles.open : ''} ${className}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          {selectedOption ? (
            <span>{selectedOption.label}</span>
          ) : (
            <span className={styles.placeholder}>Выберите...</span>
          )}
          <span className={`${styles.arrow} ${isOpen ? styles.open : ''}`}>▼</span>
        </div>

        {/* Выпадающий список с поиском */}
        {isOpen && !disabled && (
          <div className={styles.dropdown}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            <div className={styles.optionsList}>
              {filteredOptions.length === 0 ? (
                <div className={styles.noOptions}>Ничего не найдено</div>
              ) : (
                filteredOptions.map(option => (
                  <div
                    key={option.value}
                    className={`${styles.option} ${option.value === value ? styles.selected : ''}`}
                    onClick={() => handleSelect(option)}
                  >
                    {option.label}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {error && <div className={styles.errorMessage} role="alert">{error}</div>}
    </div>
  );
};

export default SearchableSelect;
