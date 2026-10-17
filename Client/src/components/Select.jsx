import { Children, useEffect, useId, useMemo, useRef, useState } from 'react';

// Select-only combobox: keyboard focus stays on its trigger.
export default function Select({
  children,
  value = '',
  onChange,
  disabled,
  'aria-label': label,
}) {
  const id = useId(),
    root = useRef(null),
    trigger = useRef(null),
    list = useRef(null),
    typed = useRef({ text: '', time: 0 });
  const options = useMemo(
    () =>
      Children.toArray(children)
        .filter((child) => child?.type === 'option')
        .map((child) => ({
          value: String(child.props.value ?? child.props.children),
          label: Children.toArray(child.props.children).join(''),
          disabled: child.props.disabled,
        })),
    [children],
  );
  const selected = options.findIndex(
    (option) => option.value === String(value),
  );
  const [open, setOpen] = useState(false),
    [active, setActive] = useState(0),
    [above, setAbove] = useState(false);
  const [limit, setLimit] = useState(260);
  function expand() {
    if (disabled) return;
    const rect = trigger.current.getBoundingClientRect(),
      below = window.innerHeight - rect.bottom - 16;
    const flip = below < 180 && rect.top > below;
    setAbove(flip);
    setLimit(Math.max(80, Math.min(260, flip ? rect.top - 16 : below)));
    setActive(Math.max(selected, 0));
    setOpen(true);
  }
  function choose(index) {
    if (!options[index] || options[index].disabled) return;
    onChange?.({ target: { value: options[index].value } });
    setOpen(false);
    trigger.current?.focus();
  }
  useEffect(() => {
    if (!open) return;
    const outside = (e) => {
      if (!root.current?.contains(e.target)) setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener('pointerdown', outside);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('resize', close);
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const box = list.current,
      item = box?.children[active];
    if (!item) return;
    if (item.offsetTop < box.scrollTop) box.scrollTop = item.offsetTop;
    else if (
      item.offsetTop + item.offsetHeight >
      box.scrollTop + box.clientHeight
    )
      box.scrollTop = item.offsetTop + item.offsetHeight - box.clientHeight;
  }, [active, open]);
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);
  function key(e) {
    if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      }
      return;
    }
    if (e.key === 'Tab') {
      setOpen(false);
      return;
    }
    if (['Enter', ' '].includes(e.key)) {
      e.preventDefault();
      if (open) choose(active);
      else expand();
      return;
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      if (!open) {
        expand();
        return;
      }
      const step = e.key === 'ArrowUp' ? -1 : 1;
      let next =
        e.key === 'Home'
          ? 0
          : e.key === 'End'
            ? options.length - 1
            : Math.max(0, Math.min(options.length - 1, active + step));
      while (options[next]?.disabled && next >= 0 && next < options.length)
        next += step;
      if (options[next]) setActive(next);
      return;
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      const now = Date.now();
      typed.current = {
        text:
          now - typed.current.time > 700 ? e.key : typed.current.text + e.key,
        time: now,
      };
      const index = options.findIndex(
        (o) =>
          !o.disabled &&
          o.label.toLowerCase().startsWith(typed.current.text.toLowerCase()),
      );
      if (index >= 0) {
        if (!open) expand();
        setActive(index);
      }
      e.preventDefault();
    }
  }
  return (
    <div
      ref={root}
      className={`cl-select ${open ? 'is-open' : ''}`}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type='button'
        ref={trigger}
        className='cl-select-trigger'
        role='combobox'
        aria-label={label}
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-controls={id}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        disabled={disabled}
        onKeyDown={key}
        onClick={() => (open ? setOpen(false) : expand())}
      >
        <span>{options[selected]?.label || options[0]?.label || 'Select'}</span>
        <svg
          width='14'
          height='14'
          viewBox='0 0 16 16'
          fill='none'
          aria-hidden='true'
        >
          <path d='m4 6 4 4 4-4' stroke='currentColor' strokeWidth='1.5' />
        </svg>
      </button>
      <div
        ref={list}
        id={id}
        className={`cl-select-options ${above ? 'above' : ''}`}
        style={{ maxHeight: limit }}
        role='listbox'
        aria-label={label}
        aria-hidden={!open}
      >
        {options.map((option, index) => (
          <div
            key={option.value}
            id={`${id}-${index}`}
            role='option'
            aria-selected={index === selected}
            aria-disabled={option.disabled || undefined}
            className={index === active ? 'is-active' : ''}
            onPointerMove={() => !option.disabled && setActive(index)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              choose(index);
            }}
          >
            <span>{option.label}</span>
            {index === selected && <span aria-hidden='true'>✓</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
