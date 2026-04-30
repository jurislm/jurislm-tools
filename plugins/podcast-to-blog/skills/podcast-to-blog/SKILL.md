---
name: podcast-to-blog
version: 1.0.0
description: >
  This skill should be used when the user says "podcast 轉文章",
  "幫我把這集 podcast 寫成文章", "podcast 逐字稿", "轉錄 podcast",
  "podcast to blog", "聽這集幫我寫筆記",
  or provides an Apple Podcasts URL and wants a blog post or transcript generated from it.
argument-hint: "<apple-podcasts-url>"
---

# Podcast to Blog — 完整工作流

將 Apple Podcasts 連結轉換為逐字稿，再生成高品質部落格文章，最後可存入 Notion。

## 前置需求檢查

在開始前，執行以下檢查：

```bash
python3 -m pip show openai-whisper >/dev/null 2>&1 && echo "Whisper OK" || echo "NEED_INSTALL"
```

若輸出 `NEED_INSTALL`，執行安裝：

```bash
pip install openai-whisper --break-system-packages
```

同時確認 `ffmpeg` 已安裝：

```bash
ffmpeg -version 2>/dev/null || echo "NEED_FFMPEG"
```

若輸出 `NEED_FFMPEG`，依作業系統安裝：`brew install ffmpeg`（macOS）或 `sudo apt-get install -y ffmpeg`（Ubuntu）。

## 工作流程

### Step 1：解析 Apple Podcasts URL 取得音檔

先找到 plugin 安裝的腳本目錄，再執行腳本下載音檔：

```bash
SCRIPT_DIR=$(find ~/.claude/plugins -path "*/podcast-to-blog/scripts" -type d 2>/dev/null | head -1)
if [ -z "$SCRIPT_DIR" ]; then
  echo "ERROR: 找不到 podcast-to-blog scripts，請確認 plugin 已正確安裝（/plugin install jurislm-tools@podcast-to-blog）"
  exit 1
fi
python3 "${SCRIPT_DIR}/fetch_podcast_audio.py" "<APPLE_PODCASTS_URL>" /tmp/podcast_audio.mp3
```

腳本會：
1. 從 Apple Podcasts URL 提取 podcast ID 和 episode ID
2. 呼叫 Apple iTunes Lookup API 取得 RSS Feed URL
3. 解析 RSS Feed 找到對應集數的音檔 enclosure URL
4. 下載音檔到指定路徑

如果腳本失敗，提示使用者手動提供音檔的直接下載 URL，然後用 `curl -L -o /tmp/podcast_audio.mp3 "<DIRECT_URL>"` 下載。

### Step 2：用 Whisper 轉錄

使用同一 `$SCRIPT_DIR`（步驟一已取得）執行轉錄腳本：

```bash
python3 "${SCRIPT_DIR}/transcribe.py" /tmp/podcast_audio.mp3 /tmp/podcast_transcript.txt --language zh --model medium
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

將完成的文章存為 Markdown 檔案至 `/tmp/podcast-blog-YYYYMMDD.md`。

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

## 模型選擇指引

Whisper 模型大小 vs 品質/速度：

| 模型 | 大小 | RAM | 速度 vs Real-time | 準確度 | 推薦場景 |
|------|------|-----|------------------|-------|---------|
| `tiny` | 39MB | 1GB | ~32x | 中文勉強可用 | 快速測試 |
| `base` | 74MB | 1GB | ~16x | 中文錯字多 | 不推薦中文 |
| `small` | 244MB | 2GB | ~6x | 中文可用 | 一般筆電 |
| `medium` | 769MB | 5GB | ~2x | 中文良好 | **預設推薦** |
| `large` | 1550MB | 10GB | ~1x | 中文最佳 | 重要內容 / 多語混雜 |

39 分鐘 podcast 在 M2 MacBook：tiny ~1min、small ~5min、medium ~10min、large ~30min。

## 文章品質檢查清單

生成文章後，自我審查：

- [ ] 標題是否吸引人？避免「XX 訪談筆記」「Podcast 心得」這類平淡標題
- [ ] 引言是否有 hook？讀者願意往下讀
- [ ] 段落是否過長？每段控制在 4-6 行內
- [ ] 是否有插入精彩原話 blockquote？至少 1-2 處
- [ ] 結尾是否留下思考？避免「以上就是這集 podcast 的內容」流水帳
- [ ] 是否避開贅詞？「我覺得」「就是說」「然後」這類口語雜訊
- [ ] 標題層級是否一致？只用 ## 作為主小節，### 為次小節

## Edge cases

- **Spotify / Google Podcasts URL**：fetch_podcast_audio.py 只支援 Apple Podcasts。若給其他平台，問使用者要 RSS feed URL 或直接 audio file URL。
- **付費 podcast / Patreon 限定**：無法自動下載，請使用者手動提供下載好的音檔路徑。
- **直播或正在更新的節目**：RSS feed 只列已發佈，最新一集可能尚未進 feed，等 30 分鐘後再試。
- **多語混雜（中英夾雜）**：`--language zh` 可能漏掉英文片段，改用 `--language auto` 並用 `large` 模型。
- **多人對談難分辨**：Whisper 不分辨講者，逐字稿會混在一起。寫文章時用「主持人」「來賓」抽象指代，不要強行標註人名。
- **超長節目（>2hr）**：先用 `ffmpeg -i input.mp3 -segment_time 1800 -f segment output_%03d.mp3` 切 30 分鐘片段，分批轉錄再合併。

## 錯誤處理

- **Apple Podcasts URL 解析失敗**：提示使用者確認 URL 正確，或手動提供 RSS Feed URL
- **音檔下載失敗**：可能是 CDN 限制，建議使用者手動下載後提供檔案路徑
- **Whisper 安裝失敗**：可能需要先安裝 Rust 編譯器 (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- **轉錄品質不佳**：建議換用更大的模型（medium → large）
- **記憶體不足**：建議使用較小的模型（medium → small → base）
- **ffmpeg 不存在**：macOS 用 `brew install ffmpeg`，Linux 用 `apt install ffmpeg`，Windows 用 `choco install ffmpeg`
