# PathFinder — Frontend

Expo React Native app for PathFinder. Built with [Expo SDK 56](https://docs.expo.dev/versions/v56.0.0/), [Expo Router](https://docs.expo.dev/router/introduction/) and [Clerk](https://clerk.com/) for authentication.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Expo Go](https://expo.dev/go) app on your phone (for physical device testing)


## Setup

1. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Then open `.env` and fill in:
   - `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` — your Clerk publishable key from [Clerk Dashboard](https://dashboard.clerk.com)
   - `EXPO_PUBLIC_API_BASE_URL` — the backend API URL (see below)

4. **Start the dev server**
   ```bash
   npx expo start
   ```

## API URL Configuration

The `EXPO_PUBLIC_API_BASE_URL` depends on how you're running the app:

| Environment | URL |
|-------------|-----|
| Web browser | `http://localhost:5000/api` |
| Android Emulator | `http://10.0.2.2:5000/api` |
| iOS Simulator | `http://127.0.0.1:5000/api` |
| Physical device (Expo Go) | `http://<YOUR_WIFI_IP>:5000/api` |

> To find your Wi-Fi IP: run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) and look for your local address (e.g. `192.168.1.5`).

## Project Structure

```text
frontend/
├── app/                          # Expo Router (file-based routing)
│   ├── (tabs)/                   # Bottom tab navigation
│   │   ├── _layout.tsx           # Tab navigator configuration
│   │   ├── index.tsx             # Home dashboard
│   │   ├── explore.tsx           # AI query & discovery
│   │   ├── community.tsx         # Community journeys
│   │   ├── journey.tsx           # User journey overview
│   │   └── profile.tsx           # User profile
│   ├── full-journey/             # Interactive graph/timeline views
│   ├── _layout.tsx               # Root layout with providers
│   ├── +html.tsx                 # Web HTML configuration
│   ├── index.tsx                 # Landing page
│   ├── journey-details.tsx       # Detailed journey visualization
│   ├── oauth-native-callback.tsx # Clerk OAuth callback
│   ├── results.tsx               # AI retrieval results
│   └── share-journey.tsx         # Chat-based onboarding & submission
│
├── api/                          # API client & request wrappers
├── assets/                       # Images, icons, fonts, splash assets
├── components/
│   ├── community/                # Community UI components
│   ├── landing/                  # Landing page sections
│   └── ui/                       # Shared reusable UI components
│
├── constants/
│   └── colors.ts                 # Theme & color palette
│
├── services/                     # Backend API services
├── types/
│   └── schema.ts                 # Shared TypeScript interfaces
├── utils/                        # Helper utilitie
```

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `expo-router` | File-based routing and navigation |
| `@clerk/clerk-expo` | Authentication and user management |
| `expo-secure-store` | Secure storage for authentication tokens |
| `expo-auth-session` | OAuth authentication flow |
| `expo-av` | Voice recording and audio playback |
| `expo-file-system` | Local file management and uploads |
| `expo-document-picker` | PDF proof selection |
| `expo-image-picker` | Image proof selection |
| `expo-sharing` | Sharing journey visualizations |
| `nativewind` | Tailwind CSS styling for React Native |
| `react-native-reanimated` | High-performance animations |
| `react-native-gesture-handler` | Gesture-based interactions |
| `react-native-svg` | Graph and visualization rendering |
| `react-native-webview` | Embedded web content (Neo4j graph visualization) |

## API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/query` | POST | Send text query (JSON) or voice audio (FormData) |
| `/api/output/translate` | POST | Translate AI insights to user's preferred language |
| `/api/output/speech` | POST | Generate text-to-speech audio for AI summary |
| `/api/journey/extract` | POST | Extract structured user journey from natural language |
