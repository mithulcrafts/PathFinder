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
   Import a journey dataset from the `db/journeys/` directory. The retained legacy seeds use named months (for example `Jan 2000`); current validation requires `01 2000`. Convert dates in a reviewed copy before importing. See the [history audit](maintenance/commit-history-audit.md) for this existing compatibility issue:
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
