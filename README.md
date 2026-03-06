# 🔐 Privileged Access Management System

<div align="center">

**Production-grade RBAC + ABAC engine with JWT auth, async audit logging, and a context-aware permission evaluator.**

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)


</div>

---

## What This Is

Most "RBAC" tutorials attach a role to a user and call it done.

This project goes several layers deeper.

This is a **Privileged Access Management** system — the kind enterprises use to control who accesses sensitive resources, under what conditions, with a full audit trail of every decision. It answers three questions on every single request:

> **Who are you?** → JWT authentication
> **What are you allowed to do?** → Role-based permissions
> **Is right now an acceptable time to do it?** → Context/attribute rules

Every permission check runs through a rules engine evaluating business-hour constraints, IP whitelisting, MFA verification, and session age. The decision is logged asynchronously via BullMQ so it never touches request latency.

---

## Live Demo

| Service | URL |
|---------|-----|
| Live Website | https://privileged-access-management-rbac-a-delta.vercel.app/login |

### Demo Accounts

| Role | Email | Password | Access Level |
|------|-------|----------|-------------|
| Super Admin | admin@sentry.dev | Admin@1234 | Full system — users, roles, permissions, audit logs |
| Manager | alice.manager@sentry.dev | Manager@1234 | View users, approve/reject access requests, audit logs |
| Security Analyst | bob.analyst@sentry.dev | Analyst@1234 | View users, read audit logs, suspicious activity |
| Employee | carol.employee@sentry.dev | Employee@1234 | Submit requests, view own request history |
| Employee | dave.employee@sentry.dev | Employee@1234 | Same as Carol |

> Login as each user and watch the UI adapt in real time based on live permission data — no reload, no code change needed.

> Approving access requests requires `mfaVerified: true`. Admin and manager accounts have this set.

---

## System Architecture

```
                     +---------------------------------------+
                     |           Sentry UI                   |
                     |   Next.js 16  .  Vercel               |
                     |                                       |
                     |  +------------+  +----------------+   |
                     |  | Auth       |  | Dashboard      |   |
                     |  | Context    |  | Access Req.    |   |
                     |  | (JWT +     |  | Audit Logs     |   |
                     |  |  perms)    |  | User Mgmt      |   |
                     |  +------------+  +----------------+   |
                     +------------------+--------------------+
                                        |
                           Bearer JWT + REST calls
                                        |
                                        v
+------------------------------------------------------------------------+
|                           rbac-service                                 |
|                    NestJS . TypeScript . Railway                       |
|                                                                        |
|  +----------------------+        +--------------------------------+    |
|  |    Auth Module       |        |         RBAC Module            |    |
|  |                      |        |                                |    |
|  |  POST /auth/login    |        |  Roles . Permissions           |    |
|  |  POST /auth/register |        |  User-Roles . Assignment       |    |
|  |  GET  /auth/me       |        |  Access Requests               |    |
|  |                      |        |  Bonus (ABAC demo endpoint)    |    |
|  |  JwtAuthGuard -------+------->|  PermissionsGuard              |    |
|  |  Passport.js         |        |                                |    |
|  +----------------------+        +----------------+---------------+    |
|                                                   |                    |
|                                  +----------------v---------------+    |
|                                  |      Context Evaluator         |    |
|                                  |                                |    |
|                                  |  [x] Business hours check      |    |
|                                  |  [x] IP whitelist/blacklist    |    |
|                                  |  [x] MFA verified gate         |    |
|                                  |  [x] Session age limit         |    |
|                                  |                                |    |
|                                  |  --> GRANT or DENY             |    |
|                                  +----------------+---------------+    |
|                                                   |                    |
|                    +------------------------------v--------------+     |
|                    |           Audit Pipeline                    |     |
|                    |                                             |     |
|                    |  Decision --> BullMQ Queue --> Processor    |     |
|                    |                                   |         |     |
|                    |             Suspicious Activity   |         |     |
|                    |             Detection Service <---+         |     |
|                    +---------------------------------------------+     |
+-----------------------------------+------------------+-----------------+
                                    |                  |
                                    v                  v
                          +-----------------+  +--------------------+
                          |  MongoDB Atlas  |  |  Upstash Redis     |
                          |                 |  |                    |
                          |  users          |  |  Permission cache  |
                          |  roles          |  |  Role-user index   |
                          |  permissions    |  |  BullMQ queues     |
                          |  user_roles     |  |                    |
                          |  audit_logs     |  |  TTL: 5 min        |
                          |  access_reqs    |  |  TLS (rediss://)   |
                          +-----------------+  +--------------------+
```

---

## Permission Decision Flow

Every protected request goes through this exact sequence:

```
  Incoming Request
        |
        v
  +--------------------+
  |   JwtAuthGuard     |  Validate Bearer token
  |                    |  Decode userId + email
  +--------+-----------+
           | req.user populated
           v
  +--------------------+
  | PermissionsGuard   |  Read @RequirePermissions() metadata
  |                    |  from route decorator
  +--------+-----------+
           |
           v
  +--------------------+   Cache HIT   +---------------------+
  |   Redis Cache      | ------------> | Return cached       |
  |   user:{id}:perms  |               | permissions []      |
  +--------+-----------+               +----------+----------+
           | Cache MISS                           |
           v                                      |
  +--------------------+                          |
  |   MongoDB Lookup   |  Fetch user-roles        |
  |   user_roles +     |  Flatten all perms       |
  |   roles collection |  from all assigned roles |
  +--------+-----------+                          |
           |                                      |
           v                                      |
  +--------------------+                          |
  |   Cache SET        |  Write to Redis          |
  |   TTL: 300s        |  5-minute window         |
  +--------+-----------+                          |
           |                                      |
           v <------------------------------------+
  +--------------------+
  |  Wildcard Check    |  Does permissions[] include '*:*' ?
  |                    |  Yes --> GRANT immediately
  +--------+-----------+
           | No wildcard
           v
  +--------------------+
  |  Permission Check  |  Does permissions[] include
  |                    |  the required string?
  +--------+-----------+
           |
      +----+----+
      |         |
    DENY      GRANT
      |         |
      v         v
  +-------+  +------------------------+
  |  403  |  |   Context Evaluator    |  ABAC layer
  +-------+  |                        |
             |  business hours?  [x]  |
             |  IP allowed?      [x]  |
             |  MFA verified?    [x]  |
             |  session fresh?   [x]  |
             +----------+-------------+
                        |
                 +------+------+
                 |             |
               DENY          GRANT
                 |             |
                 v             v
             +------+    +----------+
             |  403 |    |  200 OK  |
             +------+    +----------+
                   |          |
                   +----+-----+
                        |
                        v
              +------------------+
              |   BullMQ Queue   |  Async -- never blocks response
              |   Audit entry    |
              |   isSuspicious?  |
              +------------------+
```

---

## Redis Cache Architecture

The cache layer is the most subtle engineering in this system:

```
  +--------------------------------------------------------------+
  |                    Redis Key Layout                          |
  |                                                              |
  |   user:{userId}:permissions  -->  ["roles:read","audit:read"]|
  |   role:{roleId}:users        -->  ["userId1","userId2"]      |
  |                                                              |
  +--------------------------------------------------------------+

  PROBLEM: Admin changes permissions on the "manager" role.
           Two affected users are holding that role.
           How do we invalidate their cached permissions?

  ---------------------------------------------------------------

  NAIVE approach (no reverse index):

  Role updated in MongoDB
       |
       v
  "Who holds this role?" --> Full DB scan  (expensive)
                         --> OR wait 5 min TTL (stale permissions)

  ---------------------------------------------------------------

  THIS IMPLEMENTATION (reverse index):

  Role updated in MongoDB
       |
       v
  READ role:{roleId}:users  -->  ["alice_id", "bob_id"]
       |
       v
  DEL user:alice_id:permissions  --+
  DEL user:bob_id:permissions    --+  Promise.all() parallel
       |
       v
  Next request from Alice/Bob:
    cache miss --> DB fetch --> fresh permissions --> cache SET

  Result: ZERO stale permission windows on role change

  ---------------------------------------------------------------

  Index is maintained on every assignment operation:

  assignRole(userId, roleId)
    |-- MongoDB: create user_role doc
    |-- Redis: DEL user:{userId}:permissions   (bust old cache)
    +-- Redis: PUSH userId to role:{roleId}:users  (update index)

  removeRole(userId, roleId)
    |-- MongoDB: delete user_role doc
    |-- Redis: DEL user:{userId}:permissions
    +-- Redis: FILTER userId out of role:{roleId}:users
```

---

## Async Audit Pipeline

```
  HTTP Request  (any protected route)
        |
        v
  +----------------------------------------------------------+
  |                      Request Path                        |
  |                                                          |
  |  Guard decision -----------------------------> Response  |
  |       |                                                  |
  |       | Fire and forget                                  |
  |       v                                                  |
  |  queueService.addAuditJob({                              |
  |    userId, action, permission,                           |
  |    granted, reason, ipAddress,                           |
  |    hasMFA, sessionAge, ...                               |
  |  })                                                      |
  +----------------------------------------------------------+
        |
        | Pushed to Redis (BullMQ)
        | Request already returned to caller
        v
  +----------------------------------------------------------+
  |                   Background Worker                      |
  |                                                          |
  |  @Processor('audit')                                     |
  |  AuditProcessor.handleAuditLog(job)                      |
  |       |                                                  |
  |       +-- Write to MongoDB audit_logs collection         |
  |       |                                                  |
  |       +-- SuspiciousActivityService.evaluate()           |
  |               |                                          |
  |               +-- off-hours access?                      |
  |               +-- >10 denials in 5 min?                  |
  |               +-- unusual permission frequency?          |
  |               +-- flag isSuspicious: true if triggered   |
  +----------------------------------------------------------+
        |
        v
  GET /api/audit/suspicious  -->  flagged entries only
  GET /api/audit/recent      -->  last 100 decisions
  GET /api/audit/user/:id    -->  per-user trail
```

---

## Access Request Lifecycle

```
  Employee                  Manager / Admin              System
     |                            |                        |
     |  POST /access-requests     |                        |
     |  resource: "prod-db"       |                        |
     |  justification: "..."      |                        |
     |  duration: "1 day"         |                        |
     +--------------------------->|                        |
                                  |  status: "pending"     |
                                  |  saved to MongoDB      |
                                  +----------------------->|
                                  |                        |
                                  |  GET /access-requests  |
                                  |  (filter: pending)     |
                                  |<-----------------------+
                                  |
                                  |  ABAC check:
                                  |   - has access:approve
                                  |   - mfaVerified: true
                                  |   - within business hrs
                                  |
                                  |  PATCH /:id/approve
                                  +----------------------->|
                                  |                        | status --> "approved"
                                  |                        | reviewerId set
     |<---------------------------+------------------------+
     |  GET /access-requests/mine |                        |
     |  --> approved              |                        |
     |                            |                        |
     |            REVOKE PATH     |                        |
                                  |  PATCH /:id/revoke     |
                                  |  (MFA only, any time)  |
                                  +----------------------->|
                                  |                        | status --> "revoked"
     |<---------------------------+------------------------+
     |  GET /mine --> revoked     |                        |
```

---

## Role & Permission Model

```
  Permission format:  resource:action

  +------------------------------------------------------------+
  |  Available permissions                                     |
  |                                                            |
  |  users:read          roles:read          audit:read        |
  |  users:create        roles:create        audit:suspicious  |
  |  users:update        roles:update        access:request    |
  |  users:delete        roles:delete        access:read       |
  |  users:deactivate    roles:assign        access:read_own   |
  |                                          access:approve    |
  |                                          access:revoke     |
  |                      *:*  (wildcard -- matches everything) |
  +------------------------------------------------------------+

  +------------------------------------------------------------+
  |  Role definitions (demo seed)                              |
  |                                                            |
  |  super-admin                                               |
  |  +-- *:*                                                   |
  |                                                            |
  |  manager                                                   |
  |  +-- users:read                                            |
  |  +-- roles:read                                            |
  |  +-- access:read                                           |
  |  +-- access:approve    <-- ABAC: MFA + business hours      |
  |  +-- access:revoke     <-- ABAC: MFA only                  |
  |  +-- audit:read                                            |
  |  +-- bonus:approve                                         |
  |                                                            |
  |  security_analyst                                          |
  |  +-- users:read                                            |
  |  +-- roles:read                                            |
  |  +-- access:read                                           |
  |  +-- audit:read                                            |
  |  +-- audit:suspicious                                      |
  |                                                            |
  |  employee                                                  |
  |  +-- access:request                                        |
  |  +-- access:read_own                                       |
  |                                                            |
  |  A user can hold MULTIPLE roles simultaneously.            |
  |  Permissions are unioned across all assigned roles.        |
  +------------------------------------------------------------+
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Backend | NestJS + TypeScript | Modular DI, decorator-based guards, production-ready |
| Authentication | JWT + Passport.js | Stateless auth, easy to verify across services |
| Database | MongoDB Atlas + Mongoose | Flexible schema for permission/role documents |
| Caching | Redis (`@nestjs/cache-manager`) | Sub-millisecond permission lookups |
| Queue | BullMQ (`@nestjs/bullmq`) | Reliable async audit processing with retries |
| Frontend | Next.js 16 + Tailwind | App Router, client-side auth context |
| API Hosting | Railway | Auto-deploy from GitHub, env vars, zero config |
| UI Hosting | Vercel | Next.js native, instant deploys |
| DB Hosting | MongoDB Atlas | Free tier, cloud, IP whitelisting |
| Cache Hosting | Upstash Redis | Serverless Redis, TLS, free tier |

---

## Project Structure

```
Privileged-Access-Management-RBAC-ABAC/
|
+-- rbac-service/
|   +-- src/
|   |   +-- main.ts                        # Bootstrap, CORS, global pipes
|   |   +-- app.module.ts                  # Root module wiring
|   |   |
|   |   +-- infrastructure/
|   |   |   +-- cache/
|   |   |   |   +-- rbac-cache.service.ts  # Reverse-index cache logic
|   |   |   +-- database/schemas/
|   |   |   |   +-- user.schema.ts
|   |   |   |   +-- role.schema.ts
|   |   |   |   +-- permission.schema.ts
|   |   |   |   +-- user-role.schema.ts
|   |   |   |   +-- audit-log.schema.ts
|   |   |   |   +-- access-request.schema.ts
|   |   |   +-- queues/
|   |   |       +-- queue.module.ts        # BullMQ Redis connection
|   |   |       +-- queue.service.ts       # addAuditJob()
|   |   |
|   |   +-- modules/
|   |       +-- auth/
|   |       |   +-- strategies/jwt.strategy.ts
|   |       |   +-- guards/
|   |       |   |   +-- jwt-auth.guard.ts
|   |       |   |   +-- permissions.guard.ts
|   |       |   +-- decorators/
|   |       |       +-- require-permissions.decorator.ts
|   |       |       +-- public.decorator.ts
|   |       |
|   |       +-- rbac/
|   |       |   +-- audit/
|   |       |   |   +-- audit.processor.ts       # BullMQ job handler
|   |       |   |   +-- audit.service.ts
|   |       |   |   +-- suspicious-activity.service.ts
|   |       |   +-- context/
|   |       |   |   +-- context-evaluator.service.ts  # ABAC rules engine
|   |       |   |   +-- attribute-rules.ts
|   |       |   +-- roles/
|   |       |   +-- permissions/
|   |       |   +-- user-roles/             # Permission resolution + cache
|   |       |
|   |       +-- access-requests/            # PAM request lifecycle
|   |       +-- users/
|   |       +-- bonus/                      # ABAC demo endpoint
|   |
|   +-- dist/                              # Compiled JS (committed for Railway)
|   +-- railway.json                       # Build + start command
|   +-- nixpacks.toml                      # Node 20, install flags
|   +-- seed.ts                            # Bootstrap admin + permissions
|
+-- PAM-frontend/
    +-- sentry-ui/
        +-- app/
        |   +-- login/page.tsx
        |   +-- dashboard/page.tsx
        +-- lib/
            +-- api.ts                     # Typed fetch client
            +-- auth-context.tsx           # JWT + permissions React context
```

---

## Running Locally

```bash
# Backend
cd rbac-service
cp .env.example .env     # fill in MongoDB URI, Redis URL, JWT secret
npm install
npm run start:dev
# --> http://localhost:3010/api

# Frontend
cd PAM-frontend/sentry-ui
echo "NEXT_PUBLIC_API_URL=http://localhost:3010/api" > .env.local
npm install
npm run dev
# --> http://localhost:3000

# Seed (first run only)
node dist/src/seed.js
# Creates: all permissions, super-admin role, admin@sentry.dev / Admin@1234
```

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3010` |
| `MONGODB_URI` | Atlas connection string | `mongodb+srv://...` |
| `REDIS_URL` | Upstash TLS URL | `rediss://default:...` |
| `JWT_SECRET` | JWT signing key | `your-secret` |
| `JWT_EXPIRES_IN` | Token lifetime | `1d` |
| `NODE_ENV` | Environment | `production` |
| `NEXT_PUBLIC_API_URL` | API base URL (frontend) | `https://...railway.app/api` |

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | Public | Register user |
| POST | `/auth/login` | Public | Login, returns JWT |
| GET | `/auth/me` | JWT | Current user profile |

### Roles & Permissions
| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/roles` | `roles:read` | List all roles |
| POST | `/roles` | `roles:create` | Create a role |
| POST | `/user-roles/assign` | `roles:assign` | Assign role to user |
| DELETE | `/user-roles/:userId/:roleId` | `roles:assign` | Remove role from user |
| GET | `/user-roles/user/:id/permissions` | JWT | Flat permission list |

### Access Requests
| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | `/access-requests` | `access:request` | Submit a request |
| GET | `/access-requests` | `access:read` | All requests |
| GET | `/access-requests/mine` | JWT | Own requests |
| PATCH | `/access-requests/:id/approve` | `access:approve` + MFA | Approve |
| PATCH | `/access-requests/:id/reject` | `access:approve` | Reject |
| PATCH | `/access-requests/:id/revoke` | `access:revoke` | Revoke |

### Audit
| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/audit/recent` | `audit:read` | Last 100 entries |
| GET | `/audit/suspicious` | `audit:suspicious` | Flagged entries |
| GET | `/audit/user/:id` | `audit:read` | Per-user trail |

---

## Deployment

| Service | Platform | Config |
|---------|----------|--------|
| rbac-service | Railway | Root dir: `rbac-service/` · start: `node dist/src/main.js` |
| Sentry UI | Vercel | Root dir: `PAM-frontend/sentry-ui` |
| Database | MongoDB Atlas | Network access: `0.0.0.0/0` for Railway dynamic IPs |
| Cache + Queue | Upstash Redis | Protocol: `rediss://` (TLS) · Eviction policy: `noeviction` |

---

<div align="center">
Built by <a href="https://github.com/pattabi884">Pattabi Rama</a> &nbsp;·&nbsp; Deployed on Railway + Vercel
</div>
