import {useEffect, useId, useRef, useState} from 'react';

function SelectDropdown({
  label,
  value,
  options,
  placeholder = 'Chọn...',
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listId = useId();

  const selected = options.find(item => String(item.value) === String(value));

  useEffect(() => {
    const handleClickOutside = event => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = event => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <label className="customSelect" ref={rootRef}>
      {label}
      <button
        type="button"
        className={`customSelectTrigger ${open ? 'open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen(current => !current)}>
        <span>{selected?.label || placeholder}</span>
        <span className="customSelectArrow">▾</span>
      </button>

      {open && (
        <ul className="customSelectMenu" id={listId} role="listbox">
          {options.map(option => {
            const active = String(option.value) === String(value);
            return (
              <li key={`${option.value}-${option.label}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`customSelectOption ${active ? 'active' : ''}`}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}>
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </label>
  );
}

export default SelectDropdown;
