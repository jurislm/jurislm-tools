# jt-flow

使用 OpenSpec、GitHub Flow、TDD 與 review gates 完整交付單一需求或依序處理 issue queue。

## 安裝

```bash
claude plugin install jt-flow@jurislm-tools
```

## Entry Skills

- `jt-flow`：單一需求的端到端交付流程。
- `jt-flow-all`：盤點、排序並依序交付多個 issues。

本 plugin 不提供 `/jt-flow` 或 `/jt-flow-all` slash commands；請以自然語言觸發對應 Skill。

## Dependencies

完整流程需要 OpenSpec repo-local `opsx:*` Skills，以及另行安裝的 `superpowers:*` Skills。

## Version

版本由根目錄 Release Please 設定集中管理，不得在 plugin manifest 手動修改。
