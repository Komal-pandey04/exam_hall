import { Check, X } from 'lucide-react';
import { optionLetter } from '../utils/format.js';

/**
 * Renders the answer choices.
 * `feedback` ({ correctIndex }) switches it to marked mode (practice): the right option turns
 * green, a wrong pick turns red, and the list locks.
 */
export default function OptionList({ options, selectedIndex, onSelect, feedback, disabled = false }) {
  const locked = Boolean(feedback) || disabled;
  return (
    <div role="radiogroup" aria-label="Answer options" className="space-y-3">
      {options.map((text, index) => {
        const selected = selectedIndex === index;
        const isCorrect = feedback && index === feedback.correctIndex;
        const isWrongPick = feedback && selected && index !== feedback.correctIndex;

        let tone = 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/40';
        let badge = 'border-slate-300 text-slate-600';
        if (selected && !feedback) {
          tone = 'border-indigo-700 bg-indigo-50';
          badge = 'border-indigo-700 bg-indigo-700 text-white';
        }
        if (isCorrect) {
          tone = 'border-emerald-600 bg-emerald-50';
          badge = 'border-emerald-600 bg-emerald-600 text-white';
        }
        if (isWrongPick) {
          tone = 'border-red-500 bg-red-50';
          badge = 'border-red-500 bg-red-500 text-white';
        }
        if (locked && !selected && !isCorrect) tone = 'border-slate-200 bg-white opacity-70';

        return (
          <button
            key={index}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={locked}
            onClick={() => onSelect(index)}
            className={`flex min-h-12 w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition-colors disabled:cursor-default sm:p-4 ${tone}`}
          >
            <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-sm font-bold ${badge}`}>
              {isCorrect ? <Check size={16} strokeWidth={3} /> : isWrongPick ? <X size={16} strokeWidth={3} /> : optionLetter(index)}
            </span>
            <span className="min-w-0 flex-1 break-words pt-0.5 text-[15px] leading-6 text-slate-800">{text}</span>
          </button>
        );
      })}
    </div>
  );
}
