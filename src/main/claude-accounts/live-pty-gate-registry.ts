import { AsyncLocalStorage } from 'node:async_hooks'

// Why: the gate's live-ownership records are shared by the launch/mutation gate
// and by startup seeding, so they live here instead of in either consumer.
export const liveClaudePtyIds = new Set<string>()
export const liveSharedClaudePtyAccounts = new Map<string, string | null>()
export const liveInjectedClaudePtyAccounts = new Map<string, string>()
export const injectedClaudeLaunchReservations = new Map<string, string>()
export const sharedClaudeLaunchReservations = new Map<string, string | null>()
export const managedClaudeAccountMutations = new Set<string>()
export const managedClaudeAccountMutationContext = new AsyncLocalStorage<ReadonlySet<string>>()
// Why: ids restored from persistence at startup, not yet confirmed against the
// daemon. They keep the OAuth refresh gate closed so an early managed refresh
// cannot rotate the single-use refresh token out from under a Claude CLI that
// survived the app restart inside the daemon.
export const seededUnconfirmedPtyIds = new Set<string>()
export const seededUnconfirmedInjectedPtyIds = new Set<string>()

export type ClaudeLivePtyPersistence = {
  addClaudeLivePtySessionId(sessionId: string, accountId?: string | null): void
  removeClaudeLivePtySessionId(sessionId: string): void
  addClaudeLivePtyAccountBinding?(sessionId: string, accountId: string): void
  removeClaudeLivePtyAccountBinding?(sessionId: string): void
}

let persistence: ClaudeLivePtyPersistence | null = null

export function attachClaudeLivePtyPersistence(target: ClaudeLivePtyPersistence | null): void {
  persistence = target
}

export function getClaudeLivePtyPersistence(): ClaudeLivePtyPersistence | null {
  return persistence
}

// Why: a live claude defers the managed OAuth refresh ("Waiting for Claude
// session"); consumers need the 1 -> 0 transition to recover promptly instead
// of waiting out the usage-fetch failure backoff.
type LiveClaudePtyDrainListener = () => void
const drainListeners = new Set<LiveClaudePtyDrainListener>()

export function onLiveClaudePtysDrained(listener: LiveClaudePtyDrainListener): () => void {
  drainListeners.add(listener)
  return () => drainListeners.delete(listener)
}

export function notifyDrainedOnTransition(hadLivePtys: boolean): void {
  if (!hadLivePtys || liveClaudePtyIds.size > 0) {
    return
  }
  for (const listener of drainListeners) {
    listener()
  }
}
