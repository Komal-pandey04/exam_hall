import { Link, Outlet } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-1 text-sm font-medium text-slate-700">
            <a href="/#tests" className="rounded-lg px-3 py-2 hover:bg-slate-100">Tests</a>
            <a href="/#how-it-works" className="hidden rounded-lg px-3 py-2 hover:bg-slate-100 sm:block">How it works</a>
            <Link to="/admin" className="hidden rounded-lg px-3 py-2 hover:bg-slate-100 sm:block">Admin</Link>
            {user ? (
              <>
                <Link to="/account" className="rounded-lg px-3 py-2 hover:bg-slate-100">My account</Link>
                <button type="button" onClick={logout} className="rounded-lg px-3 py-2 hover:bg-slate-100">Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-lg px-3 py-2 hover:bg-slate-100">Log in</Link>
                <Link to="/signup" className="rounded-lg bg-indigo-700 px-3 py-2 text-white hover:bg-indigo-800">Sign up</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-slate-600 sm:flex-row sm:px-6">
          <Logo />
          <p>Questions compiled from previous-year Commerce exams for practice use.</p>
          <p>© {new Date().getFullYear()} ExamHall</p>
        </div>
      </footer>
    </div>
  );
}
