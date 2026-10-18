import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import Button from '../components/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup';
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const target = state?.from || '/';

  if (user) return <Navigate to={target} replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (isSignup) await signup(form.name, form.email, form.password);
      else await login(form.email, form.password);
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const input = 'mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-900 placeholder:text-slate-400';
  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
      <h1 className="text-2xl font-extrabold text-slate-900">{isSignup ? 'Create your account' : 'Welcome back'}</h1>
      <p className="mt-2 text-slate-600">
        {isSignup ? 'Sign up to take the mock tests. Your results are saved to your account.' : 'Log in to take mock tests and see your saved results.'}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {isSignup && (
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-slate-900">Full name</label>
            <input id="name" value={form.name} onChange={set('name')} required minLength={2} maxLength={80} autoComplete="name" className={input} />
          </div>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-slate-900">Email</label>
          <input id="email" type="email" value={form.email} onChange={set('email')} required maxLength={200} autoComplete="email" className={input} />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-slate-900">Password</label>
          <input id="password" type="password" value={form.password} onChange={set('password')} required minLength={isSignup ? 8 : 1} maxLength={128} autoComplete={isSignup ? 'new-password' : 'current-password'} className={input} />
          {isSignup && <p className="mt-1 text-xs text-slate-600">At least 8 characters.</p>}
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <Button type="submit" size="lg" disabled={busy} className="w-full">
          {isSignup ? <UserPlus size={18} /> : <LogIn size={18} />} {busy ? 'Please wait…' : isSignup ? 'Sign up' : 'Log in'}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-700">
        {isSignup ? 'Already have an account?' : 'New here?'}{' '}
        <Link to={isSignup ? '/login' : '/signup'} state={state} className="font-semibold text-indigo-800 hover:underline">
          {isSignup ? 'Log in' : 'Create an account'}
        </Link>
      </p>
    </div>
  );
}
