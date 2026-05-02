# Podcast to Blog Plugin Detail

## Purpose

描述 `podcast-to-blog` plugin 的設計內容，將 Apple Podcasts 連結轉換為逐字稿並生成繁體中文部落格文章。

## 產物

| 產物 | 路徑 | 說明 |
|------|------|------|
| `podcast-to-blog` skill | `plugins/podcast-to-blog/skills/podcast-to-blog/SKILL.md` | 執行邏輯（155 行） |
| `/podcast-to-blog` command | `plugins/podcast-to-blog/commands/podcast-to-blog.md` | 入口 command |
| `fetch_podcast_audio.py` | `plugins/podcast-to-blog/skills/podcast-to-blog/scripts/fetch_podcast_audio.py` | 音檔下載腳本（229 行） |
| `transcribe.py` | `plugins/podcast-to-blog/skills/podcast-to-blog/scripts/transcribe.py` | Whisper 轉錄腳本（122 行） |
| blog-style-guide reference | `plugins/podcast-to-blog/skills/podcast-to-blog/references/blog-style-guide.md` | 文章撰寫風格指引 |

## 執行流程

```
Apple Podcasts URL
  ↓ fetch_podcast_audio.py
    → 從 URL 提取 podcast ID / episode ID
    → 呼叫 Apple iTunes Lookup API 取得 RSS Feed URL
    → 解析 RSS Feed 找 audio enclosure URL
    → 下載音檔到 /tmp/podcast_audio.mp3
  ↓ transcribe.py（Whisper 本地轉錄）
    → 輸出 /tmp/transcript.txt（逐字稿）
  ↓ Claude 生成部落格文章
    → 繁體中文，台灣用語
    → 500-1500 字（依集數長度調整）
    → 格式：標題 + 前言 + H2 段落（3-5 個）+ 結語
```

## 外部依賴（Python 套件）

| 套件 | 用途 | 安裝方式 |
|------|------|---------|
| `openai-whisper` | 語音轉文字（本地執行） | `pip install openai-whisper --break-system-packages` |
| `ffmpeg`（系統工具） | 音檔格式轉換 | `brew install ffmpeg`（macOS）or `apt-get install -y ffmpeg` |

**前置需求檢查**（每次執行前必做）：
```bash
python3 -m pip show openai-whisper >/dev/null 2>&1 && echo "OK" || echo "NEED_INSTALL"
ffmpeg -version 2>/dev/null || echo "NEED_FFMPEG"
```

## 腳本位置解析

Plugin 安裝後，scripts 路徑會因安裝方式不同而改變。skill 使用 `find` 動態定位：
```bash
SCRIPT_DIR=$(find ~/.claude/plugins -path "*/podcast-to-blog/scripts" -type d 2>/dev/null | head -1)
```

找不到 `SCRIPT_DIR` 時，提示使用者確認 plugin 是否已安裝（`/plugin install jurislm-tools@podcast-to-blog`）。

## Fallback 路徑

若 `fetch_podcast_audio.py` 失敗（Apple API 限制、RSS 解析失敗等）：
1. 提示使用者手動提供音檔的直接下載 URL
2. 使用 `curl -L -o /tmp/podcast_audio.mp3 "<DIRECT_URL>"` 下載

## 觸發條件

使用者提供 Apple Podcasts URL 並說「podcast 轉文章」、「podcast 逐字稿」、「podcast to blog」或類似詞語時啟動。
