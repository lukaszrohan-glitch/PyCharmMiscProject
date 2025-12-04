import { useState, useCallback } from 'react';
import { request as coreRequest } from '../services/api';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (endpoint, options = {}) => {
    try {
      setLoading(true);
      setError(null);

      return await coreRequest(endpoint, {
        credentials: 'include',
        ...options,
      });
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { request, loading, error };
}

// API methods
export const api = {
  get: (endpoint, options = {}) => coreRequest(endpoint, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...options.headers,
    },
    ...options,
  }),

  post: (endpoint, data, options = {}) => coreRequest(endpoint, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(data),
    ...options,
  }),

  // Similar implementations for put, delete, etc.
};

export async function fetchWithRetry(url, options = {}, retries = 3, backoff = 300) {
  try {
    return await coreRequest(url.replace(API_BASE, ''), options)
  } catch (err) {
    if (retries <= 0) throw err
    await new Promise(r => setTimeout(r, backoff))
    return fetchWithRetry(url, options, retries - 1, backoff * 2)
  }
}
