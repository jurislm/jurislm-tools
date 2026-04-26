# Claude Code Hooks（jurislm meta-behavior gate）

JurisLM 自製的 Claude Code PreToolUse hook，用來約束 Claude 在開發過程中的行為失誤模式。屬於 `jt` plugin 的「**標準類別**」（與 `repo-standards` 同類，但作用對象是 Claude 互動行為而非 repo 配置）。

---

## `commit-discipline-gate.js`

**目的**：在 `git commit` 前強制 Claude 走過「commit 內容 + commit 後回報」雙層思考清單，**單一 hook 同時防止兩個失敗模式**：

1. **動手前沒做全盤盤點**：看到表面問題（如字串 drift）反射性 sed 替換 / 改字串，沒做設計層級判斷。實案：把 `gpt-5.4-mini` sed 改成 `gpt-4o-mini` 是改字串；但主流程已 Claude-only，正確修法是「拔整個 OpenAI 路徑」非換字串。
2. **Commit 後套模板偷渡選項**：commit 完成後反射性寫「未 push、未 archive，等你指示」，把不合理的選項偷渡進回報。

### 觸發條件

Bash command 含 `git commit`(排除 `--dry-run`)

### 行為

- 第一次：return `decision: block` + 注入 3 個強制思考問題
- 30 秒內 retry：自動放行（避免無限擋）

### 注入的 3 個問題

1. **Commit 內容是「符號層級替換」還是「設計層級判斷」？**
   大量同類字串替換 / sed sweep / 同名 import 批次改 = 警訊；被改的字串/類型/設定是否從 SSOT(`packages/llm-config` / schema / config) 衍生？SSOT 確認過嗎？

2. **內容是否經過 5 維度盤點？**
   (1) 歷史決策(git log / archive changes / CLAUDE.md gotchas)
   (2) 當前 SSOT(packages/llm-config / schema / config / type)
   (3) 相關 active 提案(openspec/changes/*)
   (4) 提案邊界與時效(寫提案時假設 vs 現況有沒有 drift)
   (5) 內部一致性(主流程設計與被改物件是否對齊)
   任一維度發現 drift 應停下、不 commit。

3. **Commit 完成後的回報是否會偷渡選項？**
   「等你指示 / 接下來⋯⋯ / 你想⋯⋯嗎 / 要不要⋯⋯」這些句型隱含未經情境檢查的選項清單。檢查每個選項在當前 context 是否合理；不合理的整個結尾移除，停在事實。

---

## 安裝

**啟用 jt plugin 即可，hook 由 plugin 系統自動載入**——不需要手動連結檔案、不需要手動編輯使用者 `~/.claude/settings.json`。

```bash
# 在 Claude Code 內啟用 jt plugin
/plugin enable jt
```

啟用後 Claude Code 會自動掃描本 plugin 的 `hooks/hooks.json`，把宣告的 PreToolUse Bash matcher 註冊進現行 session。

### `hooks.json` 宣告

本目錄內 `hooks.json` 用 Claude Code plugin 的標準 hook 宣告格式，透過 `$CLAUDE_PLUGIN_ROOT` 環境變數定位 hook script 實際路徑（plugin 安裝路徑是動態的）：

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PLUGIN_ROOT/hooks/commit-discipline-gate.js\""
          }
        ],
        "id": "pre:bash:commit-discipline-gate"
      }
    ]
  }
}
```

### 停用

```bash
/plugin disable jt   # 整個 plugin 停用，hook 一同停用
```

或在 `~/.claude/settings.json` 的 `enabledPlugins` 把 `jt@jurislm-tools` 設為 false。

---

## State 檔位置

- `~/.claude/hook-state/commit-discipline.last`(UNIX ms timestamp)

30 秒 retry window 透過讀寫此檔判斷。可手動刪除 reset。

(由 hook script 主動寫入；plugin 載入時不會自動建立)

---

## 對應 memory 文件

本 hook 是「下游 backup 防護」。上游主要防護是單一 memory 規則：

- `feedback_thinking_discipline.md`(任務啟動 5 維度盤點 + 完成事件不偷渡選項，雙層思考紀律)

Hook 是萬一 memory 規則漏掉時的最後一道。

---

## 設計沿革

- 2026-04-26 初版：拆成 `no-template-reports-gate.js`(攔 git commit) + `no-symbolic-sweep-gate.js`(攔 sed -i)，兩個 hook 並聯
- 2026-04-26 同日重構（A）：合併為單一 `commit-discipline-gate.js`，理由：兩種失敗模式的最佳交會點是 git commit
- 2026-04-26 同日重構（B）：移除「使用者自製 hook 集中地」(`~/.claude/hooks/` + `~/.claude/settings.json` 手動註冊)，改為 plugin auto-load 機制(`hooks/hooks.json` + `$CLAUDE_PLUGIN_ROOT`)，理由：plugin 機制本來就支援 hooks 自動載入(學 ECC plugin pattern)，使用者副本是冗餘設計
