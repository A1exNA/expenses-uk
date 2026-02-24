import React from 'react';
import styles from './Card.module.css';

const Card = ({ children, title, footer, className = '', ...props }) => {
  return (
    <div className={`${styles.card} ${className}`} {...props}>
      {title && (
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
        </div>
      )}
      <div className={styles.body}>
        {children}
      </div>
      {footer && (
        <div className={styles.footer}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;