# Podcast to Blog Plugin

將 Podcast 音檔自動轉錄為逐字稿，並生成高品質部落格文章，支援存入 Notion。

## 功能

- **音檔擷取**：從 Apple Podcasts URL 自動解析並下載音檔
- **語音轉錄**：使用本地開源 Whisper 模型，免費離線運行
- **文章生成**：根據逐字稿自動撰寫結構化部落格文章
- **Notion 整合**：可將成品直接存入 Notion workspace

## 系統需求

- Python 3.8+
- ffmpeg（音訊處理）
- 至少 4GB 可用記憶體（使用 medium 模型）
- 建議有 GPU 加速（非必要，CPU 也可運行）

## 安裝相依套件

```bash
# 安裝 Whisper
pip install openai-whisper --break-system-packages

# 安裝 ffmpeg（如尚未安裝）
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg
```

## 使用方式

在 Claude 對話中：

1. 提供 Apple Podcasts 連結，說「幫我把這集 podcast 寫成文章」
2. Claude 會自動執行完整工作流：下載 → 轉錄 → 寫文章
3. 可選擇是否存入 Notion

觸發詞範例：
- 「podcast 轉文章」
- 「幫我把這集 podcast 寫成文章」
- 「podcast 逐字稿」
- 「轉錄 podcast」
- 「聽這集幫我寫筆記」

## 元件

| 元件 | 說明 |
|------|------|
| `skills/podcast-to-blog/` | 主要技能：完整工作流 |
| `skills/podcast-to-blog/scripts/fetch_podcast_audio.py` | Apple Podcasts 音檔下載腳本 |
| `skills/podcast-to-blog/scripts/transcribe.py` | Whisper 轉錄腳本 |
| `skills/podcast-to-blog/references/blog-style-guide.md` | 部落格寫作風格指南 |

## Whisper 模型選擇

| 模型 | 大小 | 速度 | 品質 | 適用場景 |
|------|------|------|------|----------|
| tiny | 39MB | 最快 | 低 | 快速測試 |
| base | 74MB | 快 | 中 | 電腦效能較低 |
| small | 244MB | 中 | 中高 | 日常使用 |
| medium | 769MB | 慢 | 高 | **推薦（中文最佳平衡）** |
| large | 1.5GB | 最慢 | 最高 | 追求最高品質 |

## 注意事項

- 首次使用會自動下載 Whisper 模型（依選擇的大小而定）
- 39 分鐘的 podcast 使用 medium 模型約需 5-15 分鐘轉錄
- 音檔下載需要穩定的網路連線
- 部分 Podcast 可能限制 RSS Feed 存取，若失敗可手動提供音檔
