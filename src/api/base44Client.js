/**
 * base44Client — Base44 SDK compatibility shim (Phase 5 of the NestJS migration).
 *
 * Historically the entire frontend (~130 files) called `base44.entities.X.*`,
 * `base44.auth.*`, `base44.functions.invoke(...)` and `base44.integrations.Core.*`
 * directly against the Base44 backend-as-a-service SDK.
 *
 * Instead of rewriting every call site, this module re-implements the same
 * `base44` surface on top of the new NestJS REST API (via `httpClient`), so
 * all existing call sites keep working unchanged. See
 * `docs/NESTJS_MIGRATION_PLAN.md` §6 "Compatibility Shim Strategy".
 */
import { httpClient } from '@/api/client/httpClient';
import { tokenStorage } from '@/api/client/tokenStorage';

// ─────────────────────────────────────────────────────────────────────────
// Entity → REST endpoint configuration
//
// Most entities map 1:1 to a top-level REST resource (`base`). A handful are
// nested sub-resources of another entity (e.g. CandidateNote lives under
// `/candidates/:id/notes`) — for those, `nestedParent` names the field in the
// filter/create payload that identifies the parent, and `nestedPath` builds
// the URL. `flatBase` (when present) is used for get/update/delete by the
// sub-resource's own id (e.g. `/candidates/notes/:noteId`).
// ─────────────────────────────────────────────────────────────────────────
const ENTITY_CONFIG = {
  User: { base: '/users' },
  Organization: { base: '/organizations' },
  Candidate: { base: '/candidates' },
  Job: { base: '/jobs' },
  Application: { base: '/applications' },
  Interview: { base: '/interviews' },
  Message: { base: '/messages' },
  Notification: { base: '/notifications' },
  Company: { base: '/companies' },

  CandidateProfile: { base: '/candidates/profiles' },
  CandidateImportBatch: { base: '/candidates/import-batches' },
  CandidateAccess: { base: '/candidates/access' },

  CandidateNote: {
    nestedParent: 'candidate_id',
    nestedPath: (id) => `/candidates/${id}/notes`,
    flatBase: '/candidates/notes',
  },
  CandidateTag: {
    nestedParent: 'candidate_id',
    nestedPath: (id) => `/candidates/${id}/tags`,
    flatBase: '/candidates/tags',
  },
  CandidateTimeline: {
    nestedParent: 'candidate_id',
    nestedPath: (id) => `/candidates/${id}/timeline`,
  },
  CandidateDocument: {
    nestedParent: 'candidate_id',
    nestedPath: (id) => `/candidates/${id}/documents`,
  },

  ApplicationTimeline: {
    nestedParent: 'application_id',
    nestedPath: (id) => `/applications/${id}/timeline`,
  },
  ApplicationPipeline: {
    nestedParent: 'employer_id',
    nestedPath: (id) => `/applications/pipeline/${id}`,
    flatBase: '/applications/pipeline',
  },

  CompanyReview: {
    nestedParent: 'company_id',
    nestedPath: (id) => `/companies/${id}/reviews`,
  },
  Staff: { base: '/staff' },

  CompensationPlan: { base: '/compensation-plans' },
  CommunicationLog: { base: '/communication-logs' },
  EmployerTimeline: { base: '/employer-timeline' },
  AuditLog: { base: '/audit-logs' },
  ImportSource: { base: '/import-sources' },
  JobAlert: { base: '/jobs/alerts' },
  SavedJob: { base: '/jobs/saved' },

  Domain: { base: '/taxonomy/domains' },
  Role: { base: '/taxonomy/roles' },
  Specialization: { base: '/taxonomy/specializations' },
  WorkMode: { base: '/taxonomy/work-modes' },
  EmploymentType: { base: '/taxonomy/employment-types' },
  ExperienceLevel: { base: '/taxonomy/experience-levels' },
  RoleAlias: { base: '/role-aliases' },
  RoleTemplate: { base: '/role-templates' },

  PermissionMatrix: { base: '/permission-matrices' },
  Position: { base: '/positions' },
  UserPositionAccess: { base: '/user-position-access' },
  SalaryData: { base: '/salary-data' },
};

function defaultConfig(name) {
  // Fallback for any entity not explicitly mapped above.
  const kebab = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  console.warn(`[base44Client] No explicit REST mapping for entity "${name}" — guessing "/${kebab}s"`);
  return { base: `/${kebab}s` };
}

function buildQueryString(conditions = {}, sort, limit) {
  const params = new URLSearchParams();
  Object.entries(conditions || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.append(key, Array.isArray(value) ? value.join(',') : String(value));
  });
  if (sort) {
    const desc = sort.startsWith('-');
    params.append('sort', desc ? sort.slice(1) : sort);
    params.append('order', desc ? 'DESC' : 'ASC');
  }
  if (limit) params.append('limit', String(limit));
  return params.toString();
}

function makeEntityAPI(name, cfg) {
  function resolveListPath(conditions) {
    if (cfg.nestedParent) {
      const parentId = conditions?.[cfg.nestedParent];
      if (parentId) return cfg.nestedPath(parentId);
      if (cfg.flatBase) return cfg.flatBase;
      throw new Error(`${name}.filter(): missing required "${cfg.nestedParent}" in conditions`);
    }
    return cfg.base;
  }

  function resolveItemBase(conditions) {
    if (cfg.flatBase) return cfg.flatBase;
    if (cfg.nestedParent) {
      const parentId = conditions?.[cfg.nestedParent];
      if (parentId) return cfg.nestedPath(parentId);
    }
    return cfg.base;
  }

  const api = {
    async list(sort, limit) {
      return api.filter({}, sort, limit);
    },

    async filter(conditions = {}, sort, limit) {
      // Special-case `.filter({ id })` (a common Base44 idiom for "get by id
      // wrapped in an array"). Most of our list-query DTOs don't accept an
      // arbitrary `id` query param (Zod strips unknown keys), so routing
      // this through the list endpoint would silently ignore the filter and
      // return unrelated rows. Route it through the direct GET /:id instead.
      if (conditions?.id && !cfg.nestedParent) {
        try {
          const item = await api.get(conditions.id);
          return item ? [item] : [];
        } catch (e) {
          if (e?.status === 404 || e?.response?.status === 404) return [];
          throw e;
        }
      }

      const path = resolveListPath(conditions);
      const rest = { ...conditions };
      if (cfg.nestedParent) delete rest[cfg.nestedParent];
      const qs = buildQueryString(rest, sort, limit);
      const result = await httpClient.get(`${path}${qs ? `?${qs}` : ''}`, { cache: false });
      return Array.isArray(result) ? result : (result?.items || result?.data || []);
    },

    async get(id) {
      const base = cfg.flatBase || cfg.base;
      if (!base) throw new Error(`${name}.get(): not supported for this entity`);
      return httpClient.get(`${base}/${id}`, { cache: false });
    },

    async create(data = {}) {
      if (cfg.nestedParent) {
        const parentId = data[cfg.nestedParent];
        if (!parentId) throw new Error(`${name}.create(): missing required "${cfg.nestedParent}"`);
        const rest = { ...data };
        delete rest[cfg.nestedParent];
        return httpClient.post(cfg.nestedPath(parentId), rest);
      }
      return httpClient.post(cfg.base, data);
    },

    async update(id, data = {}) {
      const base = resolveItemBase(data);
      return httpClient.patch(`${base}/${id}`, data);
    },

    async delete(id) {
      const base = cfg.flatBase || cfg.base;
      if (!base) throw new Error(`${name}.delete(): not supported for this entity`);
      return httpClient.delete(`${base}/${id}`);
    },

    /**
     * Base44 real-time subscription shim. The REST backend has no
     * websocket/SSE push channel yet, so we emulate it with polling and
     * diff the result set against the previous poll, emitting one
     * `{ type: 'create' | 'update' | 'delete', data, id }` event per
     * changed row — matching Base44's real-time event shape so existing
     * `.subscribe(callback)` consumers work unchanged.
     */
    subscribe(callback, conditions = {}, { intervalMs = 15000, sort = '-created_date', limit = 100 } = {}) {
      let stopped = false;
      let known = new Map();
      let firstRun = true;

      const poll = async () => {
        if (stopped) return;
        try {
          const items = await api.filter(conditions, sort, limit);
          const next = new Map((items || []).map((item) => [item.id, item]));

          if (firstRun) {
            // Seed the baseline silently — don't fire "create" for existing rows.
            known = next;
            firstRun = false;
            return;
          }

          for (const [id, item] of next) {
            const prev = known.get(id);
            if (!prev) callback({ type: 'create', data: item, id });
            else if (JSON.stringify(prev) !== JSON.stringify(item)) callback({ type: 'update', data: item, id });
          }
          for (const [id, item] of known) {
            if (!next.has(id)) callback({ type: 'delete', data: item, id });
          }
          known = next;
        } catch (_) {
          // ignore transient polling errors
        }
      };
      poll();
      const handle = setInterval(poll, intervalMs);
      return () => {
        stopped = true;
        clearInterval(handle);
      };
    },
  };

  return api;
}

const entityCache = new Map();

const entities = new Proxy(
  {},
  {
    get(_target, entityName) {
      if (typeof entityName !== 'string') return undefined;
      if (!entityCache.has(entityName)) {
        const cfg = ENTITY_CONFIG[entityName] || defaultConfig(entityName);
        entityCache.set(entityName, makeEntityAPI(entityName, cfg));
      }
      return entityCache.get(entityName);
    },
  }
);

// ─────────────────────────────────────────────────────────────────────────
// Auth — maps to the NestJS JWT auth endpoints (see backend/src/auth)
// ─────────────────────────────────────────────────────────────────────────
const auth = {
  async me() {
    return httpClient.get('/auth/me', { cache: false });
  },

  async loginViaEmailPassword(email, password) {
    const res = await httpClient.post('/auth/login', { email, password });
    tokenStorage.setTokens(res.access_token, res.refresh_token);
    return res.user;
  },

  async register(data) {
    const res = await httpClient.post('/auth/register', data);
    tokenStorage.setTokens(res.access_token, res.refresh_token);
    return res.user;
  },

  async updateMe(data) {
    return httpClient.patch('/auth/me', data);
  },

  async logout(redirectUrl) {
    try {
      await httpClient.post('/auth/logout');
    } catch (_) {
      // best-effort — proceed to clear local tokens regardless
    }
    tokenStorage.clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = typeof redirectUrl === 'string' ? redirectUrl : '/login';
    }
  },

  async resetPasswordRequest(email) {
    return httpClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(a, b) {
    const isObj = a && typeof a === 'object';
    const token = isObj ? (a.resetToken || a.token) : a;
    const password = isObj ? (a.newPassword || a.password) : b;
    return httpClient.post('/auth/reset-password', { token, password });
  },

  setToken(token) {
    tokenStorage.setAccessToken(token);
  },

  redirectToLogin() {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  // Not implemented by the NestJS backend yet (kept as clear, safe no-ops).
  loginWithProvider() {
    throw new Error('Social login is not available yet — please use email/password.');
  },
  async verifyOtp() {
    throw new Error('OTP verification is no longer required — registration completes immediately.');
  },
  async resendOtp() {
    throw new Error('OTP verification is no longer required — registration completes immediately.');
  },
};

// ─────────────────────────────────────────────────────────────────────────
// Functions — maps `functions.invoke(name, params)` → `POST /functions/:name`
// ─────────────────────────────────────────────────────────────────────────
const functions = new Proxy(
  {
    async invoke(name, params) {
      return httpClient.post(`/functions/${name}`, params);
    },
  },
  {
    get(target, prop) {
      if (prop in target) return target[prop];
      // Support the rarer `functions.someName.invoke(params)` call shape.
      return { invoke: (params) => httpClient.post(`/functions/${String(prop)}`, params) };
    },
  }
);

// ─────────────────────────────────────────────────────────────────────────
// Integrations — file upload / email / LLM (see backend integrations module)
// ─────────────────────────────────────────────────────────────────────────
const integrations = {
  Core: {
    async UploadFile({ file }) {
      const formData = new FormData();
      formData.append('file', file);
      return httpClient.post('/integrations/upload', formData);
    },
    async SendEmail(data) {
      return httpClient.post('/integrations/send-email', data);
    },
    async InvokeLLM(data) {
      return httpClient.post('/integrations/invoke-llm', data);
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────
// asServiceRole — Base44's "elevated/service" context. The NestJS backend
// has no separate service-role concept: admin-only routes are protected by
// JWT + RolesGuard instead, so this is a plain alias to `entities`/`functions`
// (calls still succeed as long as the current user has the required role).
// ─────────────────────────────────────────────────────────────────────────
const asServiceRole = {
  entities,
  functions,
  integrations,
};

export const base44 = {
  entities,
  auth,
  functions,
  integrations,
  asServiceRole,
};
