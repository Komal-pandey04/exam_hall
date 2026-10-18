import { AlertTriangle } from 'lucide-react';
import Button from './Button.jsx';
import Modal from './Modal.jsx';

export default function ConfirmSubmitModal({ summary, onContinue, onSubmit, submitting }) {
  const rows = [
    ['Answered', summary.answered, 'text-emerald-700'],
    ['Unanswered', summary.unanswered, 'text-amber-700'],
    ['Marked for review', summary.marked, 'text-violet-700'],
  ];
  return (
    <Modal
      title="Are you sure you want to submit?"
      onClose={onContinue}
      footer={
        <>
          <Button variant="secondary" onClick={onContinue} disabled={submitting}>
            Continue Test
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Test'}
          </Button>
        </>
      }
    >
      <p>You will not be able to change your answers after submitting.</p>
      <dl className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
        {rows.map(([label, value, tone]) => (
          <div key={label} className="flex items-center justify-between px-4 py-2.5">
            <dt className="text-slate-700">{label}</dt>
            <dd className={`text-lg font-bold tabular-nums ${tone}`}>{value}</dd>
          </div>
        ))}
      </dl>
      {summary.unanswered > 0 && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-amber-900">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {summary.unanswered} question{summary.unanswered > 1 ? 's are' : ' is'} still unanswered.
        </p>
      )}
    </Modal>
  );
}
