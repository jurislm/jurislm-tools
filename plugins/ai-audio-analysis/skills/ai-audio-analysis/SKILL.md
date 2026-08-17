---
name: ai-audio-analysis
description: Use when a local audio file must be understood, transcribed, lyric-checked, or evaluated for a target audience such as children ages 3–6.
---

# AI 音檔分析

## 核心契約

「AI 聽到音檔」必須指向同一個本地音檔的可追溯處理，不是播放器畫面、嵌入歌詞或單一模型回覆。每個結論都要標記為 `signal-derived`、`transcript-derived`、`model-inferred` 或 `unknown`。

**REQUIRED SUB-SKILL:** 使用 MiniMax Design 做音訊理解時，必須使用 `minimax-design:minimax-design-video`；每個 MiniMax Design UI 讀取或操作都必須使用 `computer-use:computer-use`。

## 固定流程

1. **鎖定分析對象。** 只接受已下載的本地音檔路徑。記錄絕對路徑、檔案大小、修改時間、SHA-256、格式、時長、取樣率、聲道與解碼結果。只有 Suno URL 或播放器頁面時，先使用 `suno-audio-download`，不能直接分析串流。
2. **確認音檔可讀。** 以 `ffprobe` 讀取實際音訊串流，以 `ffmpeg` 完整解碼到結尾。檔案不存在、大小不穩定、沒有音訊串流或解碼失敗時停止，狀態為 `AUDIO_NOT_VERIFIED`。
3. **建立本地轉寫。** 優先使用本機可用的 OpenAI Whisper／whisper.cpp 模型，不把 API key 或雲端 API 當成必要條件。轉寫必須保留時間戳、語言、模型與檔案身份；前奏、間奏、和聲、口白與結尾的空白或幻覺要單獨標記。嵌入歌詞只能是 `reference`，不能冒充 ASR 結果。
4. **做訊號分析。** 讀取時長、峰值、RMS／LUFS、削波或靜音；在有實際工具輸出時才報告 BPM、拍號、調性、頻譜或段落。估計值不能升格成測量值。
5. **取得獨立音訊理解。** 在 MiniMax Design 中以同一個檔案執行既有音訊分析與歌詞轉寫，先讀回檔名與時長。歌詞模式若要求 `total_duration`，必須提供實際時長；要看到 `mode=lyrics`、`provider=whisper`、時間戳或轉寫檔案等處理跡證，不能只接受 Agent 的摘要。這是讀取分析，不要改用 Music Generation、TTS、Music Cover 或 MV。
6. **交叉核對。** 逐段比較嵌入歌詞、本地 Whisper、MiniMax 轉寫與音檔時間戳，將每段分類為吻合、近似、衝突、漏字或不可判定。先報告差異，再下歌詞結論；不能用「大意相同」掩蓋關鍵字錯誤。
7. **評估目標受眾。** 若目標是三至六歲，分別檢查語言難度、重複性、可跟唱性、動作提示、節奏與能量、音量與刺耳段落、主題安全、口白／角色聲音與歌曲長度。兒童適配性是綜合判斷，不得只由 BPM 或「歡樂」標籤推導。
8. **輸出證據報告。** 依序列出音檔身份、實際轉寫、歌詞差異、訊號測量、MiniMax 結果、三至六歲評估、未解決限制與最終判斷。若任一關鍵證據缺失，使用 `PARTIAL` 或 `UNDETERMINED`，不可回報完整分析。

## 證據分層

| 類型 | 可以支持的內容 | 不能支持的內容 |
|---|---|---|
| `signal-derived` | 時長、聲道、取樣率、LUFS、峰值、解碼、工具實測節奏 | 歌詞意思、情緒、兒童喜好 |
| `transcript-derived` | 實際人聲的時間戳文字與信心差異 | 沒有轉寫跡證的完整歌詞保證 |
| `model-inferred` | 曲風、樂器、段落、氛圍、能量與可能適齡性 | 精確 BPM、調性或逐字歌詞真值 |
| `unknown` | 尚未測量、來源衝突或工具失敗的項目 | 任何肯定式結論 |

## 明確禁止的捷徑

- 不把播放器播放、Suno 頁面、檔案存在、嵌入歌詞或 MiniMax 一段泛化摘要當成「AI 已聽懂」。
- 不只使用一個轉寫來源就宣稱歌詞已核對；至少要把本地 ASR 與另一份可追溯來源並列。
- 不把「模型估計」改寫成測量事實，不把沒有時間戳的回覆改寫成音檔證據。
- 不使用 TTS 生成、角色聲音、Music Generation 或其他創作流程代替既有音檔分析。
- 不在未獲授權時修改正式 `source/` 素材；分析輸出與製作採用是兩個不同決定。

## 結果狀態

使用下列狀態之一：`VERIFIED`、`PARTIAL`、`UNDETERMINED`、`AUDIO_NOT_VERIFIED`、`TOOL_BLOCKED`。`VERIFIED` 只在本地檔案、解碼、實際轉寫、交叉核對與要求的受眾評估都有對應證據時使用。

## 常見錯誤

| 錯誤 | 修正 |
|---|---|
| 只讀到 Suno 的嵌入歌詞 | 把它標記為參考，重新對實際音檔做 ASR |
| MiniMax 說「這是一首歡樂兒歌」 | 保留為模型推論，回到轉寫、訊號與歌詞證據 |
| Whisper 在前奏產生樂器文字 | 標記 ASR 幻覺，不把它當成角色或人聲 |
| MiniMax 歌詞模式缺少時長而失敗 | 先讀取實際 `ffprobe` 時長，再重新提交讀取分析 |
| 音檔可播放就直接判定適合兒童 | 完整檢查內容、段落、音量、重複、可跟唱性與安全性 |
