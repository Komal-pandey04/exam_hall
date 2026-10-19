import { clearToken, getToken } from './auth.js';

const BASE_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_APIURL || 'http://localhost:5000/api').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  constructor(message, { status = 0, isNetwork = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetwork = isNetwork;
  }
}

async function request(path, { method = 'GET', body, adminKey } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(adminKey ? { 'x-admin-key': adminKey } : {}),
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Unable to reach the server. Please check your internet connection and try again.', { isNetwork: true });
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 204) return null;
  let data = null;
  try {
    data = await response.json();
  } catch {
    /* non-JSON body */
  }
  if (!response.ok) {
    // An expired/revoked login: forget it and let the app send the user to /login.
    if (response.status === 401 && getToken() && !path.startsWith('/auth/login') && !path.startsWith('/auth/signup')) {
      clearToken();
      window.dispatchEvent(new Event('examhall:unauthorized'));
    }
    throw new ApiError(data?.message || `Request failed (${response.status}).`, { status: response.status });
  }
  return data;
}

export const api = {
  signup: (body) => request('/auth/signup', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  loginHistory: () => request('/auth/history'),
  myResults: () => request('/results'),

  getStats: () => request('/stats'),
  getTests: () => request('/tests'),
  getTest: (id) => request(`/tests/${id}`),
  startAttempt: (payload) => request('/attempts', { method: 'POST', body: payload }),
  getAttempt: (id) => request(`/attempts/${id}`),
  checkAnswer: (questionId, attemptId, selectedIndex) =>
    request(`/questions/${questionId}/check`, { method: 'POST', body: { attemptId, selectedIndex } }),
  submitResult: (payload) => request('/results', { method: 'POST', body: payload }),
  getResult: (attemptId) => request(`/results/${attemptId}`),

  admin: {
    ping: (key) => request('/admin/ping', { adminKey: key }),
    listTests: (key) => request('/tests/admin/all', { adminKey: key }),
    createTest: (key, body) => request('/tests', { method: 'POST', body, adminKey: key }),
    updateTest: (key, id, body) => request(`/tests/${id}`, { method: 'PUT', body, adminKey: key }),
    deleteTest: (key, id) => request(`/tests/${id}`, { method: 'DELETE', adminKey: key }),
    listQuestions: (key, testId) => request(`/questions?testId=${testId}`, { adminKey: key }),
    createQuestion: (key, body) => request('/questions', { method: 'POST', body, adminKey: key }),
    updateQuestion: (key, id, body) => request(`/questions/${id}`, { method: 'PUT', body, adminKey: key }),
    deleteQuestion: (key, id) => request(`/questions/${id}`, { method: 'DELETE', adminKey: key }),
  },
};
