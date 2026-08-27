const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export function getApiToken() {
  return localStorage.getItem('sree_manju_api_token');
}

export function setApiSession(token, user) {
  if (token) localStorage.setItem('sree_manju_api_token', token);
  if (user) localStorage.setItem('sree_manju_api_user', JSON.stringify(user));
}

export function clearApiSession() {
  localStorage.removeItem('sree_manju_api_token');
  localStorage.removeItem('sree_manju_api_user');
}

export async function apiRequest(path, options = {}) {
  const token = getApiToken();
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}/${String(path).replace(/^\//, '')}`, { ...options, headers });
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

export function apiGet(path) { return apiRequest(path); }
export function apiPost(path, body) { return apiRequest(path, { method: 'POST', body: JSON.stringify(body) }); }
export function apiPut(path, body) { return apiRequest(path, { method: 'PUT', body: JSON.stringify(body) }); }
export function apiDelete(path) { return apiRequest(path, { method: 'DELETE' }); }
