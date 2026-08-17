---
name: suno-audio-download
description: Use when a Suno share URL or song page must be downloaded through the signed-in in-app browser and the resulting audio file must be verified locally.
---

# Suno 音檔下載

## 核心契約

下載完成不是「播放器可以播放」，而是同時取得 Suno 官方下載動作、指定資料夾中的新本地檔案、可解碼的音訊，以及與歌曲頁相符的檔案身份。

**REQUIRED SUB-SKILL:** Use `browser:control-in-app-browser` for every Suno page read or UI action when the user requests the built-in browser.

## 固定流程

1. **建立基線。** 先讀取 `/Users/terrychen/Downloads` 的既有檔案清單、檔案大小與修改時間。既有同名檔不能直接當成這次下載結果。
2. **確認歌曲頁。** 在已登入的內建瀏覽器開啟分享 URL，等待導向完成，讀回歌曲標題、歌曲識別資訊與頁面狀態。登入、OTP、CAPTCHA 或權限阻擋時停止，不繞過安全門檻。
3. **只走官方控制。** 從歌曲頁可見的選單執行 `Download`，再選擇 `MP3 Audio`。把瀏覽器下載完成與目標檔案產生都讀回來。
4. **本地驗證。** 確認檔案位於指定資料夾、大小大於零且已穩定；用 `file`、`ffprobe` 與一次解碼檢查確認格式與音訊串流可讀。再以檔名、標題、時長或其他可取得的歌曲識別資訊比對來源頁。
5. **回報證據。** 回報來源 URL、導向後歌曲頁、檔案絕對路徑、格式、時長、大小與驗證結果。任一必要證據缺失時，狀態必須是未驗證或阻擋，不得回報下載完成。

## 明確禁止的替代路徑

- 不從頁面中的 CDN、音訊串流網址或網路請求直接抓檔。
- 不使用 `captureStream()`、`MediaRecorder`、螢幕錄音、外部下載器或自行轉檔代替 Suno 官方下載。
- 不把播放器播放、點擊過 `Download`、HTTP 回應、轉寫結果或 Downloads 中的舊檔當成下載完成證據。
- 不因時間壓力、同名檔或「檔案能播放」而跳過來源身份與本次新檔確認。

## 失敗狀態

使用下列狀態之一：`VERIFIED`、`AUTH_BLOCKED`、`OFFICIAL_DOWNLOAD_UNAVAILABLE`、`LOCAL_FILE_NOT_VERIFIED`、`IDENTITY_MISMATCH`。遇到下載失敗時最多重試一次官方下載控制；仍未取得完整證據就停止並保留實際狀態。

## 常見錯誤

| 錯誤 | 修正 |
|---|---|
| 只看到播放器正在播放 | 繼續找官方下載控制，並驗證本地檔案 |
| 下載資料夾已有同名 MP3 | 以下載前基線、修改時間、大小與歌曲身份分辨，不覆蓋證據 |
| 直接使用頁面媒體網址較快 | 仍須回到 `Download → MP3 Audio`，因為使用者要求的是官方下載流程 |
| 只有按鈕點擊結果 | 讀回瀏覽器下載狀態與本地檔案，否則只能回報未驗證 |
