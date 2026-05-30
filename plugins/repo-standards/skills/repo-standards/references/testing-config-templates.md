# 測試設定模板

## 整合測試（Next.js repo）

整合測試驗證 **Route Handlers 與資料庫之間的互動**（狀態碼、資料結構、錯誤路徑），不包含頁面層級（Server Components、完整渲染）——頁面由 Playwright E2E 覆蓋。

**測試方式**：直接 import handler 函式，傳入標準 `Request` 物件呼叫，不需啟動完整 Next.js server。

**外部依賴處理**：

| 依賴類型 | 處理方式 | 原因 |
|---------|---------|------|
| 資料庫 | **Testcontainers**（Docker 隔離容器） | 不應 mock，確保測試資料乾淨可重複 |
| 外部 HTTP（Anthropic API 等） | **MSW** 攔截 | 避免真實費用與網路不穩 |

### vitest.config.ts — 多 project 設定（Next.js repo，單元 + 整合分離）

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    exclude: ['**/node_modules/**', '.worktrees/**'],
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

### 安裝整合測試套件

```bash
bun add -d @testcontainers/postgresql msw
# MySQL: @testcontainers/mysql
# Generic: testcontainers
```
