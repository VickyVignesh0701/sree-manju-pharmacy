import { loginApi, clearApiSession, getApiToken } from './api';

export async function authenticate(username, password) {
  if (!username?.trim() || !password) throw new Error('Username and password are required.');
  return loginApi(username.trim(), password);
}

export function isAuthenticated() {
  return Boolean(getApiToken());
}

export function logoutApi() {
  clearApiSession();
}
