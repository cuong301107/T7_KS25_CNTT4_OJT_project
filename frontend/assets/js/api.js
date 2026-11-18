// ShopEase - API client (fetch wrapper)
const API = {
  getToken() {
    return localStorage.getItem('shopease_token');
  },

  async request(method, url, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = API.getToken();
    if (token) headers.Authorization = 'Bearer ' + token;

    let res;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
    } catch (e) {
      const err = new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối.');
      err.status = 0;
      throw err;
    }

    let data = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = null;
    }

    if (!res.ok) {
      const err = new Error((data && data.message) || `Lỗi máy chủ (${res.status}).`);
      err.status = res.status;
      throw err;
    }
    return data;
  },

  get: (url) => API.request('GET', url),
  post: (url, body) => API.request('POST', url, body),
  put: (url, body) => API.request('PUT', url, body),
  patch: (url, body) => API.request('PATCH', url, body),
  del: (url) => API.request('DELETE', url)
};
