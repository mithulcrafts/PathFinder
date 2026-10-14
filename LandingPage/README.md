# PathFinder Landing Page

This is the official showcase and landing page for **PathFinder**, a platform that turns disconnected career advice into a searchable knowledge graph of verified experiences.

## How to Run

To run the landing page locally:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

## Public journey links

Public profiles live in the [web app](https://path-finder-webapp.vercel.app), not this marketing site. `vercel.json` redirects previously shared `/u/:username` links to the web app. Redeploy this Vercel project for the redirect to take effect. If the web app domain changes, update this redirect, the platform link, and the frontend's `EXPO_PUBLIC_WEB_APP_URL` together.
