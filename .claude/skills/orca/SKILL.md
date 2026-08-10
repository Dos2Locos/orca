---
name: orca-conventions
description: Development conventions and patterns for orca. TypeScript React project with conventional commits.
---

# Orca Conventions

> Generated from [Dos2Locos/orca](https://github.com/Dos2Locos/orca) on 2026-08-05

## Overview

This skill teaches Claude the development patterns and conventions used in orca.

## Tech Stack

- **Primary Language**: TypeScript
- **Framework**: React
- **Architecture**: type-based module organization
- **Test Location**: colocated
- **Test Framework**: vitest

## When to Use This Skill

Activate this skill when:
- Making changes to this repository
- Adding new features following established patterns
- Writing tests that match project conventions
- Creating commits with proper message format

## Commit Conventions

Follow these commit message conventions based on 40 analyzed commits.

### Commit Style: Conventional Commits

### Prefixes Used

- `fix`
- `feat`
- `test`
- `perf`

### Message Guidelines

- Average message length: ~57 characters
- Keep first line concise and descriptive
- Use imperative mood ("Add feature" not "Added feature")


*Commit message example*

```text
feat(worktree): add claudeAccountId to Worktree/WorktreeMeta data model
```

*Commit message example*

```text
fix(claude-accounts): honor per-worktree WSL account binding + warn on mismatch
```

*Commit message example*

```text
test: restore scoped-keychain mock impl safely instead of forced non-null
```

*Commit message example*

```text
perf: coalesce Claude exit reconciliation timers
```

*Commit message example*

```text
feat(claude-accounts): inject per-worktree pinned account at PTY spawn
```

*Commit message example*

```text
feat(claude-accounts): seed scoped macOS Keychain for injected accounts
```

*Commit message example*

```text
feat(worktree): plumb claudeAccountId through worktree creation
```

*Commit message example*

```text
feat(worktree): add account selector to the create-worktree modal
```

## Architecture

### Project Structure: Single Package

This project uses **type-based** module organization.

### Source Layout

```
src/
├── main/
├── preload/
├── renderer/
├── shared/
```

### Configuration Files

- `.github/workflows/release-cut.yml`
- `.github/workflows/release-mac-build.yml`
- `package.json`

### Guidelines

- Group code by type (components, services, utils)
- Keep related functionality in the same type folder
- Avoid circular dependencies between type folders

## Code Style

### Language: TypeScript

### Naming Conventions

| Element | Convention |
|---------|------------|
| Files | kebab-case |
| Functions | camelCase |
| Classes | PascalCase |
| Constants | SCREAMING_SNAKE_CASE |

### Import Style: Relative Imports

### Export Style: Named Exports


*Preferred import style*

```typescript
// Use relative imports
import { Button } from '../components/Button'
import { useAuth } from './hooks/useAuth'
```

*Preferred export style*

```typescript
// Use named exports
export function calculateTotal() { ... }
export const TAX_RATE = 0.1
export interface Order { ... }
```

## Testing

### Test Framework: vitest

### File Pattern: `*.test.ts`

### Test Types

- **Unit tests**: Test individual functions and components in isolation
- **E2e tests**: Test complete user flows through the application

### Mocking: vi.mock

### Coverage

This project has coverage reporting configured. Aim for 80%+ coverage.


*Test file structure*

```typescript
import { describe, it, expect } from 'vitest'

describe('MyFunction', () => {
  it('should return expected result', () => {
    const result = myFunction(input)
    expect(result).toBe(expected)
  })
})
```

## Error Handling

### Error Handling Style: Try-Catch Blocks

This project uses **custom error classes** for specific error types.


*Standard error handling pattern*

```typescript
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw new Error('User-friendly message')
}
```

## Common Workflows

These workflows were detected from analyzing commit patterns.

### Feature Development

Standard feature implementation workflow

**Frequency**: ~8 times per month

**Steps**:
1. Add feature implementation
2. Add tests for feature
3. Update documentation

**Files typically involved**:
- `src/main/ipc/*`
- `src/shared/*`
- `src/main/claude-accounts/*`
- `**/*.test.*`

**Example commit sequence**:
```
feat(worktree): add claudeAccountId to Worktree/WorktreeMeta data model
feat(claude-accounts): inject per-worktree pinned account at PTY spawn
feat(claude-accounts): seed scoped macOS Keychain for injected accounts
```


## Best Practices

Based on analysis of the codebase, follow these practices:

### Do

- Use conventional commit format (feat:, fix:, etc.)
- Write tests using vitest
- Follow *.test.ts naming pattern
- Use kebab-case for file names
- Prefer named exports

### Don't

- Don't write vague commit messages
- Don't skip tests for new features
- Don't deviate from established patterns without discussion

---

*This skill was auto-generated by [ECC Tools](https://ecc.tools). Review and customize as needed for your team.*
