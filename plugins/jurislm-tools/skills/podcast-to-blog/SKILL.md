---
name: podcast-to-blog
description: >
  將 Podcast 轉成部落格文章的完整工作流。Use this skill when the user says
  "podcast 轉文章", "幫我把這集 podcast 寫成文章", "podcast 逐字稿",
  "轉錄 podcast", "podcast to blog", "聽這集幫我寫筆記",
  or provides an Apple Podcasts URL and wants a blog post or transcript generated from it.
metadata:
  version: "0.1.0"
  author: "Terry Chen"
---

# Podcast to Blog — 完整工作流

將 Apple Podcasts 連結轉換為逐字稿，再生成高品質部落格文章，最後可存入 Notion。

## 前置需求檢查

在開始前，執行以下檢查：

```bash
python3 -c "import whisper; print('Whisper OK')" 2>/dev/null || echo "NEED_INSTALL"
```

若輸出 `NEED_INSTALL`，執行安裝：

```bash
pip install openai-whisper --break-system-packages
```

同時確認 `ffmpeg` 已安裝：

```bash
ffmpeg -version 2>/dev/null || (apt-get update && apt-get install -y ffmpeg)
```

## 工作流程

### Step 1：解析 Apple Podcasts URL 取得音檔

執行 plugin 內附的 Python 腳本來解析 Apple Podcasts 連結並下載音檔：

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/podcast-to-blog/scripts/fetch_podcast_audio.py "<APPLE_PODCASTS_URL>" /tmp/podcast_audio.mp3
```

腳本會：
1. 從 Apple Podcasts URL 提取 podcast ID 和 episode ID
2. 呼叫 Apple iTunes Lookup API 取得 RSS Feed URL
3. 解析 RSS Feed 找到對應集數的音檔 enclosure URL
4. 下載音檔到指定路徑

如果腳本失敗，提示使用者手動提供音檔的直接下載 URL，然後用 `curl -L -o /tmp/podcast_audio.mp3 "<DIRECT_URL>"` 下載。

### Step 2：用 Whisper 轉錄

執行 plugin 內附的轉錄腳本：

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/podcast-to-blog/scripts/transcribe.py /tmp/podcast_audio.mp3 /tmp/podcast_transcript.txt --language zh --model medium
```

參數說明：
- `--language zh`：指定中文以提升辨識準確度
- `--model medium`：平衡品質與速度（可選 tiny/base/small/medium/large）
- 若使用者的電腦效能較差，建議降為 `small` 或 `base`

轉錄完成後，讀取 `/tmp/podcast_transcript.txt` 取得逐字稿全文。

**重要**：轉錄可能耗時數分鐘，視音檔長度和電腦效能而定。39 分鐘的 podcast 使用 medium 模型大約需要 5-15 分鐘。告知使用者預估時間。

### Step 3：生成部落格文章

根據逐字稿內容，以以下風格撰寫部落格文章：

**文章風格指引**（詳見 `references/blog-style-guide.md`）：

1. **標題**：吸引人、引發好奇的標題，避免平淡的「XX Podcast 筆記」
2. **引言**：用一個讀者能共鳴的問題或場景開場，建立閱讀動機
3. **主體**：提取 3-7 個最令人驚訝、反直覺或有啟發性的觀點，每個觀點作為一個小節
   - 每節有清晰的粗體小標題
   - 用短段落解釋概念，不只摘要而是加入分析
   - 如有精彩原話，用 blockquote 呈現
4. **結尾**：前瞻性的總結，留下一個發人深省的問題或強力收尾

語言：繁體中文（除非使用者指定其他語言）

將完成的文章存為 Markdown 檔案至 `/sessions/friendly-amazing-gates/mnt/outputs/podcast-blog-YYYYMMDD.md`。

### Step 4：存入 Notion（可選）

詢問使用者是否要存入 Notion。若是：

1. 使用 `notion-search` 工具搜尋使用者的 Notion workspace 中是否有部落格或文章相關的 database
2. 若找到合適的 database，使用 `notion-create-pages` 建立新頁面，將文章內容寫入
3. 若未找到，使用 `notion-create-pages` 在 workspace 根目錄建立新頁面

頁面內容使用 Notion Markdown 格式。

### Step 5：提供結果

向使用者呈現：
1. 逐字稿檔案連結（若使用者需要）
2. 部落格文章檔案連結
3. Notion 頁面連結（若有存入）

## 錯誤處理

- **Apple Podcasts URL 解析失敗**：提示使用者確認 URL 正確，或手動提供 RSS Feed URL
- **音檔下載失敗**：可能是 CDN 限制，建議使用者手動下載後提供檔案路徑
- **Whisper 安裝失敗**：可能需要先安裝 Rust 編譯器 (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- **轉錄品質不佳**：建議換用更大的模型（medium → large）
- **記憶體不足**：建議使用較小的模型（medium → small → base）
