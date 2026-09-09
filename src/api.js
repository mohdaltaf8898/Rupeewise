// Typed fetch wrapper + API client for the Express backend.

async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (res.status === 204) return null;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

export const api = {
  health: () => request('/api/health'),
  categories: () => request('/api/categories'),
  stats: () => request('/api/stats'),

  listExpenses(params = {}) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== '' && v !== undefined && v !== null) q.set(k, v);
    }
    return request(`/api/expenses?${q.toString()}`);
  },

  createExpense: (data) => request('/api/expenses', { method: 'POST', body: JSON.stringify(data) }),
  updateExpense: (id, data) => request(`/api/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpense: (id) => request(`/api/expenses/${id}`, { method: 'DELETE' }),
  deleteAllExpenses: () => request('/api/expenses?confirm=all', { method: 'DELETE' }),

  exportUrl(params = {}) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== '' && v !== undefined && v !== null) q.set(k, v);
    }
    return `/api/expenses/export.csv?${q.toString()}`;
  },
};
