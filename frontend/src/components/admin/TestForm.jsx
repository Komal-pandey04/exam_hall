import { useState } from 'react';
import Button from '../Button.jsx';

const field = 'mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm';

/** Create / edit a test: duration, marks and negative marking. */
export default function TestForm({ initial, onSave, onCancel, saving, error }) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    durationMinutes: initial?.durationMinutes ?? 30,
    marksPerQuestion: initial?.marksPerQuestion ?? 1,
    negativeMarking: initial?.negativeMarking ?? false,
    negativeMarks: initial?.negativeMarks ?? 0.25,
    isActive: initial?.isActive ?? true,
  });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  function submit(e) {
    e.preventDefault();
    onSave({
      title: form.title,
      description: form.description,
      durationMinutes: Number(form.durationMinutes),
      marksPerQuestion: Number(form.marksPerQuestion),
      negativeMarking: form.negativeMarking,
      negativeMarks: Number(form.negativeMarks),
      isActive: form.isActive,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-medium text-slate-800">Title
        <input className={field} value={form.title} onChange={set('title')} required minLength={3} maxLength={200} />
      </label>
      <label className="block text-sm font-medium text-slate-800">Description
        <textarea className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={2} value={form.description} onChange={set('description')} maxLength={1000} />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm font-medium text-slate-800">Duration (minutes)
          <input className={field} type="number" min="1" max="600" step="1" value={form.durationMinutes} onChange={set('durationMinutes')} required />
        </label>
        <label className="block text-sm font-medium text-slate-800">Marks per question
          <input className={field} type="number" min="0.25" max="100" step="0.25" value={form.marksPerQuestion} onChange={set('marksPerQuestion')} required />
        </label>
        <label className="block text-sm font-medium text-slate-800">Negative marks
          <input className={field} type="number" min="0" max="100" step="0.25" value={form.negativeMarks} onChange={set('negativeMarks')} disabled={!form.negativeMarking} />
        </label>
      </div>
      <div className="flex flex-wrap gap-6 text-sm text-slate-800">
        <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-indigo-700" checked={form.negativeMarking} onChange={set('negativeMarking')} /> Enable negative marking</label>
        <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-indigo-700" checked={form.isActive} onChange={set('isActive')} /> Visible to students</label>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save test'}</Button>
        {onCancel && <Button variant="secondary" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
