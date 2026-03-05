/**
 * lib/api.ts — Centralised API client
 *
 * All backend calls go through apiFetch(). It:
 *   1. Reads the JWT from localStorage and attaches it as Authorization header
 *   2. Throws a typed ApiError if the response is not 2xx
 *
 * WHY centralise this:
 *   Every endpoint needs the same Authorization header. If you write fetch()
 *   calls directly in components, you'll forget the header somewhere, or
 *   handle errors inconsistently. One function, one place to fix things.
 *
 * WHY localStorage for the token:
 *   The alternative is httpOnly cookies (more secure, but needs backend changes
 *   to set Set-Cookie headers). localStorage is simpler for this stage and fine
 *   for a demo/portfolio project. In production fintech you'd use httpOnly cookies.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3010/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any,
  ) {
    super(message);
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  // Read token from localStorage — this only runs in the browser.
  // Server components can't call this (they have no localStorage),
  // which is why all our data-fetching components will be client components.
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('sentry_token')
    : null;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // Attach the token if we have one. This is the Bearer token pattern
      // your JwtAuthGuard expects: "Authorization: Bearer <token>"
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Parse the body regardless of status — NestJS error responses
  // have a JSON body with { message, statusCode } that we want to surface.
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message ?? `Request failed with status ${response.status}`;
    // Log to console so you can trace exactly which call failed
    console.warn(`[API ${response.status}] ${options?.method ?? 'GET'} ${path} —`, message);
    throw new ApiError(response.status, message, data);
  }

  return data as T;
}

// ── Auth endpoints ────────────────────────────────────────────────────────────

export interface LoginResponse {
  access_token: string;
  userId: string;
  email: string;
  name: string;
}

export interface MeResponse {
  userId: string;
  email: string;
  name: string;
  department: string | null;
  mfaVerified: boolean;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => apiFetch<MeResponse>('/auth/me'),
};

// ── Access Request endpoints ──────────────────────────────────────────────────

export type AccessRequestStatus = 'pending' | 'approved' | 'rejected' | 'revoked';

export interface AccessRequest {
  _id: string;
  requesterId: string;
  requesterEmail: string;
  resource: string;
  justification: string;
  requestedDuration: string;
  status: AccessRequestStatus;
  reviewerId: string | null;
  reviewerEmail: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  requesterIp: string;
  createdAt: string;
  updatedAt: string;
}

export const accessRequestsApi = {
  // Submit a new request — requires access:request permission
  create: (data: { resource: string; justification: string; requestedDuration: string }) =>
    apiFetch<AccessRequest>('/access-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // All requests — requires access:read (approver/admin)
  getAll: (status?: AccessRequestStatus) =>
    apiFetch<AccessRequest[]>(`/access-requests${status ? `?status=${status}` : ''}`),

  // Current user's own requests — requires access:request
  getMine: () => apiFetch<AccessRequest[]>('/access-requests/mine'),

  // Approve — requires access:approve (ABAC: MFA + weekday + session age)
  approve: (id: string, reviewNote?: string) =>
    apiFetch<AccessRequest>(`/access-requests/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ reviewNote }),
    }),

  // Reject — requires access:approve
  reject: (id: string, reviewNote: string) =>
    apiFetch<AccessRequest>(`/access-requests/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reviewNote }),
    }),

  // Revoke — requires access:revoke (ABAC: MFA only, any time)
  revoke: (id: string, reviewNote: string) =>
    apiFetch<AccessRequest>(`/access-requests/${id}/revoke`, {
      method: 'PATCH',
      body: JSON.stringify({ reviewNote }),
    }),
};

// ── User endpoints ────────────────────────────────────────────────────────────

export interface User {
  _id: string;
  email: string;
  name: string;
  department: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
}

export const usersApi = {
  getAll: () => apiFetch<User[]>('/users'),
  update: (id: string, data: Partial<{ name: string; department: string; isActive: boolean }>) =>
    apiFetch<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// ── Roles endpoints ───────────────────────────────────────────────────────────

export interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
  isActive: boolean;
}

export interface UserRole {
  userId: string;
  roles: Role[];
}

export const rolesApi = {
  getAll: () => apiFetch<Role[]>('/roles'),

  assignRole: (userId: string, roleId: string, assignedBy = 'admin') =>
    apiFetch('/user-roles/assign', {
      method: 'POST',
      body: JSON.stringify({ userId, roleId, assignedBy }),
    }),

  removeRole: (userId: string, roleId: string) =>
    apiFetch(`/user-roles/${userId}/${roleId}`, { method: 'DELETE' }),

  getUserRoles: (userId: string) =>
    apiFetch<Role[]>(`/user-roles/user/${userId}/roles`),
};

// ── Audit endpoints ───────────────────────────────────────────────────────────

export interface AuditLog {
  _id: string;
  userId: string;
  userEmail: string;
  userDepartment?: string;
  action: string;
  permission: string;
  granted: boolean;
  reason: string;
  evaluatedRules: string[];
  ipAddress: string;
  resourceType?: string;
  resourceId?: string;
  isSuspicious: boolean;
  suspiciousReason?: string;
  hasMFA: boolean;
  sessionAge?: number;
  timestamp: string;
}

export const auditApi = {
  getRecent:    ()             => apiFetch<AuditLog[]>('/audit/recent'),
  getSuspicious: ()            => apiFetch<AuditLog[]>('/audit/suspicious'),
  getUserLogs:  (userId: string) => apiFetch<AuditLog[]>(`/audit/user/${userId}`),
};