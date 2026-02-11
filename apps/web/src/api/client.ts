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
  return sessionStorage.getItem('ctg_admin_token');
}

export function setAdminKey(key: string) {
  sessionStorage.setItem('ctg_admin_token', key);
}

export function clearAdminKey() {
  sessionStorage.removeItem('ctg_admin_token');
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
    if (res.status === 401 && path.startsWith('/admin')) {
      clearAdminKey();
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

  connectionsReorder: (words: string[]) =>
    request<any>('/game/connections/reorder', {
      method: 'POST',
      body: JSON.stringify({ words }),
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
  getLeaderboard: () => request<any>('/leaderboard'),

  // Admin - Lock
  adminLogin: (password: string) =>
    request<any>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  adminGetLock: () =>
    request<any>('/admin/lock', {
      headers: { 'X-Admin-Key': `Bearer ${getAdminKey() || ''}` },
    }),

  adminSetLock: (locked: boolean) =>
    request<any>('/admin/lock', {
      method: 'POST',
      headers: { 'X-Admin-Key': `Bearer ${getAdminKey() || ''}` },
      body: JSON.stringify({ locked }),
    }),

  // Admin - Current Puzzle
  adminGetCurrentPuzzle: () =>
    request<any>('/admin/current-puzzle', {
      headers: { 'X-Admin-Key': `Bearer ${getAdminKey() || ''}` },
    }),

  adminSetConnections: (connections_data: any) =>
    request<any>('/admin/current-puzzle/connections', {
      method: 'POST',
      headers: { 'X-Admin-Key': `Bearer ${getAdminKey() || ''}` },
      body: JSON.stringify({ connections_data }),
    }),

  adminSetCrossword: (crossword_data: any) =>
    request<any>('/admin/current-puzzle/crossword', {
      method: 'POST',
      headers: { 'X-Admin-Key': `Bearer ${getAdminKey() || ''}` },
      body: JSON.stringify({ crossword_data }),
    }),

  // Admin - Players
  adminGetPlayers: () =>
    request<any>('/admin/players', {
      headers: { 'X-Admin-Key': `Bearer ${getAdminKey() || ''}` },
    }),

  // Admin - Archives
  adminArchive: () =>
    request<any>('/admin/archive', {
      method: 'POST',
      headers: { 'X-Admin-Key': `Bearer ${getAdminKey() || ''}` },
    }),

  adminGetArchives: () =>
    request<any>('/admin/archives', {
      headers: { 'X-Admin-Key': `Bearer ${getAdminKey() || ''}` },
    }),

  adminGetArchive: (archiveId: string) =>
    request<any>(`/admin/archives/${archiveId}`, {
      headers: { 'X-Admin-Key': `Bearer ${getAdminKey() || ''}` },
    }),
};
