const API_BASE = '/pharmacy/sree-manju-pharmacy/api/index.php';

const getToken = () => localStorage.getItem('sree_manju_api_token') || '';

async function request(path, options = {}) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`API returned invalid JSON (${response.status}).`);
  }

  if (!response.ok || data?.success === false) {
    const error = new Error(data?.message || `API request failed (${response.status}).`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

const post = (path, body) => request(path, {
  method: 'POST',
  body: JSON.stringify(body)
});

export const pharmacyApi = {
  request,
  post,

  stock: {
    receive: (payload) => post('/stock/receive', payload),
    sell: (payload) => post('/stock/sell', payload),
    customerReturn: (payload) => post('/stock/customer-return', payload),
    dealerReturn: (payload) => post('/stock/dealer-return', payload),
    disposal: (payload) => post('/stock/disposal', payload),
    history: (medicineId, limit = 100) => request(`/stock/history?medicine_id=${encodeURIComponent(medicineId)}&limit=${encodeURIComponent(limit)}`)
  },

  returns: {
    customer: (payload) => post('/returns/customer', payload),
    dealer: (payload) => post('/returns/dealer', payload),
    disposal: (payload) => post('/returns/disposal', payload)
  }
};

export const setPharmacyApiToken = (token) => {
  if (token) localStorage.setItem('sree_manju_api_token', token);
  else localStorage.removeItem('sree_manju_api_token');
};

export const clearPharmacyApiToken = () => {
  localStorage.removeItem('sree_manju_api_token');
};
