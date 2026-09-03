import { loginApi, registerApi, requestPasswordResetApi, confirmPasswordResetApi, logoutApiCall, getApiToken } from './api';

export async function authenticate(username, password) {
  if (!username?.trim() || !password) throw new Error('Username and password are required.');
  return loginApi(username.trim(), password);
}

export async function register(payload) {
  return registerApi(payload);
}

export async function requestPasswordReset(email) {
  return requestPasswordResetApi(email);
}

export async function confirmPasswordReset(token, password) {
  return confirmPasswordResetApi(token, password);
}

export function isAuthenticated() {
  return Boolean(getApiToken());
}

export async function logoutApi() {
  await logoutApiCall();
}
