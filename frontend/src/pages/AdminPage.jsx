import { useCallback, useEffect, useState } from 'react';
import { Check, KeyRound, LogOut, Pencil, Plus, Trash2 } from 'lucide-react';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import QuestionForm from '../components/admin/QuestionForm.jsx';
import TestForm from '../components/admin/TestForm.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews.jsx';
import { api } from '../services/api.js';
import { formatMarks, optionLetter } from '../utils/format.js';

const KEY_STORAGE = 'examhall.adminKey';
const readKey = () => {
  try { return sessionStorage.getItem(KEY_STORAGE) || ''; } catch { return ''; }
};

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [checking, setChecking] = useState(() => Boolean(readKey()));
  const [loginError, setLoginError] = useState('');

  const login = useCallback(async (key) => {
    setChecking(true);
    setLoginError('');
    try {
      await api.admin.ping(key);
      try { sessionStorage.setItem(KEY_STORAGE, key); } catch { /* ignore */ }
      setAdminKey(key);
    } catch (err) {
      try { sessionStorage.removeItem(KEY_STORAGE); } catch { /* ignore */ }
      setLoginError(err.message);
    } finally {
      setChecking(false);
    }
  }, []);

  const logout = useCallback(() => {
    try { sessionStorage.removeItem(KEY_STORAGE); } catch { /* ignore */ }
    setAdminKey('');
  }, []);

  useEffect(() => {
    const saved = readKey();
    if (saved) login(saved);
  }, [login]);

  if (checking) return <LoadingState label="Checking access…" />;
  if (!adminKey) return <LoginForm onLogin={login} error={loginError} />;
  return <Dashboard adminKey={adminKey} onLogout={logout} />;
}

function LoginForm({ onLogin, error }) {
  const [value, setValue] = useState('');
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <form onSubmit={(e) => { e.preventDefault(); onLogin(value.trim()); }} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-indigo-50 text-indigo-800"><KeyRound size={22} /></span>
        <h1 className="text-xl font-bold text-slate-900">Admin access</h1>
        <p className="text-sm text-slate-600">Enter the ADMIN_KEY configured on the server.</p>
        <input type="password" value={value} onChange={(e) => setValue(e.target.value)} autoComplete="current-password" aria-label="Admin key" className="h-11 w-full rounded-lg border border-slate-300 px-3" />
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <Button type="submit" className="w-full" disabled={!value.trim()}>Unlock</Button>
      </form>
    </div>
  );
}

function Dashboard({ adminKey, onLogout }) {
  const [tests, setTests] = useState({ loading: true, error: null, list: [] });
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState('view'); // view | newTest | editTest

  const loadTests = useCallback(async () => {
    try {
      const { tests: list } = await api.admin.listTests(adminKey);
      setTests({ loading: false, error: null, list });
      setSelectedId((id) => (list.some((t) => t.id === id) ? id : list[0]?.id ?? null));
    } catch (error) {
      if (error.status === 401) return onLogout();
      setTests({ loading: false, error, list: [] });
    }
  }, [adminKey, onLogout]);

  useEffect(() => { loadTests(); }, [loadTests]);

  const selected = tests.list.find((t) => t.id === selectedId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">Question management</h1>
        <Button variant="secondary" size="sm" onClick={onLogout}><LogOut size={14} /> Lock</Button>
      </div>

      {tests.loading && <LoadingState label="Loading tests…" />}
      {tests.error && <ErrorState error={tests.error} onRetry={loadTests} />}

      {!tests.loading && !tests.error && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside>
            <Button className="w-full" onClick={() => setMode('newTest')}><Plus size={16} /> New test</Button>
            <ul className="mt-3 space-y-2">
              {tests.list.map((t) => (
                <li key={t.id}>
                  <button type="button" onClick={() => { setSelectedId(t.id); setMode('view'); }} className={`w-full rounded-xl border p-3 text-left text-sm ${t.id === selectedId ? 'border-indigo-700 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                    <span className="block font-semibold text-slate-900">{t.title}</span>
                    <span className="mt-1 block text-xs text-slate-600">{t.questionCount} questions · {t.durationMinutes} min{!t.isActive && ' · hidden'}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <section className="min-w-0">
            {mode === 'newTest' && (
              <Panel title="Create a test">
                <SaveWrapper run={(body) => api.admin.createTest(adminKey, body)} onDone={async (res) => { await loadTests(); setSelectedId(res.test.id); setMode('view'); }} onAuthFail={onLogout}>
                  {(props) => <TestForm {...props} onCancel={() => setMode('view')} />}
                </SaveWrapper>
              </Panel>
            )}
            {mode === 'editTest' && selected && (
              <Panel title="Test settings">
                <SaveWrapper run={(body) => api.admin.updateTest(adminKey, selected.id, body)} onDone={async () => { await loadTests(); setMode('view'); }} onAuthFail={onLogout}>
                  {(props) => <TestForm {...props} initial={selected} onCancel={() => setMode('view')} />}
                </SaveWrapper>
              </Panel>
            )}
            {mode === 'view' && !selected && <EmptyState title="No tests yet" message="Create your first test to start adding questions." />}
            {mode === 'view' && selected && <TestDetail key={selected.id} adminKey={adminKey} test={selected} onEdit={() => setMode('editTest')} onChanged={loadTests} onAuthFail={onLogout} />}
          </section>
        </div>
      )}
    </div>
  );
}

function Panel({ title, children, actions }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {actions}
      </div>
      {children}
    </div>
  );
}

/** Runs a save request and passes saving/error state to its form child. */
function SaveWrapper({ run, onDone, onAuthFail, children }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function onSave(body) {
    setSaving(true);
    setError('');
    try {
      onDone(await run(body));
    } catch (err) {
      if (err.status === 401) return onAuthFail();
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }
  return children({ onSave, saving, error });
}

function TestDetail({ adminKey, test, onEdit, onChanged, onAuthFail }) {
  const [state, setState] = useState({ loading: true, error: null, questions: [] });
  const [editing, setEditing] = useState(null); // null | 'new' | question
  const [deleting, setDeleting] = useState(null); // null | { type: 'question'|'test', item }
  const [deleteError, setDeleteError] = useState('');

  const load = useCallback(async () => {
    try {
      const { questions } = await api.admin.listQuestions(adminKey, test.id);
      setState({ loading: false, error: null, questions });
    } catch (error) {
      if (error.status === 401) return onAuthFail();
      setState({ loading: false, error, questions: [] });
    }
  }, [adminKey, test.id, onAuthFail]);

  useEffect(() => { load(); }, [load]);

  async function confirmDelete() {
    setDeleteError('');
    try {
      if (deleting.type === 'question') await api.admin.deleteQuestion(adminKey, deleting.item.id);
      else await api.admin.deleteTest(adminKey, test.id);
      setDeleting(null);
      if (deleting.type === 'question') { await load(); onChanged(); } else onChanged();
    } catch (err) {
      if (err.status === 401) return onAuthFail();
      setDeleteError(err.message);
    }
  }

  return (
    <div className="space-y-5">
      <Panel
        title={test.title}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onEdit}><Pencil size={14} /> Settings</Button>
            <Button variant="secondary" size="sm" onClick={() => setDeleting({ type: 'test' })}><Trash2 size={14} /> Delete</Button>
          </div>
        }
      >
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Info label="Duration" value={`${test.durationMinutes} min`} />
          <Info label="Marks / question" value={formatMarks(test.marksPerQuestion)} />
          <Info label="Negative marking" value={test.negativeMarking ? `−${formatMarks(test.negativeMarks)}` : 'Off'} />
          <Info label="Visibility" value={test.isActive ? 'Visible' : 'Hidden'} />
        </dl>
      </Panel>

      {editing ? (
        <Panel title={editing === 'new' ? 'Add question' : 'Edit question'}>
          <SaveWrapper
            run={(body) => (editing === 'new' ? api.admin.createQuestion(adminKey, { ...body, testId: test.id }) : api.admin.updateQuestion(adminKey, editing.id, body))}
            onDone={async () => { setEditing(null); await load(); onChanged(); }}
            onAuthFail={onAuthFail}
          >
            {(props) => <QuestionForm {...props} initial={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} />}
          </SaveWrapper>
        </Panel>
      ) : (
        <Panel title={`Questions (${state.questions.length})`} actions={<Button size="sm" onClick={() => setEditing('new')}><Plus size={14} /> Add question</Button>}>
          {state.loading && <LoadingState label="Loading questions…" />}
          {state.error && <ErrorState error={state.error} onRetry={load} />}
          {!state.loading && !state.error && state.questions.length === 0 && <EmptyState title="No questions in this test" message="Add the first question to make this test available." />}
          <ol className="divide-y divide-slate-100">
            {state.questions.map((q, i) => (
              <li key={q.id} className="flex items-start gap-3 py-3">
                <span className="mt-0.5 w-7 shrink-0 text-sm font-bold text-slate-500">{i + 1}.</span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-slate-900">{q.question}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-emerald-700"><Check size={12} /> {optionLetter(q.correctIndex)}. {q.options[q.correctIndex]}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => setEditing(q)} aria-label={`Edit question ${i + 1}`} className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"><Pencil size={16} /></button>
                  <button type="button" onClick={() => setDeleting({ type: 'question', item: q })} aria-label={`Delete question ${i + 1}`} className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      )}

      {deleting && (
        <Modal
          title={deleting.type === 'test' ? 'Delete this test?' : 'Delete this question?'}
          onClose={() => { setDeleting(null); setDeleteError(''); }}
          footer={
            <>
              <Button variant="secondary" onClick={() => { setDeleting(null); setDeleteError(''); }}>Cancel</Button>
              <Button variant="danger" onClick={confirmDelete}>Delete</Button>
            </>
          }
        >
          <p>{deleting.type === 'test' ? 'This permanently deletes the test, all its questions and all stored results.' : 'This cannot be undone.'}</p>
          {deleteError && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-red-800">{deleteError}</p>}
        </Modal>
      )}
    </div>
  );
}

const Info = ({ label, value }) => (
  <div className="rounded-lg bg-slate-50 p-3">
    <dt className="text-xs text-slate-600">{label}</dt>
    <dd className="font-semibold text-slate-900">{value}</dd>
  </div>
);
