# Common Testing Mistakes

Anti-patterns to avoid when writing tests.

## ❌ Testing Implementation Details

```typescript
// Don't test internal state
expect(component.state.count).toBe(5)
```

## ✅ Test User-Visible Behavior

```typescript
expect(screen.getByText('Count: 5')).toBeInTheDocument()
```

Why: implementation can change while behavior stays the same. Behavioral tests survive refactors; implementation tests break needlessly.

## ❌ Brittle Selectors

```typescript
await page.click('.css-class-xyz')  // breaks when className changes
```

## ✅ Semantic Selectors

```typescript
await page.click('button:has-text("Submit")')
await page.click('[data-testid="submit-button"]')
await page.getByRole('button', { name: 'Submit' })
```

Order of preference:
1. Role + accessible name (`getByRole`)
2. Test ID (`data-testid`)
3. Text content (`has-text`)
4. CSS selectors (last resort)

## ❌ No Test Isolation

```typescript
// Tests depend on each other
test('creates user', () => { /* sets state */ })
test('updates same user', () => { /* depends on previous */ })
```

## ✅ Independent Tests

```typescript
test('creates user', () => {
  const user = createTestUser()
  // ...
})

test('updates user', () => {
  const user = createTestUser()  // own setup
  // ...
})
```

Each test sets up and tears down its own state.

## ❌ Asserting Too Little

```typescript
test('handles request', async () => {
  await api.handle(req)
  // Test passes but verifies nothing!
})
```

## ✅ Specific, Meaningful Assertions

```typescript
test('handles valid request returns 200 with data', async () => {
  const res = await api.handle(req)
  expect(res.status).toBe(200)
  expect(res.body.data).toHaveLength(3)
  expect(res.body.data[0]).toMatchObject({ id: expect.any(String) })
})
```

## ❌ Catching Errors that Hide Failures

```typescript
expect(x).toBeVisible().catch(() => {})  // Playwright: assertion errors swallowed
```

## ✅ Let Assertions Throw

```typescript
await expect(x).toBeVisible()
```

Or use `try/catch` deliberately when you need conditional logic, not to silence failures.

## ❌ Missing await on Async Matchers

```typescript
expect(button).toHaveClass('active')  // Playwright: returns promise unawaited
```

## ✅ Always await Async Matchers

```typescript
await expect(button).toHaveClass('active')
```

## ❌ Mocking Everything

When unit test mocks every dependency, it's basically testing the mock setup, not real code.

## ✅ Prefer Integration Tests with Real Dependencies

Use Testcontainers for DB, MSW for HTTP. Mock only external services with cost or rate limits (LLM APIs, payment, email).

## ❌ vi.clearAllMocks() vs vi.resetModules()

`vi.clearAllMocks()` only clears call records — module state persists. When testing env vars or module-level singletons, you need `vi.resetModules()` to actually re-initialize.

```typescript
beforeEach(() => {
  vi.resetModules()  // re-evaluate imports with fresh env
  process.env.NEW_FLAG = 'true'
})
```

## ❌ Implementation Refactor Without Updating Tests

When changing `fetch()` calls to a hook method (`useWatchlist().add()`):

- Old: tests mock global `fetch`
- New: tests must mock the hook's return value (`{ add: vi.fn(), refresh: vi.fn() }`)
- Forgetting → tests pass but assertions verify nothing real

## ❌ Testing Mocked Functions

```typescript
const mockFn = vi.fn()
mockFn('hello')
expect(mockFn).toHaveBeenCalledWith('hello')  // tautology
```

If the only assertion is on the mock, the test is testing the mock framework.

## Best Practices Checklist

1. **Write tests first** — TDD discipline
2. **One assert per test (or one logical concept)** — focused failures
3. **Descriptive test names** — `'returns 404 when user does not exist'` not `'test 1'`
4. **Arrange-Act-Assert structure** — clear separation
5. **Mock external dependencies only** — DB/HTTP can use real with containers
6. **Test edge cases** — null, undefined, empty array, max int, unicode
7. **Test error paths** — not just happy paths
8. **Keep tests fast** — unit tests <50ms each
9. **Clean up after tests** — no shared state leaking
10. **Review coverage report** — identify untested branches
