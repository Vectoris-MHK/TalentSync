# MongoDB Connection Pooling in Vercel Serverless — TalentSync

> Created: 2026-05-30 18:22 ICT
> Applies to: `server.js`, `config/db.js`, Vercel deployment of `talent-sync-server`
> Cluster: M10 AWS Singapore, database `job-portal`

---

## 1. Context: Local Development vs Vercel Serverless

### 1.1 Local Development (`npm run dev`)

Single persistent process. `await connectDB()` runs once at startup (~800ms). One Mongoose connection pool (5 sockets) is shared across ALL requests. "Database Connected" logs exactly once.

### 1.2 Vercel Serverless (Production)

**One pool per lambda instance.** Concurrent browser requests (`/`, `/favicon.ico`, `/favicon.png`) each spawn separate cold lambdas. Each lambda opens its own Mongoose pool. When a lambda stays warm (~5 minutes), it reuses its pool on subsequent requests. When cold, it starts fresh.

---

## 2. Problem 1: Top-Level `await connectDB()` Blocking Module Export

### 2.1 Original Code (Broken)

```js
// server.js — BEFORE fix
const app = express();

await connectDB();        // blocks module init ~800ms: DNS + TCP + MongoDB auth
await connectCloudinary();

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());
// routes...
export default app;       // unreachable during Vercel cold start window
```

### 2.2 Consequence: 307 Redirects on Every Cold Start

Vercel's gateway waits ~500ms for the module to export a handler. `await connectDB()` takes ~800ms. Vercel times out before the module exports, returns 307 to the client. By the time MongoDB connects, the request is gone.

**Vercel log evidence** (deployment `dpl_T1km6CNp...`):

```
...8030679  GET /  -> 307  (cold start, connectDB hasn't finished)
...8030841  GET /  -> Database Connected + 307  (DB connects but too late)
...8041545  GET /  -> 307  (another cold lambda, same issue)
...8042338  GET /  -> Database Connected + 200  (warm lambda finally works)
```

Every cold start: 4-6 failed 307s before one 200. Browser retries mask this from the user but add multi-second latency.

### 2.3 Fix Applied

```js
// server.js — AFTER fix

async function init() {
  await connectDB();
  await connectCloudinary();
}

// Production: fire-and-forget, module exports immediately
// Dev: blocking await so all routes work on startup
if (process.env.NODE_ENV !== 'production') {
  await init();
} else {
  init();
}

export default app;  // immediately available to Vercel
```

Module exports instantly. DB connection initializes in the background. Routes needing DB wait via `dbReady` middleware. Routes not needing DB (`/`, `/health`) respond immediately.

## 4. Problem 3: `app.listen()` Conflict with Vercel Serverless

### 4.1 Original Code

```js
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
// Missing: export default app
```

### 4.2 Consequence

In Vercel serverless, the runtime manages its own HTTP listener. `app.listen()` creates a competing HTTP server on `process.env.PORT`. Race condition causes random 307 redirects and missing handler errors.

### 4.3 Fix Applied

```js
const port = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => console.log(`Server running on port ${port}`));
}

export default app;  // required by @vercel/node builder
```

`app.listen()` only in dev. `export default app` gives Vercel the handler.

---

## 5. The `dbReady` Middleware Solution

### 5.1 Design

Gates all MongoDB-dependent routes behind a connection readiness check. Routes not needing DB (`/`, `/health`, `/webhooks`) bypass it entirely.

### 5.2 Implementation

```js
let ready = false;         // Is the connection pool ready?
let readyPromise = null;   // Promise singleton - init() runs only once

async function init() {
  await connectDB();        // Open Mongoose pool (5 connections) to Atlas M10
  await connectCloudinary(); // Configure Cloudinary SDK (stateless)
  ready = true;
}

function dbReady(req, res, next) {
  if (ready) return next();              // Fast path: pool ready -> 0ms overhead
  if (!readyPromise) readyPromise = init();  // First request: start init
  readyPromise
    .then(() => next())                     // Success: proceed to route
    .catch((err) => {
      console.error("DB init failed:", err);
      res.status(503).json({
        success: false,
        message: "Service temporarily unavailable."
      });
    });
}
```

### 5.3 Request Flow

**Cold lambda (first request after deploy or 5+ min idle):**

```
GET /               -> no dbReady -> "API Working" -> 200 (5ms)
GET /health         -> no dbReady -> { status, db: "connecting" } -> 200 (8ms)
GET /api/jobs       -> dbReady -> ready=false -> await init()
                        -> connectDB() -> DNS + TCP + auth (~800ms)
                        -> ready=true -> next() -> controller -> 200
```

**Warm lambda (subsequent requests within 5 min):**

```
GET /api/jobs/recommend-feed  -> dbReady -> ready=true -> next() (0ms)
                               -> controller -> $vectorSearch -> 200
```

### 5.4 Key Architectural Decisions

| Decision                             | Rationale                                                                                                                                                                   |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Promise singleton (`readyPromise`) | Prevents multiple concurrent `init()` calls on cold start. Request 1 creates the promise. Requests 2+ `.then()` onto it.                                                |
| `ready` boolean flag               | Allows O(1) fast-path check for warm lambdas. No Promise overhead on 99%+ of requests.                                                                                      |
| 503 on failure                       | Explicit "retry" signal vs generic 500. Client can retry after DB pool initializes.                                                                                         |
| No guard on `/webhooks`            | Clerk webhooks use their own `User.create()/updateOne()` which handle Mongoose errors internally. Adding `dbReady` would prevent webhook processing during cold starts. |
| No guard on `/`, `/health`       | These routes don't touch MongoDB. Instant response confirms the server is alive regardless of DB state.                                                                     |

### 5.5 Complete `server.js` Changes — Before/After Reference

**Before (original — 42 lines):**

```js
import './config/instrument.js'
import express from "express";
import cors from "cors";
import 'dotenv/config'
import connectDB from "./config/db.js";
import * as Sentry from "@sentry/node";
import { clerkWebhooks } from './controller/webhooks.js';
import companyRoutes from './routes/companyRoutes.js'
import connectCloudinary from './config/cloudinary.js';
import JobRoutes from './routes/jobRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { clerkMiddleware } from '@clerk/express';

const app = express();

await connectDB();          // BLOCKS: ~800ms — Vercel can't see exported handler
await connectCloudinary();   // BLOCKS: ~10ms

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

app.get("/", (req, res) => res.send("API Working"));

if (process.env.NODE_ENV !== 'production') {
  app.get("/debug-sentry", function mainHandler(req, res) {
    throw new Error("My first Sentry error!");
  });
}
app.post('/webhooks', clerkWebhooks);
app.use('/api/company', companyRoutes);    // No DB guard → crashes on cold start
app.use('/api/jobs', JobRoutes);           // No DB guard → crashes on cold start
app.use('/api/users', userRoutes);         // No DB guard → crashes on cold start

Sentry.setupExpressErrorHandler(app);

const port = process.env.PORT || 3000;
app.listen(port, ...);                     // BUG: conflicts with Vercel serverless
                                           // MISSING: export default app
```

**After (fixed — 84 lines):**

```js
import './config/instrument.js'
import express from "express";
import cors from "cors";
import 'dotenv/config'
import connectDB from "./config/db.js";
import * as Sentry from "@sentry/node";
import { clerkWebhooks } from './controller/webhooks.js';
import companyRoutes from './routes/companyRoutes.js'
import connectCloudinary from './config/cloudinary.js';
import JobRoutes from './routes/jobRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { clerkMiddleware } from '@clerk/express';

const app = express();

// ── FIX 1: DB readiness guard ────────────────────────────────────
let ready = false;
let readyPromise = null;

async function init() {
  await connectDB();        // Opens Mongoose pool (5 connections) to Atlas M10
  await connectCloudinary(); // Configures Cloudinary SDK (stateless)
  ready = true;
}

// FIX 2: Environment-specific initialization
//   Production: fire-and-forget → module exports immediately
//   Dev: blocking await → all routes ready before server starts
if (process.env.NODE_ENV !== 'production') {
  await init();
} else {
  init();
}

// FIX 3: dbReady middleware — gates all MongoDB-dependent routes
function dbReady(req, res, next) {
  if (ready) return next();              // Warm: O(1), 0ms overhead

  if (!readyPromise) readyPromise = init();  // Cold: start init once

  readyPromise
    .then(() => next())                       // Success → proceed to controller
    .catch((err) => {
      console.error("DB init failed:", err);
      res.status(503).json({                  // 503 = retry signal
        success: false,
        message: "Service temporarily unavailable. Please try again."
      });
    });
}
// ─────────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

// FIX 4: Routes that DON'T need database (respond instantly)
app.get("/", (req, res) => res.send("API Working"));
app.get("/health", async (req, res) => {
  const mongoose = (await import("mongoose")).default;
  const state = mongoose.connection.readyState;
  const states = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  res.json({ status: "ok", db: states[state] || "unknown" });
});

if (process.env.NODE_ENV !== 'production') {
  app.get("/debug-sentry", function mainHandler(req, res) {
    throw new Error("My first Sentry error!");
  });
}

// Clerk webhooks — no DB guard (handler manages its own DB calls)
app.post('/webhooks', clerkWebhooks);

// FIX 5: API routes — gated behind dbReady (wait for MongoDB pool)
app.use('/api/company', dbReady, companyRoutes);
app.use('/api/jobs', dbReady, JobRoutes);
app.use('/api/users', dbReady, userRoutes);

Sentry.setupExpressErrorHandler(app);

// FIX 6: app.listen() only in dev; export default app for Vercel
const port = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => console.log(`Server running on port ${port}`));
}

export default app;
```

**Change-by-change summary:**

| Fix | Line(s) | What Changed | Problem Solved |
|-----|---------|-------------|----------------|
| 1 | 16-24 | Added `ready`, `readyPromise`, `init()` | Removed blocking top-level `await` — module exports instantly |
| 2 | 26-31 | `if (NODE_ENV !== 'production') await init() : else init()` | Dev blocks for direct testing; production fire-and-forget |
| 3 | 33-47 | Added `dbReady(req, res, next)` middleware | API routes wait for DB pool instead of crashing |
| 4 | 55-61 | Added `GET /health` endpoint | Monitor DB connection state without querying |
| 5 | 73-75 | Added `dbReady` as middleware arg: `app.use('/api/jobs', dbReady, JobRoutes)` | Gate: all /api/* routes wait for DB pool |
| 6 | 79-84 | Guarded `app.listen()` behind `NODE_ENV !== 'production'`; added `export default app` | No competing HTTP server; Vercel can find the handler |

---

## 6. Mongoose Connection Pool Mechanics

### 6.1 Default Configuration

Mongoose opens a pool of 5 connections to MongoDB by default. Maximum is 100. These connections are maintained for the lifetime of the Node.js process (lambda instance).

```
Mongoose Pool (per lambda)
  Socket 1 <--> MongoDB Atlas M10 (talentsyncdb.yyz4uc.mongodb.net)
  Socket 2 <--> MongoDB Atlas M10
  Socket 3 <--> MongoDB Atlas M10
  Socket 4 <--> MongoDB Atlas M10
  Socket 5 <--> MongoDB Atlas M10
```

### 6.2 Connection Lifecycle on Vercel

```
Phase 1: Cold Start (0-800ms)
  - Lambda loads -> module exports -> Vercel routes request
  - First /api/* request triggers dbReady middleware
  - init() called -> connectDB():
    - DNS lookup: talentsyncdb.yyz4uc.mongodb.net -> IP (Google DNS 8.8.8.8)
    - TCP handshake: Vercel us-east -> AWS Singapore (ap-southeast-1)
    - MongoDB SCRAM-SHA-256 authentication
    - Pool opens: 5 sockets established
  - "Database Connected" logged
  - ready = true

Phase 2: Warm (800ms - 5 min)
  - All /api/* requests: dbReady -> ready=true -> next() (0ms)
  - Mongoose reuses existing pool sockets
  - No new connections opened

Phase 3: Idle (>5 min)
  - Lambda instance garbage collected by Vercel
  - Mongoose pool sockets closed/expired
  - "Database Connected" will need to log again on next cold start
```

### 6.3 Connection Count Analysis

Worst-case scenario (browser opens page with 6 concurrent requests, all cold):

```
| Lambda  | Purpose             | Pools | Connections |
|---------|---------------------|-------|-------------|
| L1      | GET /               | 0     | 0           |
| L2      | GET /favicon.ico    | 0     | 0           |
| L3      | GET /favicon.png    | 0     | 0           |
| L4      | GET /api/jobs       | 1     | 5           |
| L5      | GET /api/jobs (dup) | 1     | 5           |
| L6      | GET /api/users      | 1     | 5           |
| TOTAL   |                     | 3     | 15 briefly |
```

After initialization, idle pools time out. Steady-state: ~5-10 connections to Atlas M10. Well within M10 limits (hundreds of concurrent connections).

---

## 7. Timeline of Fixes

| # | Problem                                    | Root Cause                                       | Fix                                                                               | Status |
| - | ------------------------------------------ | ------------------------------------------------ | --------------------------------------------------------------------------------- | ------ |
| 1 | 500: Clerk publishable key missing         | `CLERK_PUBLISHABLE_KEY` not in Vercel env vars | Added to Vercel project settings                                                  | Fixed  |
| 2 | 307: Top-level await blocks module export  | `await connectDB()` at module top-level        | Removed top-level await, fire-and-forget `init()`, added `export default app` | Fixed  |
| 3 | 307:`app.listen()` conflicts with Vercel | `app.listen()` in production                   | Guarded behind `NODE_ENV !== 'production'`                                      | Fixed  |
| 4 | API routes fail on cold start              | Controllers query MongoDB before pool is ready   | Added `dbReady` middleware gating all `/api/*` routes                         | Fixed  |

---

## 8. Current Status (2026-05-30)

All four issues resolved. Server deploys and responds correctly on Vercel:

- `GET /` -> 200 "API Working" (instant, no DB needed)
- `GET /health` -> 200 `{ status: "ok", db: "connected" }` (instant)
- `GET /api/jobs` -> 200 (waits for DB on cold start, instant on warm)
- `GET /api/jobs/recommend-feed` -> 200 (full $vectorSearch + aggregation pipeline)
- `POST /webhooks` -> 200 (Clerk user sync)
- No more 307 redirects, no more 500 Clerk errors

---

## 9. Related Documentation

- `docs/implement/architecture.md` - System architecture, data schema, scoring formula
- `docs/implement/mongodb_atlas.md` - Atlas deployment report (M10, index topology)
- `docs/implement/decisions.md` - Technical decisions (embedding model, scoring weights, cache)
- `docs/implement/codebase.md` - File map, code conventions, middleware order
