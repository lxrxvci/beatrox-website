// Stub for `next/cache` when Payload scripts run outside the Next.js server.
// CLI runs cannot revalidate the deployed site's ISR cache anyway; the
// afterChange hooks already swallow errors. Revalidate via a redeploy or the
// admin UI after applying changes.
export function revalidatePath() {}
export function revalidateTag() {}
export function unstable_cache(fn) {
  return fn
}
export function unstable_noStore() {}
