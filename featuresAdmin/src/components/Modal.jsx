import {useEffect} from 'react';

function Modal({open, title, children, onClose, className = ''}) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="modalBackdrop"
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose?.();
      }}>
      <section
        className={`modal ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={title}>
        <header>
          <h2>{title}</h2>
          <button
            className="modalCloseButton"
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ">
            <span aria-hidden="true">×</span>
            Đóng
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

export default Modal;
