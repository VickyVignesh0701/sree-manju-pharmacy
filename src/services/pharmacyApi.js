import { apiGet, apiPost, apiPut, apiDelete, setApiSession, clearApiSession, getApiToken } from './api';

export const pharmacyApi = {
  request: apiGet,
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,

  auth: {
    // Returns whether a session exists, not the raw token - the token itself
    // now lives in an HttpOnly cookie set by the backend and is intentionally
    // unreadable from JS.
    hasSession: getApiToken,
    setSession: setApiSession,
    clearSession: clearApiSession,
  },

  medicines: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiGet(`medicines${query ? `?${query}` : ''}`);
    },
    get: (id) => apiGet(`medicines/${encodeURIComponent(id)}`),
    create: (payload) => apiPost('medicines', payload),
    remove: (id) => apiDelete(`medicines/${encodeURIComponent(id)}`),
  },

  batches: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiGet(`batches${query ? `?${query}` : ''}`);
    },
  },

  stock: {
    receive: (payload) => apiPost('stock/receive', payload),
    sell: (payload) => apiPost('stock/sell', payload),
    customerReturn: (payload) => apiPost('stock/customer-return', payload),
    dealerReturn: (payload) => apiPost('stock/dealer-return', payload),
    disposal: (payload) => apiPost('stock/disposal', payload),
    history: (medicineId, limit = 100) => apiGet(`stock/history?medicine_id=${encodeURIComponent(medicineId)}&limit=${encodeURIComponent(limit)}`),
  },

  sales: {
    create: (payload) => apiPost('sales', payload),
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiGet(`sales/list${query ? `?${query}` : ''}`);
    },
  },

  returns: {
    customer: (payload) => apiPost('returns/customer', payload),
    dealer: (payload) => apiPost('returns/dealer', payload),
    disposal: (payload) => apiPost('returns/disposal', payload),
  },

  dealers: {
    list: () => apiGet('dealers'),
    create: (payload) => apiPost('dealers', payload),
  },

  purchaseVerification: {
    list: () => apiGet('purchase-verification'),
    verify: (payload) => apiPost('purchase-verification', payload),
  },

  reconciliation: () => apiGet('reconciliation'),
};

export const setPharmacyApiToken = (token, user = null) => setApiSession(token, user);
export const clearPharmacyApiToken = clearApiSession;
