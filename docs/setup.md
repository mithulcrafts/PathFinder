# Local Development Setup Guide

Follow this guide to configure dependencies, set up environment variables, and run both the Express API backend and Expo frontend locally.

---

## Prerequisites

* **Node.js**: `v22.0.0` or higher
* **npm**: `v10.0.0` or higher
* **Neo4j DB**: A running local Neo4j instance or a Neo4j Aura (Serverless) database.
* **Upstash Redis**: An Upstash Redis account for onboarding session storage.
* **Clerk**: An active Clerk account for authentication.
* **Cloudinary**: A Cloudinary account for media and PDF proof uploads.

---

## 1. Backend Setup

### Navigate and Install
```bash
cd backend
npm ci
```

### Configure Environment Variables
Copy `.env.example` to `.env` inside the `backend/` directory:
```bash
cp .env.example .env
```

Fill in the environment variables:
```env
# Upstash Redis Configuration
UPSTASH_REDIS_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_TOKEN=your-upstash-redis-token

# Neo4j Graph DB Configuration
NEO4J_URI=neo4j+s://your-neo4j-uri.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-neo4j-password

# LLM Providers API Keys
GEMINI_API_KEY=your-google-gemini-key
GROQ_API_KEY=your-groq-api-key

# Voice Translation Ingestion API Key
SARVAM_API_KEY=your-sarvam-ai-api-key

# Clerk Authentication Keys
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...

# Cloudinary Asset Storage URL
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME

# Server configuration
NODE_ENV=development
PORT=5000
CORS_ORIGINS=http://localhost:8081,http://localhost:19006
```

### Seed and Run
1. **Apply Neo4j Schema**
   Create all required constraints, indexes, and vector indexes before seeding the database:
   ```bash
   npm run migrate
   ```
2. **Upload Initial Journey Data**
   Import a journey dataset from the `db/journeys/` directory. The retained legacy seeds use named months (for example `Jan 2000`); current validation requires `01 2000`. Convert and validate dates in a reviewed copy before importing:
   ```bash
   npm run upload-seeds -- <journey-file>
   ```
   Run the command again with a different filename to import additional journey datasets.
3. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   The backend API will start running at `http://localhost:5000`.

---

## 2. Frontend Setup

### Navigate and Install
```bash
cd ../frontend
npm ci
```

### Configure Environment Variables
Copy `.env.example` to `.env` inside the `frontend/` directory:
```bash
cp .env.example .env
```

Ensure the variables are configured:
```env
# URL pointing to your local backend Express API
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api

# Clerk Publishable Key (Must match the backend)
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### Start Expo App
You can run PathFinder on Android, iOS, or Web:
```bash
# Start Metro bundler
npm start

# Run directly on Web target
npm run web
```
The Metro Bundler will run at `http://localhost:8081`. Press `w` in your terminal to open the web version in your browser.

---

## 3. Common Errors & Troubleshooting

### 1. Missing installed modules
* **Cause**: Installed dependencies do not match the checked-in lockfile.
* **Resolution**: Run `npm ci` inside the affected application folder to install the locked dependencies.

### 2. Neo4j Connection Refused or Authentication Errors
* **Cause**: Incorrect database URI protocol (`neo4j://` vs `neo4j+s://`) or expired credentials.
* **Resolution**: Double-check that your `NEO4J_URI` protocol matches your hosting setup (use `neo4j+s://` for encrypted Aura serverless, `bolt://` or `neo4j://` for local desktop instances).

### 3. Clerk Middleware JWT Handshake Failures
* **Cause**: Mismatch between `CLERK_PUBLISHABLE_KEY` on the frontend and backend.
* **Resolution**: Ensure both `.env` configurations share the exact same publishable API keys.

### 4. Web View alert() warnings in Web Browser
* **Cause**: Using standard React Native `Alert.alert` on web builds causes silent warnings and locks interface loops.
* **Resolution**: The frontend uses platform checks (`Platform.OS === 'web'`) to switch from `Alert.alert` to browser native `alert()`. Ensure you do not revert these checks during customization edits.

## 4. Development checks

Run from the repository root:

```sh
npm --prefix backend run build
npm --prefix backend test
npm --prefix frontend run typecheck
npm --prefix frontend test
npm --prefix frontend run build
npm --prefix LandingPage run lint -- --deny-warnings
npm --prefix LandingPage run build
```

Automated tests use isolated records, mocked database calls and a local HTTP server. Live login, AI requests, database connections, proof uploads and native audio/sharing need separate integration checks. See [development conventions](architecture.md#development-conventions) and [known limitations](architecture.md#known-limitations-and-follow-up-work).

## 5. Keeping services active

Deploy the backend, then configure external jobs at [cron-job.org](https://cron-job.org/en/). No cron library is required. Set the job timezone to **Asia/Kolkata** and use the backend's HTTPS base URL with these paths:

| Method and path | Schedule (IST) | Operation |
| --- | --- | --- |
| `GET /health` | Daily at 09:00 and 09:02 | Wake/check the backend; no database access. |
| `POST /api/maintenance/neo4j` | Daily at 09:05 | Read-only `RETURN true AS ok`. |
| `POST /api/maintenance/redis` | 09:06 on days 1, 4, 7, …, 31 each month | One `GET maintenance:keepalive`; a missing key is valid. |

Cron expressions: `0,2 9 * * *`, `5 9 * * *`, and `6 9 */3 * *`. Redis checks are at most three days apart, with shorter gaps at month boundaries. Leave month and weekday selections unrestricted.

Generate a secret locally:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Store it as `MAINTENANCE_SECRET` in Render's backend environment (`backend/.env` for local testing). Set the same value in the `X-Maintenance-Secret` request header for both database jobs; leave their bodies empty. The public health job needs no secret. Never put the secret in Git, frontend settings or URLs.

Enable failure/recovery alerts. Test each job manually: expect HTTP 200; missing/wrong request secrets return 401, and missing server configuration or database failures return 503. Check a scheduled run after the backend has slept. The second wake request allows for a cold-start timeout; investigate failed database checks. Render can sleep again afterward.

Keep the existing Neo4j GitHub workflow until scheduled checks are verified. These endpoints do not restore paused/archived databases or guarantee provider availability; review provider inactivity notices and resume/restore through the provider console when needed.
