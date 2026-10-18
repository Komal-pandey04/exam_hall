import { Flag, Timer } from 'lucide-react';
import OptionList from './OptionList.jsx';
import { formatClock, formatMarks } from '../utils/format.js';

export default function QuestionCard({ question, number, total, selectedIndex, onSelect, feedback, marked, disabled, timeOnQuestion }) {
  return (
    <section aria-labelledby="question-heading" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
          Question {number} of {total}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{formatMarks(question.marks)} {question.marks === 1 ? 'mark' : 'marks'}</span>
        {timeOnQuestion !== undefined && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 tabular-nums text-slate-700" title="Time spent on this question">
            <Timer size={12} /> {formatClock(timeOnQuestion)}
          </span>
        )}
        {question.source && <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-800">{question.source}</span>}
        {marked && (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-violet-800">
            <Flag size={12} /> Marked for review
          </span>
        )}
      </div>

      <h2 id="question-heading" className="whitespace-pre-line break-words text-lg font-semibold leading-7 text-slate-900">
        {question.question}
      </h2>

      {question.imageUrl && (
        <img src={question.imageUrl} alt="Illustration for this question" loading="lazy" className="mt-4 max-h-72 max-w-full rounded-lg border border-slate-200 object-contain" />
      )}

      <div className="mt-5">
        <OptionList options={question.options} selectedIndex={selectedIndex} onSelect={onSelect} feedback={feedback} disabled={disabled} />
      </div>

      {feedback && (
        <div role="status" className={`mt-5 rounded-xl border p-4 text-sm ${feedback.isCorrect ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-900'}`}>
          <p className="font-semibold">{feedback.isCorrect ? 'Correct!' : 'Incorrect.'}</p>
          {feedback.explanation && <p className="mt-1 whitespace-pre-line leading-6">{feedback.explanation}</p>}
        </div>
      )}
    </section>
  );
}
