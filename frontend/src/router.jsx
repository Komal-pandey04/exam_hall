import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import LandingPage from './pages/LandingPage.jsx';
import InstructionsPage from './pages/InstructionsPage.jsx';
import ExamPage from './pages/ExamPage.jsx';
import ResultPage from './pages/ResultPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import AccountPage from './pages/AccountPage.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// A data router is used so the exam page can block accidental back-navigation (useBlocker).
export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <AuthPage mode="login" /> },
      { path: '/signup', element: <AuthPage mode="signup" /> },
      {
        element: <RequireAuth />,
        children: [
          { path: '/test/:testId', element: <InstructionsPage /> },
          { path: '/result/:attemptId', element: <ResultPage /> },
          { path: '/account', element: <AccountPage /> },
        ],
      },
      { path: '/admin', element: <AdminPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { element: <RequireAuth />, children: [{ path: '/exam', element: <ExamPage /> }] },
]);
