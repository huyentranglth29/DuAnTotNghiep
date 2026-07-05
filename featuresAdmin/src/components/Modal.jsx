function Modal({open, title, children, onClose}) {
  if (!open) {
    return null;
  }

  return (
    <div className="modalBackdrop">
      <section className="modal">
        <header>
          <h2>{title}</h2>
          <button type="button" onClick={onClose}>
            Đóng
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

export default Modal;
