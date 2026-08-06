import * as ownershipEpoch from './live-pty-ownership-epoch'
import {
  getClaudeLivePtyPersistence,
  liveClaudePtyIds,
  liveInjectedClaudePtyAccounts,
  liveSharedClaudePtyAccounts,
  notifyDrainedOnTransition,
  seededUnconfirmedInjectedPtyIds,
  seededUnconfirmedPtyIds
} from './live-pty-gate-registry'

export function seedLiveClaudePtysFromPersistence(
  sessionIds: readonly string[],
  bindings: readonly { sessionId: string; accountId: string | null }[] = []
): void {
  const accountBySessionId = new Map(
    bindings.map((binding) => [binding.sessionId, binding.accountId])
  )
  for (const sessionId of sessionIds) {
    liveClaudePtyIds.add(sessionId)
    // Why: pre-binding releases have unknown ownership; block them
    // conservatively instead of assuming the current global account.
    liveSharedClaudePtyAccounts.set(sessionId, accountBySessionId.get(sessionId) ?? null)
    ownershipEpoch.recordLiveClaudePtyOwnershipEpoch(sessionId)
    seededUnconfirmedPtyIds.add(sessionId)
  }
}

export function seedLiveInjectedClaudePtysFromPersistence(
  bindings: readonly { sessionId: string; accountId: string }[]
): void {
  for (const { sessionId, accountId } of bindings) {
    liveInjectedClaudePtyAccounts.set(sessionId, accountId)
    ownershipEpoch.recordLiveClaudePtyOwnershipEpoch(sessionId)
    seededUnconfirmedInjectedPtyIds.add(sessionId)
  }
}

export function hasSeededUnconfirmedClaudePtys(): boolean {
  return seededUnconfirmedPtyIds.size > 0 || seededUnconfirmedInjectedPtyIds.size > 0
}

/**
 * Reconcile seeded ids against the daemon's live session list. Seeded ids the
 * daemon no longer knows are dead — release them so they cannot defer OAuth
 * refresh forever. Seeded ids that are still alive stay in the gate even if
 * their pane never reattaches: that daemon process still owns the credentials.
 */
export function confirmSeededClaudeLivePtys(aliveSessionIds: readonly string[]): void {
  const persistence = getClaudeLivePtyPersistence()
  const hadLivePtys = liveClaudePtyIds.size > 0
  const alive = new Set(aliveSessionIds)
  for (const sessionId of seededUnconfirmedPtyIds) {
    if (!alive.has(sessionId)) {
      liveClaudePtyIds.delete(sessionId)
      liveSharedClaudePtyAccounts.delete(sessionId)
      ownershipEpoch.clearLiveClaudePtyOwnershipEpoch(sessionId)
      persistence?.removeClaudeLivePtySessionId(sessionId)
    }
  }
  for (const sessionId of seededUnconfirmedInjectedPtyIds) {
    if (!alive.has(sessionId)) {
      liveInjectedClaudePtyAccounts.delete(sessionId)
      ownershipEpoch.clearLiveClaudePtyOwnershipEpoch(sessionId)
      persistence?.removeClaudeLivePtyAccountBinding?.(sessionId)
    }
  }
  seededUnconfirmedPtyIds.clear()
  seededUnconfirmedInjectedPtyIds.clear()
  notifyDrainedOnTransition(hadLivePtys)
}
