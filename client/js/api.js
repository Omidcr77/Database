export const api = {
  async request(path, { method = 'GET', body, headers } = {}) {
    const res = await fetch(path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(headers || {})
      },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined
    });
    const contentType = res.headers.get('content-type') || '';
    let data = null;
    if (contentType.includes('application/json')) data = await res.json();
    else if (contentType.includes('text/csv')) data = await res.text();
    else if (res.status !== 204) {
      try { data = await res.json(); } catch { data = await res.text(); }
    }
    if (!res.ok) throw new Error((data && data.message) || `HTTP ${res.status}`);
    return data;
  },
  get(path) { return this.request(path); },
  post(path, body) { return this.request(path, { method: 'POST', body }); },
  patch(path, body) { return this.request(path, { method: 'PATCH', body }); },
  del(path) { return this.request(path, { method: 'DELETE' }); }
};

