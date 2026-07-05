/**
 * Minimal Base44 REST API client used solely for the one-off data migration
 * (see `migrate-from-base44.ts`). Deliberately dependency-free (uses the
 * global `fetch`, available in Node 18+) so this script has no impact on the
 * running application's dependency graph.
 *
 * Reverse-engineered from `@base44/sdk` (`dist/client.js`, `dist/modules/auth.js`,
 * `dist/modules/entities.js`) which the project depended on before the NestJS
 * migration:
 *   - Base URL:  {serverUrl}/api  (serverUrl defaults to https://base44.app)
 *   - Login:     POST /apps/{appId}/auth/login       { email, password } -> { access_token, user }
 *   - List:      GET  /apps/{appId}/entities/{Name}?sort=&limit=&skip=
 */

export interface Base44ClientOptions {
  serverUrl: string;
  appId: string;
  /** Service/integration API key (sent as the `api_key` header) — bypasses user login entirely. */
  apiKey?: string;
  /** Use an existing access token instead of logging in with email/password. */
  accessToken?: string;
  email?: string;
  password?: string;
}

export class Base44ApiClient {
  private baseURL: string;
  private appId: string;
  private token: string | null;
  private apiKey?: string;
  private email?: string;
  private password?: string;

  constructor(opts: Base44ClientOptions) {
    this.baseURL = `${opts.serverUrl.replace(/\/$/, '')}/api`;
    this.appId = opts.appId;
    this.token = opts.accessToken ?? null;
    this.apiKey = opts.apiKey;
    this.email = opts.email;
    this.password = opts.password;
  }

  /** Authenticates via API key (preferred), an existing token, or email/password login. */
  async authenticate(): Promise<void> {
    if (this.apiKey) {
      console.log('✅ Using Base44 service API key (no user login required)');
      return;
    }
    if (this.token) return;
    if (!this.email || !this.password) {
      throw new Error(
        'Base44 authentication required: set BASE44_API_KEY, BASE44_ACCESS_TOKEN, or BASE44_EMAIL + BASE44_PASSWORD in backend/.env',
      );
    }
    const res = await this.rawFetch(`/apps/${this.appId}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: this.email, password: this.password }),
    });
    if (!res.access_token) {
      throw new Error(`Base44 login did not return an access_token: ${JSON.stringify(res)}`);
    }
    this.token = res.access_token;
    console.log(`✅ Authenticated with Base44 as ${this.email} (user role: ${res.user?.role ?? 'unknown'})`);
  }

  /** Fetches ALL records for an entity, transparently paginating. */
  async listAll(entityName: string, pageSize = 200): Promise<any[]> {
    const all: any[] = [];
    let skip = 0;
    // Safety cap to avoid infinite loops against a misbehaving API
    for (let page = 0; page < 5000; page++) {
      const batch = await this.list(entityName, { limit: pageSize, skip });
      all.push(...batch);
      if (batch.length < pageSize) break;
      skip += pageSize;
    }
    return all;
  }

  private async list(
    entityName: string,
    params: { sort?: string; limit?: number; skip?: number },
  ): Promise<any[]> {
    const qs = new URLSearchParams();
    if (params.sort) qs.set('sort', params.sort);
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.skip) qs.set('skip', String(params.skip));
    const path = `/apps/${this.appId}/entities/${entityName}${qs.toString() ? `?${qs}` : ''}`;
    const res = await this.rawFetch(path, { method: 'GET' });
    // Base44 returns a plain array for list endpoints; be defensive in case
    // of an envelope shape ({ data: [...] }).
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.items)) return res.items;
    throw new Error(`Unexpected list() response shape for ${entityName}: ${JSON.stringify(res).slice(0, 300)}`);
  }

  private async rawFetch(path: string, init: { method: string; body?: string }, attempt = 1): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-App-Id': this.appId,
    };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    if (this.apiKey) headers['api_key'] = this.apiKey;

    const res = await fetch(`${this.baseURL}${path}`, { method: init.method, headers, body: init.body });

    if (res.status === 429 || res.status >= 500) {
      if (attempt <= 4) {
        const backoffMs = attempt * 1500;
        console.warn(`⚠️  ${res.status} from Base44 (${path}), retrying in ${backoffMs}ms (attempt ${attempt}/4)...`);
        await new Promise((r) => setTimeout(r, backoffMs));
        return this.rawFetch(path, init, attempt + 1);
      }
    }

    const text = await res.text();
    let json: any;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { raw: text };
    }
    if (!res.ok) {
      throw new Error(`Base44 API error ${res.status} on ${path}: ${JSON.stringify(json).slice(0, 500)}`);
    }
    return json;
  }
}

