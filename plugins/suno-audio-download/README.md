# suno-audio-download

透過 Suno 官方可見下載控制取得音檔，並以本地檔案證據確認下載結果與歌曲身份。

## 安裝

```bash
claude plugin install suno-audio-download@jurislm-tools
```

## 內容

- `suno-audio-download` Skill：建立 Downloads 基線、使用內建瀏覽器執行 `Download → MP3 Audio`，再以 `file`、`ffprobe` 與完整解碼驗證。

## 使用邊界

Skill 不從 CDN、串流網址或播放器擷取音訊，也不把點擊按鈕、HTTP 回應或舊同名檔當成下載完成證據。使用 Suno 頁面時需要 `browser:control-in-app-browser`。

## 來源

此 Skill 原始來源為 Bubble Planet Kids 的 `bubble-planet-audio` 套件，已整理至 [jurislm-tools](https://github.com/jurislm/jurislm-tools) marketplace。版本由 Release Please 管理。
