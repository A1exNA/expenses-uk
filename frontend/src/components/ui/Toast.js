import toast from 'react-hot-toast';

export const showSuccess = (message) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
    style: {
      background: 'var(--success)',
      color: 'white',
      padding: '12px',
      borderRadius: 'var(--border-radius)',
    },
  });
};

export const showError = (message) => {
  toast.error(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: 'var(--danger)',
      color: 'white',
      padding: '12px',
      borderRadius: 'var(--border-radius)',
    },
  });
};

export const showInfo = (message) => {
  toast(message, {
    duration: 3000,
    position: 'top-right',
    style: {
      background: 'var(--info)',
      color: 'white',
      padding: '12px',
      borderRadius: 'var(--border-radius)',
    },
  });
};
