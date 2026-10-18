import { getQuestionStatus, STATUS_LABELS, STATUS_STYLES } from '../utils/palette.js';

export function PaletteLegend() {
  return (
    <ul className="grid grid-cols-1 gap-y-2 text-xs text-slate-700 sm:grid-cols-2">
      {STATUS_LABELS.map(([status, label]) => (
        <li key={status} className="flex items-center gap-2">
          <span aria-hidden="true" className={`relative grid h-6 w-6 place-items-center rounded-md border-2 text-[10px] ${STATUS_STYLES[status]}`}>
            {status === 'answeredMarked' && <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full border border-white bg-emerald-400" />}
          </span>
          {label}
        </li>
      ))}
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="h-6 w-6 rounded-md border-2 border-slate-300 ring-2 ring-indigo-700 ring-offset-2" />
        Current question
      </li>
    </ul>
  );
}

export default function QuestionPalette({ questions, session, onJump }) {
  return (
    <div>
      <div className="grid grid-cols-5 gap-2" role="group" aria-label="Question palette">
        {questions.map((q, index) => {
          const status = getQuestionStatus(q.id, session);
          const isCurrent = index === session.current;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onJump(index)}
              aria-label={`Question ${index + 1}: ${STATUS_LABELS.find(([s]) => s === status)[1]}${isCurrent ? ', current' : ''}`}
              aria-current={isCurrent ? 'true' : undefined}
              className={`relative grid h-10 place-items-center border-2 text-sm font-semibold transition ${STATUS_STYLES[status]} ${status === 'marked' || status === 'answeredMarked' ? '' : 'rounded-md'} ${isCurrent ? 'ring-2 ring-indigo-700 ring-offset-2' : ''}`}
            >
              {index + 1}
              {status === 'answeredMarked' && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
