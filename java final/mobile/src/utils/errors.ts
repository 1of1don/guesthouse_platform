// Firebase errors are cryptic, so show something a person can act on.
export function explain(e: unknown): string {
  const code = (e as { code?: string })?.code;

  if (code === 'permission-denied') {
    return 'The database refused the request. Publish firestore.rules in the Firebase console (Firestore > Rules).';
  }
  if (code === 'unavailable') {
    return 'Could not reach the database. Check your internet and try again.';
  }
  return 'Something went wrong. Pull down to try again.';
}
