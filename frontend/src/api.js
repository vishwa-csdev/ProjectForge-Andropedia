const API_PREFIX = '/api';
const CACHE_PREFIX = 'andropedia_cache:';
const DEFAULT_TTL_MS = 30 * 1000; // 30 seconds fresh window
const MAX_STALE_MS = 24 * 60 * 60 * 1000; // 24 hours stale fallback for poor network/offline

const memoryCache = new Map();
const inFlightRequests = new Map();

function getCached(key) {
  const mem = memoryCache.get(key);
  if (mem) return mem;

  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      memoryCache.set(key, parsed);
      return parsed;
    }
  } catch (e) {
    // Ignore storage parse errors
  }
  return null;
}

function setCached(key, data) {
  const entry = { data, timestamp: Date.now() };
  memoryCache.set(key, entry);
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
  } catch (e) {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(k);
        }
      }
      localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
    } catch {}
  }
}

function invalidateCache(pathPrefix = '') {
  for (const key of memoryCache.keys()) {
    if (!pathPrefix || key.includes(pathPrefix) || pathPrefix.includes(key)) {
      memoryCache.delete(key);
    }
  }
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) {
        const key = k.slice(CACHE_PREFIX.length);
        if (!pathPrefix || key.includes(pathPrefix) || pathPrefix.includes(key)) {
          localStorage.removeItem(k);
        }
      }
    }
  } catch (e) {}
}

async function fetchWrapper(path, options = {}) {
  const url = `${API_PREFIX}${path}`;
  const headers = {
    ...options.headers,
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 15000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
      signal: options.signal || controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.status === 401) {
      invalidateCache();
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
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export const api = {
  get: async (path, options = {}) => {
    const cacheKey = path;
    const cached = getCached(cacheKey);
    const now = Date.now();
    const isFresh = cached && (now - cached.timestamp < (options.ttl || DEFAULT_TTL_MS));
    const isStaleUsable = cached && (now - cached.timestamp < MAX_STALE_MS);

    // If fresh and not forcing refresh, return immediately (0ms instant response)
    if (isFresh && !options.forceRefresh) {
      return cached.data;
    }

    // Deduplicate concurrent in-flight requests to identical path
    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey);
    }

    const fetchPromise = (async () => {
      try {
        const data = await fetchWrapper(path, { method: 'GET', ...options });
        setCached(cacheKey, data);
        return data;
      } catch (error) {
        // Fall back to stale cache on network failure, timeout, or poor connection
        if (isStaleUsable) {
          console.warn(`[Network resilience] Using cached data for ${path} due to error:`, error.message);
          return cached.data;
        }
        throw error;
      } finally {
        inFlightRequests.delete(cacheKey);
      }
    })();

    inFlightRequests.set(cacheKey, fetchPromise);

    if (isStaleUsable && options.swr) {
      return cached.data;
    }

    return fetchPromise;
  },

  post: async (path, body, options = {}) => {
    const result = await fetchWrapper(path, { method: 'POST', body, ...options });
    if (path.includes('/tasks') || path.includes('/contributions') || path.includes('/resources')) {
      invalidateCache('/dashboard');
      invalidateCache('/projects');
      invalidateCache('/admin');
    } else {
      invalidateCache();
    }
    return result;
  },

  put: async (path, body, options = {}) => {
    const result = await fetchWrapper(path, { method: 'PUT', body, ...options });
    if (path.includes('/tasks') || path.includes('/contributions') || path.includes('/resources')) {
      invalidateCache('/dashboard');
      invalidateCache('/projects');
      invalidateCache('/admin');
    } else {
      invalidateCache();
    }
    return result;
  },

  delete: async (path, options = {}) => {
    const result = await fetchWrapper(path, { method: 'DELETE', ...options });
    invalidateCache();
    return result;
  },

  clearCache: (prefix) => invalidateCache(prefix),
};
