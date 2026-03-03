import React, { useEffect, useRef } from 'react';
import Button from '../Button/Button';
import styles from './Modal.module.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  showCloseButton = true 
}) => {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const wasJustOpened = useRef(false);
  const initialOverflow = useRef('auto');

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Сохраняем текущее значение overflow перед изменением
      initialOverflow.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      // Устанавливаем фокус на модальное окно только при первом открытии
      if (!wasJustOpened.current && modalRef.current) {
        modalRef.current.focus();
        wasJustOpened.current = true;
      }
    } else {
      // Возвращаем исходное значение overflow
      document.body.style.overflow = initialOverflow.current;
      wasJustOpened.current = false;
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      // При размонтировании всегда возвращаем overflow
      document.body.style.overflow = initialOverflow.current;
    };
  }, [isOpen, onClose]);

  // Добавляем защиту от рендера при isOpen = false
  if (!isOpen) return null;

  return (
    <div 
      className={styles.overlay} 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <h3 id="modal-title" className={styles.title}>{title}</h3>
          {showCloseButton && (
            <button 
              className={styles.closeButton} 
              onClick={onClose}
              aria-label="Закрыть"
              ref={closeButtonRef}
            >
              ×
            </button>
          )}
        </div>
        <div className={styles.content}>
          {children}
        </div>
        {footer && (
          <div className={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
