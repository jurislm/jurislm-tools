# ai-audio-analysis

用多重證據分析本地音檔、轉寫與歌詞差異，並評估目標受眾適配性。

## 安裝

```bash
claude plugin install ai-audio-analysis@jurislm-tools
```

## 內容

- `ai-audio-analysis` Skill：本地檔案身份、`ffprobe`／解碼、Whisper、訊號測量與 MiniMax Design 交叉核對。

## 使用邊界

Skill 會區分 `signal-derived`、`transcript-derived`、`model-inferred` 與 `unknown`，不把播放器畫面、嵌入歌詞或單一模型摘要當成已驗證的聽覺證據。使用 MiniMax Design 時需要 `minimax-design:minimax-design-video` 與 `computer-use:computer-use`。

## 來源

此 Skill 原始來源為 Bubble Planet Kids 的 `bubble-planet-audio` 套件，已整理至 [jurislm-tools](https://github.com/jurislm/jurislm-tools) marketplace。版本由 Release Please 管理。
