import { randomUUID } from 'node:crypto'
import * as ownershipEpoch from './live-pty-ownership-epoch'
import {
  getClaudeLivePtyPersistence,
  injectedClaudeLaunchReservations,
  liveClaudePtyIds,
  liveInjectedClaudePtyAccounts,
  liveSharedClaudePtyAccounts,
  managedClaudeAccountMutationContext,
  managedClaudeAccountMutations,
  notifyDrainedOnTransition,
  seededUnconfirmedInjectedPtyIds,
  seededUnconfirmedPtyIds,
  sharedClaudeLaunchReservations
} from './live-pty-gate-registry'

export type { ClaudeLivePtyPersistence } from './live-pty-gate-registry'
export {
  attachClaudeLivePtyPersistence,
  onLiveClaudePtysDrained
} from './live-pty-gate-registry'
export {
  confirmSeededClaudeLivePtys,
  hasSeededUnconfirmedClaudePtys,
  seedLiveClaudePtysFromPersistence,
  seedLiveInjectedClaudePtysFromPersistence
} from './live-pty-startup-seeding'

let switchInProgress = false


export function markClaudePtySpawned(
  ptyId: string,
  accountId: string | null = null,
  reservationId?: string,
  options?: { persistenceAlreadyRecorded?: boolean }
): void {
  if (
    reservationId &&
    (!sharedClaudeLaunchReservations.has(reservationId) ||
      sharedClaudeLaunchReservations.get(reservationId) !== accountId)
  ) {
    throw new Error('The shared Claude account launch reservation is no longer valid.')
  }
  const wasLive = liveClaudePtyIds.has(ptyId)
  const hadExistingAccount = liveSharedClaudePtyAccounts.has(ptyId)
  const existingAccountId = liveSharedClaudePtyAccounts.get(ptyId) ?? null
  const existingOwnershipEpoch = ownershipEpoch.getLiveClaudePtyOwnershipEpoch(ptyId)
  const bindingAccountId = hadExistingAccount ? existingAccountId : accountId
  try {
    liveClaudePtyIds.add(ptyId)
    liveSharedClaudePtyAccounts.set(ptyId, bindingAccountId)
    try {
      if (!options?.persistenceAlreadyRecorded) {
        getClaudeLivePtyPersistence()?.addClaudeLivePtySessionId(ptyId, bindingAccountId)
      }
      seededUnconfirmedPtyIds.delete(ptyId)
      ownershipEpoch.recordLiveClaudePtyOwnershipEpoch(ptyId)
    } catch (error) {
      liveClaudePtyIds.delete(ptyId)
      if (wasLive) {
        liveClaudePtyIds.add(ptyId)
      }
      if (hadExistingAccount) {
        liveSharedClaudePtyAccounts.set(ptyId, existingAccountId)
      } else {
        liveSharedClaudePtyAccounts.delete(ptyId)
      }
      ownershipEpoch.restoreLiveClaudePtyOwnershipEpoch(ptyId, existingOwnershipEpoch)
      throw error
    }
  } finally {
    releaseSharedClaudeAccountLaunch(reservationId)
  }
}

export function markInjectedClaudePtySpawned(
  ptyId: string,
  accountId: string,
  reservationId?: string,
  options?: { persistenceAlreadyRecorded?: boolean }
): void {
  const existingAccountId = liveInjectedClaudePtyAccounts.get(ptyId)
  const existingOwnershipEpoch = ownershipEpoch.getLiveClaudePtyOwnershipEpoch(ptyId)
  const reservedAccountId = reservationId
    ? injectedClaudeLaunchReservations.get(reservationId)
    : undefined
  if (existingAccountId && existingAccountId !== accountId) {
    throw new Error('A live Claude terminal cannot change its assigned account.')
  }
  if (reservationId && reservedAccountId !== accountId) {
    throw new Error('The Claude account launch reservation is no longer valid.')
  }
  try {
    liveInjectedClaudePtyAccounts.set(ptyId, accountId)
    try {
      if (!options?.persistenceAlreadyRecorded) {
        getClaudeLivePtyPersistence()?.addClaudeLivePtyAccountBinding?.(ptyId, accountId)
      }
      seededUnconfirmedInjectedPtyIds.delete(ptyId)
      ownershipEpoch.recordLiveClaudePtyOwnershipEpoch(ptyId)
    } catch (error) {
      if (existingAccountId) {
        liveInjectedClaudePtyAccounts.set(ptyId, existingAccountId)
      } else {
        liveInjectedClaudePtyAccounts.delete(ptyId)
      }
      ownershipEpoch.restoreLiveClaudePtyOwnershipEpoch(ptyId, existingOwnershipEpoch)
      throw error
    }
  } finally {
    releaseInjectedClaudeAccountLaunch(reservationId)
  }
}

export function markClaudePtyExited(ptyId: string): void {
  const hadLivePtys = liveClaudePtyIds.size > 0
  liveClaudePtyIds.delete(ptyId)
  liveSharedClaudePtyAccounts.delete(ptyId)
  seededUnconfirmedPtyIds.delete(ptyId)
  getClaudeLivePtyPersistence()?.removeClaudeLivePtySessionId(ptyId)
  liveInjectedClaudePtyAccounts.delete(ptyId)
  ownershipEpoch.clearLiveClaudePtyOwnershipEpoch(ptyId)
  seededUnconfirmedInjectedPtyIds.delete(ptyId)
  getClaudeLivePtyPersistence()?.removeClaudeLivePtyAccountBinding?.(ptyId)
  notifyDrainedOnTransition(hadLivePtys)
}

export function hasLiveClaudePtys(): boolean {
  return liveClaudePtyIds.size > 0
}

export function isLiveSharedClaudePty(ptyId: string): boolean {
  return liveClaudePtyIds.has(ptyId)
}

export function getLiveSharedClaudePtyAccountId(ptyId: string): string | null {
  return liveSharedClaudePtyAccounts.get(ptyId) ?? null
}

export function hasLiveSharedClaudePtysForAccount(accountId: string): boolean {
  return [...liveSharedClaudePtyAccounts.values()].some(
    (liveAccountId) => liveAccountId === null || liveAccountId === accountId
  )
}

export function hasLiveInjectedClaudePtysForAccount(accountId: string): boolean {
  return (
    [...liveInjectedClaudePtyAccounts.values()].includes(accountId) ||
    [...injectedClaudeLaunchReservations.values()].includes(accountId)
  )
}

export function getLiveInjectedClaudePtyAccountId(ptyId: string): string | null {
  return liveInjectedClaudePtyAccounts.get(ptyId) ?? null
}

export function reserveInjectedClaudeAccountLaunch(accountId: string): string {
  if (managedClaudeAccountMutations.has(accountId)) {
    throw new Error('This Claude account is being changed. Try again when the change finishes.')
  }
  if (
    [...sharedClaudeLaunchReservations.values()].some(
      (reservedAccountId) => reservedAccountId === null || reservedAccountId === accountId
    )
  ) {
    throw new Error('This Claude account is being launched globally. Try again when it finishes.')
  }
  if (hasLiveSharedClaudePtysForAccount(accountId)) {
    throw new Error(
      'This Claude account is already in use by a global terminal. Close it before launching the assigned account.'
    )
  }
  const reservationId = randomUUID()
  injectedClaudeLaunchReservations.set(reservationId, accountId)
  return reservationId
}

export function reserveSharedClaudeAccountLaunch(accountId: string | null): string {
  if (switchInProgress) {
    throw new Error('A Claude account switch is in progress. Try again after it finishes.')
  }
  if (
    accountId === null
      ? managedClaudeAccountMutations.size > 0
      : managedClaudeAccountMutations.has(accountId)
  ) {
    throw new Error('This Claude account is being changed. Try again when the change finishes.')
  }
  if (
    accountId === null
      ? liveInjectedClaudePtyAccounts.size > 0 || injectedClaudeLaunchReservations.size > 0
      : hasLiveInjectedClaudePtysForAccount(accountId)
  ) {
    throw new Error(
      'This Claude account is in use by an assigned worktree. Close that Claude terminal before launching it globally.'
    )
  }
  const reservationId = randomUUID()
  sharedClaudeLaunchReservations.set(reservationId, accountId)
  return reservationId
}

export function beginManagedClaudeAccountMutation(
  accountId: string,
  allowLiveSharedPtys = false
): void {
  if (
    hasLiveInjectedClaudePtysForAccount(accountId) ||
    (!allowLiveSharedPtys && hasLiveSharedClaudePtysForAccount(accountId)) ||
    [...sharedClaudeLaunchReservations.values()].some(
      (reservedAccountId) => reservedAccountId === null || reservedAccountId === accountId
    )
  ) {
    throw new Error(
      'This Claude account is in use by an assigned worktree. Close its Claude terminal before changing the account.'
    )
  }
  if (managedClaudeAccountMutations.has(accountId)) {
    throw new Error('This Claude account is already being changed.')
  }
  managedClaudeAccountMutations.add(accountId)
}

export function endManagedClaudeAccountMutation(accountId: string): void {
  managedClaudeAccountMutations.delete(accountId)
}

export async function runManagedClaudeAccountMutation<T>(
  accountId: string,
  operation: () => Promise<T>,
  allowLiveSharedPtys = false
): Promise<T> {
  const inherited = managedClaudeAccountMutationContext.getStore()
  if (inherited?.has(accountId)) {
    return operation()
  }
  beginManagedClaudeAccountMutation(accountId, allowLiveSharedPtys)
  try {
    return await managedClaudeAccountMutationContext.run(
      new Set([...(inherited ?? []), accountId]),
      operation
    )
  } finally {
    endManagedClaudeAccountMutation(accountId)
  }
}

export function releaseInjectedClaudeAccountLaunch(reservationId: string | undefined): void {
  if (!reservationId) {
    return
  }
  injectedClaudeLaunchReservations.delete(reservationId)
}

export function releaseSharedClaudeAccountLaunch(reservationId: string | undefined): void {
  if (!reservationId) {
    return
  }
  sharedClaudeLaunchReservations.delete(reservationId)
}

export function beginClaudeAuthSwitch(): void {
  if (switchInProgress) {
    throw new Error('A Claude account switch is already in progress.')
  }
  if (sharedClaudeLaunchReservations.size > 0) {
    // Why: shared auth must not change after launch preparation but before the
    // PTY is registered in the durable live-session gate.
    throw new Error('A global Claude terminal is starting. Try again when it finishes.')
  }
  switchInProgress = true
}

export function endClaudeAuthSwitch(): void {
  switchInProgress = false
}

export function isClaudeAuthSwitchInProgress(): boolean {
  return switchInProgress
}
