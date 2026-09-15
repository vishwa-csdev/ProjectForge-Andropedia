const API_PREFIX = '/api';
import { getNeonAccessToken } from './auth';

async function fetchWrapper(path, options = {}) {
  const url = `${API_PREFIX}${path}`;
  const headers = {
    ...options.headers,
  };

  const accessToken = await getNeonAccessToken();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const errorData = await response.json();
      errorDetail = errorData.message || errorData.detail || errorDetail;
    } catch (e) {
      // Ignored
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) return null;

  try {
    return await response.json();
  } catch (e) {
    return null;
  }
}

export const api = {
  get: (path) => fetchWrapper(path, { method: 'GET' }),
  post: (path, body) => fetchWrapper(path, { method: 'POST', body }),
  put: (path, body) => fetchWrapper(path, { method: 'PUT', body }),
  delete: (path) => fetchWrapper(path, { method: 'DELETE' }),
};
