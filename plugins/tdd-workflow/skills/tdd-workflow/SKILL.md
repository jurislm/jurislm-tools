---
name: tdd-workflow
description: >
  This skill should be used when the user is writing new features, fixing bugs, or
  refactoring code, or asks to "write tests first", "follow TDD", "use TDD workflow",
  "RED GREEN REFACTOR", "improve test coverage", "set up TDD", "TDD 開發", "寫測試先行",
  "改善測試覆蓋率". Enforces test-driven development with 80%+ coverage including
  unit, integration, and E2E tests.
---

# Test-Driven Development Workflow

This skill ensures all code development follows TDD principles with comprehensive test coverage.

## When to Activate

- Writing new features or functionality
- Fixing bugs or issues
- Refactoring existing code
- Adding API endpoints
- Creating new components

## Self-Determination: Which Workflow Type Applies?

**Before starting**, classify the task by answering these questions:

| Signal | Workflow Type |
|--------|--------------|
| No existing tests, adding new behavior | → **New Feature TDD** |
| Bug exists, no reproducer test yet | → **Bug Fix TDD** |
| Behavior stays the same, only implementation changes (e.g., swapping libraries, renaming, restructuring) | → **Refactor TDD** |

### New Feature TDD
Write tests from scratch → confirm RED → implement → GREEN → refactor.
Follow the standard [TDD Workflow Steps](#tdd-workflow-steps) below.

### Bug Fix TDD
Write a reproducer test for the bug → confirm RED (bug is exposed) → fix → GREEN → add edge case tests.
Follow the standard [TDD Workflow Steps](#tdd-workflow-steps) below, where "Step 2: Generate Test Cases" targets the specific bug scenario.

### Refactor TDD
Existing tests represent the **behavioral contract** — they must survive the refactor.

**Key rule**: Existing tests are never deleted unless they test implementation details (e.g., how Hono routes are assembled), not behavior (e.g., what HTTP response is returned).

**Correct order for each unit being refactored:**

```
1. Classify existing tests:
   - Tests checking BEHAVIOR (HTTP status, response body, side effects) → UPDATE to new interface
   - Tests checking IMPLEMENTATION DETAILS (how a library is wired up) → DELETE

2. Update behavioral tests to use the new interface → confirm RED
   (tests now reference code that doesn't exist yet)

3. Implement the new code → confirm GREEN
   (same behavioral assertions pass with new implementation)

4. Delete implementation-detail tests that no longer apply
```

**Never**: create all new implementations first, then update tests afterward.
This breaks the safety net — you lose the guarantee that the new code satisfies the same behavioral contract.

## Core Principles

### 1. Tests BEFORE Code
ALWAYS write tests first, then implement code to make tests pass.

### 2. Coverage Requirements
- Minimum 80% coverage (unit + integration + E2E)
- All edge cases covered
- Error scenarios tested
- Boundary conditions verified

### 3. Test Types

#### Unit Tests
- Individual functions and utilities
- Component logic
- Pure functions
- Helpers and utilities

#### Integration Tests
- API endpoints
- Database operations
- Service interactions
- External API calls

#### E2E Tests (Playwright)
- Critical user flows
- Complete workflows
- Browser automation
- UI interactions

### 4. Git Checkpoints
- If the repository is under Git, create a checkpoint commit after each TDD stage
- Do not squash or rewrite these checkpoint commits until the workflow is complete
- Each checkpoint commit message must describe the stage and the exact evidence captured
- Count only commits created on the current active branch for the current task
- Do not treat commits from other branches, earlier unrelated work, or distant branch history as valid checkpoint evidence
- Before treating a checkpoint as satisfied, verify that the commit is reachable from the current `HEAD` on the active branch and belongs to the current task sequence
- The preferred compact workflow is:
  - one commit for failing test added and RED validated
  - one commit for minimal fix applied and GREEN validated
  - one optional commit for refactor complete
- Separate evidence-only commits are not required if the test commit clearly corresponds to RED and the fix commit clearly corresponds to GREEN

## TDD Workflow Steps

### Step 1: Write User Journeys
```
As a [role], I want to [action], so that [benefit]

Example:
As a user, I want to search for markets semantically,
so that I can find relevant markets even without exact keywords.
```

### Step 2: Generate Test Cases
For each user journey, create comprehensive test cases:

```typescript
describe('Semantic Search', () => {
  it('returns relevant markets for query', async () => {
    // Test implementation
  })

  it('handles empty query gracefully', async () => {
    // Test edge case
  })

  it('falls back to substring search when Redis unavailable', async () => {
    // Test fallback behavior
  })

  it('sorts results by similarity score', async () => {
    // Test sorting logic
  })
})
```

### Step 3: Run Tests (They Should Fail)
```bash
npm test
# Tests should fail - we haven't implemented yet
```

This step is mandatory and is the RED gate for all production changes.

Before modifying business logic or other production code, verify a valid RED state via one of these paths:
- Runtime RED:
  - The relevant test target compiles successfully
  - The new or changed test is actually executed
  - The result is RED
- Compile-time RED:
  - The new test newly instantiates, references, or exercises the buggy code path
  - The compile failure is itself the intended RED signal
- In either case, the failure is caused by the intended business-logic bug, undefined behavior, or missing implementation
- The failure is not caused only by unrelated syntax errors, broken test setup, missing dependencies, or unrelated regressions

A test that was only written but not compiled and executed does not count as RED.

Do not edit production code until this RED state is confirmed.

If the repository is under Git, create a checkpoint commit immediately after this stage is validated.
Recommended commit message format:
- `test: add reproducer for <feature or bug>`
- This commit may also serve as the RED validation checkpoint if the reproducer was compiled and executed and failed for the intended reason
- Verify that this checkpoint commit is on the current active branch before continuing

### Step 4: Implement Code
Write minimal code to make tests pass:

```typescript
// Implementation guided by tests
export async function searchMarkets(query: string) {
  // Implementation here
}
```

If the repository is under Git, stage the minimal fix now but defer the checkpoint commit until GREEN is validated in Step 5.

### Step 5: Run Tests Again
```bash
npm test
# Tests should now pass
```

Rerun the same relevant test target after the fix and confirm the previously failing test is now GREEN.

Refactor only after a valid GREEN result is confirmed.

If the repository is under Git, create a checkpoint commit immediately after GREEN is validated.
Recommended commit message format:
- `fix: <feature or bug>`
- The fix commit may also serve as the GREEN validation checkpoint if the same relevant test target was rerun and passed
- Verify that this checkpoint commit is on the current active branch before continuing

### Step 6: Refactor
Improve code quality while keeping tests green:
- Remove duplication
- Improve naming
- Optimize performance
- Enhance readability

If the repository is under Git, create a checkpoint commit immediately after refactoring is complete and tests remain green.
Recommended commit message format:
- `refactor: clean up after <feature or bug> implementation`
- Verify that this checkpoint commit is on the current active branch before considering the TDD cycle complete

### Step 7: Verify Coverage
```bash
npm run test:coverage
# Verify 80%+ coverage achieved
```

## Reference resources

For concrete code patterns and anti-patterns, consult:

- **`references/test-patterns.md`** — Vitest/Jest unit, Next.js API integration, Playwright E2E patterns; mocking Supabase/Redis/OpenAI/Prisma; Testcontainers + MSW setup
- **`references/common-mistakes.md`** — Anti-patterns to avoid (testing implementation details, brittle selectors, missing await, etc.) and a 10-point best-practices checklist

## Continuous Testing

```bash
bun run test --watch        # Watch mode during development
bun run test --coverage     # Coverage report
```

CI integration:

```yaml
# .github/workflows/test.yml
- run: bun run test --coverage
- uses: codecov/codecov-action@v4
```

## Success Metrics

- 80%+ code coverage achieved
- All tests passing (green)
- No skipped or disabled tests
- Fast test execution (< 30s for unit tests)
- E2E tests cover critical user flows
- Tests catch bugs before production

---

**Remember**: Tests are not optional. They are the safety net that enables confident refactoring, rapid development, and production reliability.
