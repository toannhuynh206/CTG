const BASE = '/api/v1';

function getToken(): string | null {
  return localStorage.getItem('ctg_session_token');
}

export function setToken(token: string) {
  localStorage.setItem('ctg_session_token', token);
}

export function clearToken() {
  localStorage.removeItem('ctg_session_token');
}

function getAdminKey(): string | null {
  return sessionStorage.getItem('ctg_admin_key');
}

export function setAdminKey(key: string) {
  sessionStorage.setItem('ctg_admin_key', key);
}

export function clearAdminKey() {
  sessionStorage.removeItem('ctg_admin_key');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['X-Session-Token'] = token;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    // Invalid or expired session — clear token and redirect to home
    if (res.status === 401 && !path.startsWith('/admin')) {
      clearToken();
      window.location.href = '/';
      throw new Error('Session expired');
    }
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error || body.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Schedule
  getScheduleStatus: () => request<any>('/schedule/status'),

  // Game
  register: (data: { name: string; city: string; instagram: string }) =>
    request<any>('/game/register', { method: 'POST', body: JSON.stringify(data) }),

  getGameState: () => request<any>('/game/state'),

  startPuzzle: (puzzle_type: string) =>
    request<any>('/game/start-puzzle', {
      method: 'POST',
      body: JSON.stringify({ puzzle_type }),
    }),

  connectionsGuess: (words: string[]) =>
    request<any>('/game/connections/guess', {
      method: 'POST',
      body: JSON.stringify({ words }),
    }),

  crosswordCheck: (grid: (string | null)[][]) =>
    request<any>('/game/crossword/check', {
      method: 'POST',
      body: JSON.stringify({ grid }),
    }),

  crosswordSubmit: (grid: (string | null)[][]) =>
    request<any>('/game/crossword/submit', {
      method: 'POST',
      body: JSON.stringify({ grid }),
    }),

  crosswordGiveUp: () =>
    request<any>('/game/crossword/give-up', { method: 'POST' }),

  devComplete: (puzzle_type: string) =>
    request<any>('/game/dev-complete', {
      method: 'POST',
      body: JSON.stringify({ puzzle_type }),
    }),

  // Leaderboard
  getLeaderboard: (date: string) => request<any>(`/leaderboard/${date}`),

  // Admin
  adminLogin: (password: string) =>
    request<any>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  adminGetPuzzle: (date: string) =>
    request<any>(`/admin/puzzle/${date}`, {
      headers: { 'X-Admin-Key': getAdminKey() || '' },
    }),

  adminSavePuzzle: (data: any) =>
    request<any>('/admin/puzzle', {
      method: 'POST',
      headers: { 'X-Admin-Key': getAdminKey() || '' },
      body: JSON.stringify(data),
    }),
};
