import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import { clearToken, getToken, setToken } from '../services/auth.js';
import { clearSession } from '../utils/sessionStorage.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(() => Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return undefined;
    let alive = true;
    api.me()
      .then(({ user: u }) => alive && setUser(u))
      .catch((err) => {
        // Only an invalid token logs us out; a network error keeps the stored login.
        if (err.status === 401) clearToken();
      })
      .finally(() => alive && setChecking(false));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('examhall:unauthorized', onUnauthorized);
    return () => window.removeEventListener('examhall:unauthorized', onUnauthorized);
  }, []);

  const finish = useCallback(({ user: u, token }) => {
    setToken(token);
    setUser(u);
    return u;
  }, []);

  const value = useMemo(
    () => ({
      user,
      checking,
      login: async (email, password) => finish(await api.login({ email, password })),
      signup: async (name, email, password) => finish(await api.signup({ name, email, password })),
      logout: async () => {
        try { await api.logout(); } catch { /* token may already be gone */ }
        clearToken();
        clearSession();
        setUser(null);
      },
    }),
    [user, checking, finish]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
