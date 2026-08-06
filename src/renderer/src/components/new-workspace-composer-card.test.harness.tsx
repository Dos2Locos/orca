// Shared fixtures and render helper for the NewWorkspaceComposerCard suites.
// Why a separate module: each importing test file installs its own vi.mock
// registry, and this file only renders the component under those mocks.
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect } from 'vitest'
import NewWorkspaceComposerCard from './NewWorkspaceComposerCard'
import type { NewWorkspaceProjectOption } from '@/lib/new-workspace-project-options'
import type { ProjectHostSetupOption } from '@/lib/project-host-setup-options'
import type { ClaudeManagedAccountSummary } from '../../../shared/types'

export const projectOptions: NewWorkspaceProjectOption[] = [
  {
    kind: 'project-group',
    id: 'project-group:platform',
    projectGroupId: 'platform',
    displayName: 'Platform',
    badgeColor: 'var(--muted-foreground)',
    detail: '/workspace/platform',
    parentPath: '/workspace/platform',
    connectionId: null
  }
]

export const sourceRepos = [
  {
    id: 'repo-a',
    displayName: 'Repo A',
    path: '/repo-a',
    badgeColor: '#111111'
  },
  {
    id: 'repo-b',
    displayName: 'Repo B',
    path: '/repo-b',
    badgeColor: '#222222'
  }
]

export const localReadyHostOption: ProjectHostSetupOption = {
  kind: 'ready',
  id: 'setup-local',
  projectId: 'project-group:platform',
  hostId: 'local',
  repoId: 'repo-a',
  label: 'Local Mac',
  detail: 'Orca',
  path: '/Users/alice/orca'
}

export const devboxNeedsSetupHostOption: ProjectHostSetupOption = {
  kind: 'needs-setup',
  id: 'needs-setup:ssh:devbox',
  projectId: 'project-group:platform',
  hostId: 'ssh:devbox',
  label: 'Devbox',
  detail: 'Project location not set',
  isAvailable: true,
  attention: false
}

export const disconnectedDevboxNeedsSetupHostOption: ProjectHostSetupOption = {
  kind: 'needs-setup',
  id: 'needs-setup:ssh:devbox',
  projectId: 'project-group:platform',
  hostId: 'ssh:devbox',
  label: 'Devbox',
  detail: 'Connect this host to set up projects',
  isAvailable: false,
  attention: false,
  connectAction: { kind: 'ssh', targetId: 'devbox' }
}

export const disconnectedBastionNeedsSetupHostOption: ProjectHostSetupOption = {
  kind: 'needs-setup',
  id: 'needs-setup:ssh:bastion',
  projectId: 'project-group:platform',
  hostId: 'ssh:bastion',
  label: 'Bastion',
  detail: 'Connect this host to set up projects',
  isAvailable: false,
  attention: false,
  connectAction: { kind: 'ssh', targetId: 'bastion' }
}

export function findConnectButton(label: string): HTMLButtonElement | undefined {
  const item = findRunTargetItem(label)
  return [...(item?.querySelectorAll('button') ?? [])].find((button) =>
    button.textContent?.includes('Connect')
  )
}

export function renderCard(
  overrides: Partial<React.ComponentProps<typeof NewWorkspaceComposerCard>> = {}
) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(
      <NewWorkspaceComposerCard
        quickAgent={null}
        onQuickAgentChange={() => {}}
        claudeAccounts={[]}
        claudeAccountId={null}
        onClaudeAccountIdChange={() => {}}
        eligibleRepos={[]}
        repoId="repo-a"
        projectOptions={projectOptions}
        selectedProjectId="project-group:platform"
        selectedRepoIsGit
        onRepoChange={() => {}}
        onProjectChange={() => {}}
        primaryActionLabel="Create workspace"
        name=""
        onNameValueChange={() => {}}
        onSmartGitHubItemSelect={() => {}}
        onSmartGitLabItemSelect={() => {}}
        onSmartBranchSelect={() => {}}
        onSmartLinearIssueSelect={() => {}}
        smartNameSelection={null}
        onClearSmartNameSelection={() => {}}
        canReuseSelectedBranch={false}
        reuseSelectedBranch={false}
        onReuseSelectedBranchChange={() => {}}
        branchNameOverride=""
        onBranchNameOverrideChange={() => {}}
        forkPushWarning={null}
        detectedAgentIds={null}
        onOpenAgentSettings={() => {}}
        advancedOpen={false}
        onToggleAdvanced={() => {}}
        createDisabled={false}
        projectError={null}
        creating={false}
        onCreate={() => {}}
        note=""
        onNoteChange={() => {}}
        setupConfig={null}
        requiresExplicitSetupChoice={false}
        setupDecision={null}
        onSetupDecisionChange={() => {}}
        setupAgentStartupPolicy="start-immediately"
        onSetupAgentStartupPolicyChange={() => {}}
        shouldWaitForSetupCheck={false}
        resolvedSetupDecision={null}
        createError={null}
        selectedRepoConnectionId={null}
        selectedRepoSshStatus={null}
        selectedRepoRequiresConnection={false}
        selectedRepoConnectInProgress={false}
        onConnectSelectedRepo={async () => {}}
        canUseSparseCheckout={false}
        sparsePresets={[]}
        sparseSelectedPresetId={null}
        onSparseSelectPreset={() => {}}
        branchesEnabled={false}
        setupControlsEnabled={false}
        sparseControlsEnabled={false}
        {...overrides}
      />
    )
  })
  return { container, root }
}

export function findInputByLabel(container: HTMLElement, labelText: string): HTMLInputElement | null {
  const label = [...container.querySelectorAll('label')].find(
    (candidate) => candidate.textContent?.trim() === labelText
  )
  const labelledId = label?.getAttribute('for')
  if (labelledId) {
    return document.getElementById(labelledId) as HTMLInputElement | null
  }
  return label?.parentElement?.querySelector<HTMLInputElement>('input') ?? null
}

export function changeInputValue(input: HTMLInputElement, value: string): void {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  act(() => {
    valueSetter?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

export const claudeAccounts = [
  { id: 'acct-alice', email: 'alice@example.com' },
  { id: 'acct-bob', email: 'bob@example.com' }
] as unknown as ClaudeManagedAccountSummary[]

export function openRunTargetPicker(container: HTMLElement): void {
  // The field is the search box; clicking its shell focuses it and opens the list.
  const runTargetShell = container.querySelector<HTMLElement>(
    'div[data-run-target-combobox-root="true"]'
  )
  expect(runTargetShell).toBeTruthy()
  act(() => runTargetShell?.click())
}

export function findRunTargetItem(label: string): HTMLElement | undefined {
  // Rows are listbox options; "Add host" is the pinned footer row (also an option).
  return [
    ...document.body.querySelectorAll<HTMLElement>('[role="option"], [data-run-target-add-host]')
  ].find((item) => item.textContent?.includes(label))
}
