// The login token lives in localStorage so a refresh keeps the student signed in.
const KEY = 'examhall.token.v1';

export const getToken = () => {
  try { return localStorage.getItem(KEY) || ''; } catch { return ''; }
};
export const setToken = (token) => {
  try { localStorage.setItem(KEY, token); } catch { /* storage blocked: session lasts until reload */ }
};
export const clearToken = () => {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
};
