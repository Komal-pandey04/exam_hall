import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import Button from './Button.jsx';

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-20 text-slate-600">
      <Loader2 className="animate-spin text-indigo-700" size={32} />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'Something went wrong' }) {
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-16 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-red-100 text-red-600">
        <AlertTriangle size={24} />
      </span>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-600">{error?.message || 'Please try again.'}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500">
        <Inbox size={24} />
      </span>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {message && <p className="text-sm text-slate-600">{message}</p>}
      {action}
    </div>
  );
}
