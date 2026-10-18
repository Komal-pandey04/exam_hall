import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Button from '../Button.jsx';
import { optionLetter } from '../../utils/format.js';

const input = 'mt-1 w-full rounded-lg border border-slate-300 px-3 text-sm';

export default function QuestionForm({ initial, onSave, onCancel, saving, error }) {
  const [question, setQuestion] = useState(initial?.question ?? '');
  const [options, setOptions] = useState(initial?.options ?? ['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(initial?.correctIndex ?? 0);
  const [explanation, setExplanation] = useState(initial?.explanation ?? '');
  const [source, setSource] = useState(initial?.source ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [marks, setMarks] = useState(initial?.customMarks ?? '');

  const setOption = (i, value) => setOptions((list) => list.map((o, idx) => (idx === i ? value : o)));
  const removeOption = (i) => {
    setOptions((list) => list.filter((_, idx) => idx !== i));
    setCorrectIndex((c) => (c === i ? 0 : c > i ? c - 1 : c));
  };

  function submit(e) {
    e.preventDefault();
    onSave({
      question,
      options,
      correctIndex,
      explanation,
      source,
      imageUrl: imageUrl.trim(),
      marks: marks === '' ? null : Number(marks),
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-medium text-slate-800">Question
        <textarea className={`${input} py-2`} rows={3} value={question} onChange={(e) => setQuestion(e.target.value)} required maxLength={2000} />
      </label>

      <fieldset>
        <legend className="text-sm font-medium text-slate-800">Options (select the correct one)</legend>
        <div className="mt-2 space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="correct" className="h-4 w-4 shrink-0 accent-emerald-600" checked={correctIndex === i} onChange={() => setCorrectIndex(i)} aria-label={`Option ${optionLetter(i)} is correct`} />
              <span className="w-5 text-sm font-bold text-slate-600">{optionLetter(i)}</span>
              <input className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm" value={opt} onChange={(e) => setOption(i, e.target.value)} required maxLength={500} aria-label={`Option ${optionLetter(i)} text`} />
              {options.length > 2 && (
                <button type="button" onClick={() => removeOption(i)} aria-label={`Remove option ${optionLetter(i)}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
              )}
            </div>
          ))}
        </div>
        {options.length < 6 && (
          <button type="button" onClick={() => setOptions((o) => [...o, ''])} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-indigo-800 hover:underline"><Plus size={14} /> Add option</button>
        )}
      </fieldset>

      <label className="block text-sm font-medium text-slate-800">Explanation (shown after submission)
        <textarea className={`${input} py-2`} rows={3} value={explanation} onChange={(e) => setExplanation(e.target.value)} maxLength={4000} />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm font-medium text-slate-800">Source tag
          <input className={`${input} h-10`} value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. UGC NET 2018" maxLength={200} />
        </label>
        <label className="block text-sm font-medium text-slate-800">Marks (blank = test default)
          <input className={`${input} h-10`} type="number" min="0" max="100" step="0.25" value={marks} onChange={(e) => setMarks(e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-800">Image URL (optional)
          <input className={`${input} h-10`} type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
        </label>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : initial ? 'Update question' : 'Add question'}</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
