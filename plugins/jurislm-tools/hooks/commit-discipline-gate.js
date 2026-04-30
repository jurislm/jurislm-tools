#!/usr/bin/env node
/**
 * Commit Discipline Gate (PreToolUse hook for Bash → git commit)
 *
 * 目的：在 git commit 前強制 Claude 走過「commit 內容 + commit 後回報」雙層思考清單，
 * 同時防止兩個失敗模式：
 *   1. 動手前沒做全盤盤點（看到表面問題反射性 sed 替換 / 改字串，沒做設計層級判斷）
 *   2. Commit 後套模板偷渡選項（反射性列「等你指示 / archive / push」等未經情境檢查的選項）
 *
 * 對應 memory:
 * - feedback_thinking_discipline.md（任務啟動 5 維度盤點 + 完成事件不偷渡選項，雙層思考紀律）
 *
 * 行為：
 * - 偵測 Bash command 含 `git commit`（排除 --dry-run）
 * - 第一次：return decision=block + 3 個強制思考問題（涵蓋兩種失敗模式）
 * - 30 秒內 retry：自動放行
 *
 * State file：~/.claude/hook-state/commit-discipline.last（UNIX ms timestamp）
 */

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const RETRY_WINDOW_MS = 30_000;

function readStdin() {
  try {
    return fs.readFileSync(0, "utf-8");
  } catch {
    return "";
  }
}

function main() {
  const raw = readStdin();
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const command = input?.tool_input?.command ?? "";

  // 只攔 git commit（排除 dry-run）
  const isGitCommit = /\bgit\s+commit\b/.test(command) && !command.includes("--dry-run");
  if (!isGitCommit) {
    process.exit(0);
  }

  // State file：30 秒內 retry 自動放行
  const stateDir = path.join(os.homedir(), ".claude", "hook-state");
  fs.mkdirSync(stateDir, { recursive: true });
  const stateFile = path.join(stateDir, "commit-discipline.last");

  const now = Date.now();
  let lastBlock = 0;
  if (fs.existsSync(stateFile)) {
    const v = Number(fs.readFileSync(stateFile, "utf-8").trim());
    if (Number.isFinite(v)) lastBlock = v;
  }

  if (now - lastBlock < RETRY_WINDOW_MS) {
    try {
      fs.unlinkSync(stateFile);
    } catch {
      /* ignore */
    }
    process.exit(0);
  }

  fs.writeFileSync(stateFile, String(now));

  const reason = `[Commit Discipline Gate]
即將執行 git commit。在我放行 commit 之前，先在 chat 明確回答這 3 件事，涵蓋「commit 內容」與「commit 後回報」兩個層面：

1. **Commit 的內容是「符號層級替換」還是「設計層級判斷」？**
   如果這次改動是大量同類字串替換 / sed sweep / 同名 import 批次改 — 警訊：是不是看到表面問題反射性動手了？被改的字串/類型/設定是否從 SSOT（packages/llm-config / schema / config）衍生？SSOT 確認過與目標一致嗎？實案：把 \`gpt-5.4-mini\` 改成 \`gpt-4o-mini\` 是改字串；但主流程已 Claude-only，正確修法是「拔整個 OpenAI 路徑」非換字串。

2. **內容是否經過 5 維度盤點？**
   (1) 歷史決策（git log / archive changes / CLAUDE.md gotchas）
   (2) 當前 SSOT（packages/llm-config / schema / config / type）
   (3) 相關 active 提案（openspec/changes/*）
   (4) 提案邊界與時效（提案寫的時候假設 vs 現況有沒有 drift）
   (5) 內部一致性（主流程設計與被改物件是否對齊）
   任一維度發現 drift 應該先停下、不 commit。

3. **Commit 完成後的回報是否會偷渡選項？**
   「等你指示 / 接下來⋯⋯ / 你想⋯⋯嗎 / 要不要⋯⋯」這些句型隱含一個未經情境檢查的選項清單。檢查那個隱含清單裡每個選項在當前 context 是否合理；若有任一不合理，整個結尾句移除，停在事實。

回答完後重跑同樣的 git commit 指令即可（30 秒內 retry 自動放行）。
參考 memory：feedback_thinking_discipline.md`;

  process.stdout.write(JSON.stringify({ decision: "block", reason }));
  process.exit(2);
}

main();
