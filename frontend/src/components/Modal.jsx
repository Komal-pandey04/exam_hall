import { useEffect, useRef } from 'react';

/** Accessible dialog: Escape closes, focus moves inside, background scroll is locked. */
export default function Modal({ title, onClose, children, footer, dismissible = true }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape' && dismissible) onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [onClose, dismissible]);

  return (
    <div className="anim-fade-in fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && dismissible && onClose?.()}>
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="anim-pop-in w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl outline-none sm:rounded-2xl"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <h2 id="modal-title" className="text-lg font-bold text-slate-900">
          {title}
        </h2>
        <div className="mt-3 text-sm text-slate-600">{children}</div>
        {footer && <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  );
}
