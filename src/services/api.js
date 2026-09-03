const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || `${import.meta.env.BASE_URL}api`).replace(/\/$/, '');

// The real session lives in an HttpOnly cookie the backend sets on login
// (see api/auth.php: setAuthCookie) - JS can't read it, which is the point.
// What's kept here is only a cache of the logged-in user's display info and
// a hasSession flag for the UI to check synchronously; it is not what
// authenticates requests.
export function getApiToken() {
  return localStorage.getItem('sree_manju_has_session') === '1';
}

export function setApiSession(token, user) {
  localStorage.setItem('sree_manju_has_session', '1');
  if (user) localStorage.setItem('sree_manju_api_user', JSON.stringify(user));
}

export function clearApiSession() {
  localStorage.removeItem('sree_manju_has_session');
  localStorage.removeItem('sree_manju_api_user');
  // sree_manju_api_token is legacy - clear it if an older session left one behind.
  localStorage.removeItem('sree_manju_api_token');
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE_URL}/${String(path).replace(/^\//, '')}`, {
    ...options,
    headers,
    credentials: 'include' // send/receive the HttpOnly auth cookie
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { success: false, message: 'Invalid response from server.' }; }

  if (response.status === 401) {
    clearApiSession();
    window.dispatchEvent(new CustomEvent('pharmacy:auth-expired'));
  }
  if (!response.ok || data.success === false) {
    const error = new Error(data.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export async function loginApi(email, password) {
  const data = await apiRequest('auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setApiSession(data.token, data.user);
  return data;
}

export async function logoutApiCall() {
  try {
    await apiRequest('auth/logout', { method: 'POST' });
  } finally {
    clearApiSession();
  }
}

export async function registerApi(payload) {
  return apiRequest('auth/register', { method: 'POST', body: JSON.stringify(payload) });
}

export async function requestPasswordResetApi(email) {
  return apiRequest('auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email }) });
}

export async function confirmPasswordResetApi(token, password) {
  return apiRequest('auth/password-reset/confirm', { method: 'POST', body: JSON.stringify({ token, password }) });
}

export function apiGet(path) { return apiRequest(path); }
export function apiPost(path, body) { return apiRequest(path, { method: 'POST', body: JSON.stringify(body) }); }
export function apiPut(path, body) { return apiRequest(path, { method: 'PUT', body: JSON.stringify(body) }); }
export function apiDelete(path) { return apiRequest(path, { method: 'DELETE' }); }
