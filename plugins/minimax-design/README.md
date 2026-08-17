# MiniMax Design Plugin

這個 Plugin 引導 Agent 透過 OpenAI Computer Use 操作已登入的 MiniMax Design macOS App，涵蓋圖像、影片、Audio／TTS／Music Generation、Music Cover、既有音訊分析與轉寫、MV、Canvas、Asset Center、Skills、Premium Plugins 與 Jianying／CapCut 匯出流程。可用模型、控制項、點數與已安裝的 Skills／Plugins 以目前 UI 為準。

## 安裝

```bash
claude plugin install minimax-design@jurislm-tools
```

安裝後重新啟動或重新載入 Claude Code／Codex，讓 `minimax-design-video` Skill 出現；同時必須安裝並授權 `computer-use:computer-use` 以存取 MiniMax Design。

## 內容

- `skills/minimax-design-video/SKILL.md`：多模態執行、付費操作確認、任務監控與結果驗證契約。
- `skills/minimax-design-video/references/`：User Guide、Media Plan 模型／價格快照、H3 manual、來源清單與桌面流程。
- `skills/minimax-design-video/tests/`：壓力情境與 reference completeness gate。

這個 Plugin 不呼叫 MiniMax Open Platform API、本機 gateway route 或非官方 Bridge。既有音訊分析會分開保留具名訊號工具輸出、帶時間戳的 Whisper 轉寫、模型推論與未知結果；估計 BPM、Key、拍號不會升格為訊號測量。

## 付費操作邊界

草擬 prompt 與附加素材是準備工作；送出 MiniMax Design 生成、重試、升級、批次、MV 或付費 Canvas 動作前，Skill 會顯示新的操作卡並等待明確確認。所有匯出都需要 `確認匯出？`，即使目前 UI 顯示免費；目前 UI 未顯示費用時記錄 `cost: unavailable`。套件驗證不會送出媒體生成任務。

## 來源

此 Plugin 原始來源為 Bubble Planet Kids 的 `bubble-planet-kids` 套件，已整理至 [jurislm-tools](https://github.com/jurislm/jurislm-tools) marketplace。版本由 Release Please 管理；官方參考資料的修改日期與同步資訊保留於 `source-manifest.md`。
