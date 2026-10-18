import { useEffect } from 'react';
import { X } from 'lucide-react';

/** Mobile/tablet slide-over that holds the question palette. */
export default function PaletteDrawer({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div className="anim-fade-in absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden="true" />
      <aside role="dialog" aria-modal="true" aria-label="Question palette" className="anim-slide-in absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
          <h2 className="font-semibold text-slate-900">Question palette</h2>
          <button type="button" onClick={onClose} aria-label="Close palette" className="grid h-10 w-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          {children}
        </div>
      </aside>
    </div>
  );
}
