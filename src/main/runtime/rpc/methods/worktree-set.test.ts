import { describe, expect, it, vi } from 'vitest'
import { RpcDispatcher } from '../dispatcher'
import type { RpcRequest } from '../core'
import type { OrcaRuntimeService } from '../../orca-runtime'
import { WORKTREE_METHODS } from './worktree'

function makeRequest(method: string, params?: unknown): RpcRequest {
  return { id: 'req-1', authToken: 'tok', method, params }
}

const passthroughDedupe = <T>(_repo: string, _id: string | undefined, run: () => Promise<T>) =>
  run()

describe('worktree.set RPC metadata mutations', () => {
  it('forwards Linear metadata through worktree.set', async () => {
    const runtime = {
      getRuntimeId: () => 'test-runtime',
      dedupeWorktreeCreate: passthroughDedupe,
      updateManagedWorktreeMeta: vi.fn().mockResolvedValue({ id: 'wt-1' })
    } as unknown as OrcaRuntimeService
    const dispatcher = new RpcDispatcher({ runtime, methods: WORKTREE_METHODS })

    const response = await dispatcher.dispatch(
      makeRequest('worktree.set', {
        worktree: 'id:wt-1',
        linkedLinearIssue: 'STA-335',
        linkedLinearIssueWorkspaceId: null,
        linkedLinearIssueOrganizationUrlKey: 'stably'
      })
    )

    expect(response).toMatchObject({ ok: true })
    expect(runtime.updateManagedWorktreeMeta).toHaveBeenCalledWith(
      'id:wt-1',
      expect.objectContaining({
        linkedLinearIssue: 'STA-335',
        linkedLinearIssueWorkspaceId: null,
        linkedLinearIssueOrganizationUrlKey: 'stably'
      })
    )
  })

  it('forwards push target clears through worktree.set', async () => {
    const runtime = {
      getRuntimeId: () => 'test-runtime',
      dedupeWorktreeCreate: passthroughDedupe,
      updateManagedWorktreeMeta: vi.fn().mockResolvedValue({ id: 'wt-1' })
    } as unknown as OrcaRuntimeService
    const dispatcher = new RpcDispatcher({ runtime, methods: WORKTREE_METHODS })

    const response = await dispatcher.dispatch(
      makeRequest('worktree.set', {
        worktree: 'id:wt-1',
        linkedPR: null,
        pushTarget: null
      })
    )

    expect(response).toMatchObject({ ok: true })
    expect(runtime.updateManagedWorktreeMeta).toHaveBeenCalledWith(
      'id:wt-1',
      expect.objectContaining({
        linkedPR: null,
        pushTarget: null
      })
    )
  })

  it('forwards account pins and validated metadata batches', async () => {
    const runtime = {
      getRuntimeId: () => 'test-runtime',
      updateManagedWorktreeMeta: vi.fn().mockResolvedValue({ id: 'wt-1' }),
      updateManagedWorktreesMeta: vi.fn().mockResolvedValue({ updated: 2 })
    } as unknown as OrcaRuntimeService
    const dispatcher = new RpcDispatcher({ runtime, methods: WORKTREE_METHODS })

    await dispatcher.dispatch(
      makeRequest('worktree.set', { worktree: 'id:wt-1', claudeAccountId: null })
    )
    const response = await dispatcher.dispatch(
      makeRequest('worktree.setBatch', {
        updates: [
          { worktree: 'id:wt-1', claudeAccountId: 'account-a' },
          { worktree: 'id:wt-2', claudeAccountId: null }
        ]
      })
    )

    expect(runtime.updateManagedWorktreeMeta).toHaveBeenCalledWith(
      'id:wt-1',
      expect.objectContaining({ claudeAccountId: null })
    )
    expect(runtime.updateManagedWorktreesMeta).toHaveBeenCalledWith([
      { worktreeSelector: 'id:wt-1', updates: { claudeAccountId: 'account-a' } },
      { worktreeSelector: 'id:wt-2', updates: { claudeAccountId: null } }
    ])
    expect(response).toMatchObject({ ok: true, result: { updated: 2 } })
  })

  it('rejects worktree.set when both parent and no-parent are supplied', async () => {
    const runtime = {
      getRuntimeId: () => 'test-runtime',
      dedupeWorktreeCreate: passthroughDedupe,
      updateManagedWorktreeMeta: vi.fn()
    } as unknown as OrcaRuntimeService
    const dispatcher = new RpcDispatcher({ runtime, methods: WORKTREE_METHODS })

    const response = await dispatcher.dispatch(
      makeRequest('worktree.set', {
        worktree: 'id:child',
        parentWorktree: 'id:parent',
        noParent: true
      })
    )

    expect(response).toMatchObject({ ok: false })
    expect(JSON.stringify(response)).toContain('Choose either --parent-worktree or --no-parent')
    expect(runtime.updateManagedWorktreeMeta).not.toHaveBeenCalled()
  })
})
