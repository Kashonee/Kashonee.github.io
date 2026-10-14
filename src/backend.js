import { defaults } from './config.js';

const settings = { ...defaults };
let credentials = null;
const STORE = 'murager-admin-session';
const cleanUrl = value => String(value || '').replace(/\/+$/, '');
const encodePath = path => String(path).split('/').map(encodeURIComponent).join('/');

export async function initializeBackend() {
  try {
    const response = await fetch('/config.local.json', { cache: 'no-store' });
    if (response.ok) Object.assign(settings, await response.json());
  } catch { /* local demonstration mode */ }
  settings.url = cleanUrl(settings.url);
  try { credentials = JSON.parse(sessionStorage.getItem(STORE) || 'null'); } catch { credentials = null; }
  return Boolean(settings.url && settings.publishableKey);
}
export const isConfigured = () => Boolean(settings.url && settings.publishableKey);
export const isAuthenticated = () => Boolean(credentials?.access_token);

async function ensureToken() {
  if (!credentials) return null;
  if (credentials.expires_at > Date.now() / 1000 + 90) return credentials.access_token;
  const res = await fetch(`${settings.url}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST', headers: { apikey: settings.publishableKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: credentials.refresh_token }),
  });
  if (!res.ok) { credentials = null; sessionStorage.removeItem(STORE); return null; }
  const data = await res.json();
  credentials = { ...data, expires_at: Date.now() / 1000 + data.expires_in };
  sessionStorage.setItem(STORE, JSON.stringify(credentials));
  return credentials.access_token;
}

export async function request(path, { method = 'GET', body, auth = false, headers = {} } = {}) {
  if (!isConfigured()) throw new Error('Дерекқор әлі қосылмаған.');
  const token = auth ? await ensureToken() : null;
  if (auth && !token) throw new Error('Сеанс аяқталды. Қайта кіріңіз.');
  const res = await fetch(`${settings.url}${path}`, {
    method, headers: {
      apikey: settings.publishableKey,
      Authorization: `Bearer ${token || settings.publishableKey}`,
      ...(body instanceof File ? {} : body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: body instanceof File ? body : JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error_description || err.error || `Сұрау қатесі: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json().catch(() => null);
}

export async function signIn(email, password) {
  const data = await request('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } });
  credentials = { ...data, expires_at: Date.now() / 1000 + data.expires_in };
  sessionStorage.setItem(STORE, JSON.stringify(credentials));
  // A valid Auth user is not necessarily an administrator. The RLS-filtered
  // view returns zero rows for anyone outside museum_admins.
  let administrators;
  try { administrators = await request('/rest/v1/museum_admins?select=user_id&limit=1', { auth: true }); }
  catch (error) { await signOut(); throw error; }
  if (!administrators?.length) { await signOut(); throw new Error('Бұл тіркелгіге музейді басқару құқығы берілмеген.'); }
}
export async function signOut() {
  if (credentials) await request('/auth/v1/logout', { method: 'POST', auth: true }).catch(() => {});
  credentials = null; sessionStorage.removeItem(STORE);
}

export async function getMuseum(admin = false) {
  const suffix = admin ? '' : '&published=eq.true';
  const [config, scenes, exhibits] = await Promise.all([
    request('/rest/v1/museum_config?select=*&id=eq.1'),
    request(`/rest/v1/scenes?select=*&order=sort_order.asc${suffix}`, { auth: admin }),
    request(`/rest/v1/exhibits?select=*&order=sort_order.asc${suffix}`, { auth: admin }),
  ]);
  return { config: config?.[0], scenes: scenes || [], exhibits: exhibits || [] };
}
export async function saveRecord(table, data, id = null) {
  const path = `/rest/v1/${table}${id !== null ? `?id=eq.${encodeURIComponent(id)}` : ''}`;
  const method = id !== null ? 'PATCH' : 'POST';
  const saved = await request(path, { method, body: data, auth: true, headers: { Prefer: 'return=representation' } });
  return saved?.[0];
}
export async function saveConfig(data) {
  return request('/rest/v1/museum_config?id=eq.1', { method: 'PATCH', body: data, auth: true, headers: { Prefer: 'return=representation' } });
}
export async function removeExhibit(id) { return request(`/rest/v1/exhibits?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }); }

export async function upload(file, group) {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-90) || 'file';
  const path = `${group}/${crypto.randomUUID()}/${safe}`;
  const result = await request(`/storage/v1/object/museum-media/${encodePath(path)}`, {
    method: 'POST', body: file, auth: true, headers: { 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'false' },
  });
  if (!result) throw new Error('Файлды сақтау мүмкін болмады.');
  return path;
}
export async function removeFile(path) {
  return request('/storage/v1/object/museum-media', { method: 'DELETE', body: { prefixes: [path] }, auth: true });
}
export async function fileUrl(path, admin = false) {
  if (!path) return null;
  if (path.startsWith('/')) return path; // bundled sample panorama
  if (/^https:\/\//.test(path)) return path;
  const data = await request(`/storage/v1/object/sign/museum-media/${encodePath(path)}`, {
    method: 'POST', body: { expiresIn: 3600 }, auth: admin,
  });
  return `${settings.url}/storage/v1${data.signedURL}`;
}
