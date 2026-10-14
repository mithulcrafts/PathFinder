const DEFAULT_WEB_APP_URL = 'https://path-finder-webapp.vercel.app';

export function buildPublicJourneyUrl(
  username: string,
  webAppUrl = process.env.EXPO_PUBLIC_WEB_APP_URL || DEFAULT_WEB_APP_URL,
): string {
  return new URL(`/u/${encodeURIComponent(username)}`, webAppUrl).toString();
}
