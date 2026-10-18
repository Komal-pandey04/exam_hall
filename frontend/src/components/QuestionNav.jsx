import { ChevronLeft, ChevronRight, Eraser, Flag } from 'lucide-react';
import Button from './Button.jsx';

/** Fixed to the bottom on phones (easy thumb reach), inline under the card on desktop. */
export default function QuestionNav({ isFirst, isLast, marked, hasAnswer, canClear, onPrev, onNext, onToggleMark, onClear }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white px-3 pt-3 lg:static lg:border-0 lg:bg-transparent lg:px-0 lg:pt-0" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 lg:max-w-none">
        <Button variant="secondary" onClick={onPrev} disabled={isFirst} aria-label="Previous question" className="flex-1 sm:flex-none">
          <ChevronLeft size={18} /> <span className="sm:hidden">Prev</span><span className="hidden sm:inline">Previous</span>
        </Button>
        <Button variant={marked ? 'violet' : 'violetOutline'} onClick={onToggleMark} aria-pressed={marked} className="flex-[2] sm:flex-none">
          <Flag size={16} /> {marked ? 'Unmark review' : 'Mark for review'}
        </Button>
        {canClear && (
          <div className="hidden sm:block">
            <Button variant="ghost" onClick={onClear} disabled={!hasAnswer}>
              <Eraser size={16} /> Clear answer
            </Button>
          </div>
        )}
        <Button onClick={onNext} disabled={isLast} aria-label="Next question" className="flex-1 sm:ml-auto sm:flex-none">
          <span className="sm:hidden">Next</span><span className="hidden sm:inline">Save &amp; Next</span> <ChevronRight size={18} />
        </Button>
        {canClear && hasAnswer && (
          <button type="button" onClick={onClear} className="w-full py-1 text-center text-sm font-medium text-slate-600 underline sm:hidden">
            Clear answer
          </button>
        )}
      </div>
    </div>
  );
}
