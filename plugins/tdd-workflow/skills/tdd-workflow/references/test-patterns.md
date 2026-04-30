# Test Patterns

Concrete code patterns for unit, integration, and E2E tests.

## Unit Test Pattern (Vitest / Jest)

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)

    fireEvent.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

## API Integration Test Pattern (Next.js)

```typescript
import { NextRequest } from 'next/server'
import { GET } from './route'

describe('GET /api/markets', () => {
  it('returns markets successfully', async () => {
    const request = new NextRequest('http://localhost/api/markets')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('validates query parameters', async () => {
    const request = new NextRequest('http://localhost/api/markets?limit=invalid')
    const response = await GET(request)

    expect(response.status).toBe(400)
  })

  it('handles database errors gracefully', async () => {
    const request = new NextRequest('http://localhost/api/markets')
    // Mock database failure, assert error path
  })
})
```

## E2E Test Pattern (Playwright)

```typescript
import { test, expect } from '@playwright/test'

test('user can search and filter markets', async ({ page }) => {
  await page.goto('/')
  await page.click('a[href="/markets"]')

  await expect(page.locator('h1')).toContainText('Markets')

  await page.fill('input[placeholder="Search markets"]', 'election')
  await page.waitForTimeout(600) // debounce

  const results = page.locator('[data-testid="market-card"]')
  await expect(results).toHaveCount(5, { timeout: 5000 })

  const firstResult = results.first()
  await expect(firstResult).toContainText('election', { ignoreCase: true })

  await page.click('button:has-text("Active")')
  await expect(results).toHaveCount(3)
})

test('user can create a new market', async ({ page }) => {
  await page.goto('/creator-dashboard')

  await page.fill('input[name="name"]', 'Test Market')
  await page.fill('textarea[name="description"]', 'Test description')
  await page.fill('input[name="endDate"]', '2025-12-31')
  await page.click('button[type="submit"]')

  await expect(page.locator('text=Market created successfully')).toBeVisible()
  await expect(page).toHaveURL(/\/markets\/test-market/)
})
```

## Test File Organization

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── Button.test.tsx          # Unit test colocated
│   └── MarketCard/
│       ├── MarketCard.tsx
│       └── MarketCard.test.tsx
├── app/
│   └── api/
│       └── markets/
│           ├── route.ts
│           └── route.test.ts         # Integration test
└── e2e/
    ├── markets.spec.ts               # E2E test (separate)
    ├── trading.spec.ts
    └── auth.spec.ts
```

## Mocking External Services

### Supabase / Database Client Mock

```typescript
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: [{ id: 1, name: 'Test Market' }],
          error: null
        }))
      }))
    }))
  }
}))
```

### Redis Mock

```typescript
vi.mock('@/lib/redis', () => ({
  searchMarketsByVector: vi.fn(() => Promise.resolve([
    { slug: 'test-market', similarity_score: 0.95 }
  ])),
  checkRedisHealth: vi.fn(() => Promise.resolve({ connected: true }))
}))
```

### OpenAI / LLM Mock

```typescript
vi.mock('@/lib/openai', () => ({
  generateEmbedding: vi.fn(() => Promise.resolve(
    new Array(1536).fill(0.1) // 1536-dim embedding
  ))
}))
```

### Prisma `$transaction` Mock

When code uses `prisma.$transaction(async (tx) => { ... })`:

```typescript
mockPrisma.$transaction.mockImplementation(async (cb) =>
  cb({ model: { method: vi.fn() } })
)
```

Direct mock on `mockPrisma.model.method` won't be hit inside `$transaction`.

## Coverage Configuration

### Vitest

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
})
```

### Jest

```json
{
  "jest": {
    "coverageThresholds": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

## CI Integration

```yaml
# .github/workflows/test.yml
- name: Run Tests
  run: bun run test --coverage
- name: Upload Coverage
  uses: codecov/codecov-action@v4
```

## Vitest 多 project 設定（Next.js 單元 + 整合 + E2E 分離）

```typescript
// vitest.config.ts
import { defineConfig, configDefaults } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
    projects: [
      {
        name: 'unit',
        test: {
          include: ['src/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        name: 'integration',
        test: {
          include: ['tests/integration/**/*.test.ts'],
          environment: 'node',
          setupFiles: ['tests/integration/setup.ts'],
        },
      },
    ],
  },
})
```

## Integration test with Testcontainers + MSW

```typescript
// tests/integration/setup.ts
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { setupServer } from 'msw/node'
import { handlers } from './msw-handlers'

let pgContainer: StartedPostgreSqlContainer
const mswServer = setupServer(...handlers)

beforeAll(async () => {
  pgContainer = await new PostgreSqlContainer('postgres:16-alpine').start()
  process.env.DATABASE_URL = pgContainer.getConnectionUri()
  mswServer.listen()
})

afterAll(async () => {
  mswServer.close()
  await pgContainer.stop()
})
```
