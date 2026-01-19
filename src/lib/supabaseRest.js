const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const getBaseUrl = () => (supabaseUrl || '').replace(/\/$/, '');

export const supabaseRestFetch = async (path, { accessToken, method = 'GET', body, headers } = {}) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials not found. Please check your .env.local file.');
  }

  const response = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers: {
      apikey: supabaseAnonKey,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'string'
      ? payload
      : (payload?.message || payload?.error?.message || JSON.stringify(payload));

    const error = new Error(`Supabase REST error (${response.status}): ${message}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

