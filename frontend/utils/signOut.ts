export async function signOutWithoutReload(
  signOut: (callback: () => void) => Promise<void>,
  onSignedOut: () => void,
) {
  // Suppress Clerk's default browser navigation; wait for its session cleanup
  // before letting Expo Router show the public page.
  await signOut(() => {});
  onSignedOut();
}
