# MiniMax Design 官方文件同步索引

同步日期：2026-08-16

本索引記錄本 Plugin 參考資料的來源、頁面修改日與章節覆蓋範圍。它是可重跑的 provenance record，不是目前 MiniMax Design UI、方案、模型 entitlement 或即時價格的替代品。

## 來源

| Reference | 官方來源 | 官方頁面修改日 | 本次同步日 |
| --- | --- | --- | --- |
| MiniMax Design User Guide（current） | <https://my.feishu.cn/wiki/VEoVwpfCKiTHvHkAGQ7cQJxCncf> | 2026-08-14 | 2026-08-16 |
| MiniMax Design User Guide（superseded baseline） | <https://my.feishu.cn/wiki/X3pGw8I5Gi6E1fkMqQpcP5ZBnHd> | 2026-08-10 | 2026-08-13 |
| MiniMax H3 模型使用手冊 | <https://vrfi1sk8a0.feishu.cn/wiki/FIWjwgL33ipnkekzk30crmKUnIh> | 2026-08-11 | 2026-08-13 |
| MiniMax Design Media Plan 模型參數與計費明細 | <https://ycn2jv5fww3x.feishu.cn/wiki/JY7PwkqvtiKl9dk1P9DcW9FWnrb?sheet=1c8YYE> | 08月15日（原頁面未顯示年份） | 2026-08-16 |

目前指南另外連到 MiniMax Design Media Plan 模型／計費表；本次已逐格讀取六個工作表，完整整理至 `media-plan-model-pricing.md`。該頁面的最新修改時間在畫面顯示為 `08月15日`，未顯示年份，因此 provenance 保留原始日期字串，不自行補年。

## User Guide 章節映射

`design-user-guide.md` 已依 2026-08-14 官方頁面順序整理以下章節：

1. 產品更新資訊與下載入口
2. MiniMax Design 定位、五大特點與和其他工具／OpenClaw 的比較
3. 5 分鐘教程影片與官方帳號
4. PART 1 快速上手：安裝／登入／積分、界面、新建項目、Agent 對話
5. Skills 與插件廣場：Skill 說明、查找、調用、自訂 Skill
6. 精品 Plugins：3D 導演台、全景圖、多宮格分鏡、重打光、多角度、水印工具
7. 畫布：無限畫布、圖片／視頻／音頻／文本節點、分鏡表、時間線與 Agent 自動編組／連線
8. 資產中心：建立、跨專案使用、`@` 調用與管理
9. 通用能力：檔案整理、Feishu 文件轉產品介紹海報／PPT、本機工作流協作
10. 模型列表和生成能力：自動選模／勾選限制與外部 Media Plan 模型／計費表；六個工作表完整內容見 `media-plan-model-pricing.md`
11. PART 2 行業案例：影視／短視頻、漫劇／動畫、品牌廣告／內容營銷、電商／社媒、TVC、MV、短劇
12. Skills 廣場案例：Promo Video、Path Guided Camera Move、Clip Export、Short Drama、Animal Podcast、Image Remix、Ad Idea
13. Q&A 常見問題章節
14. 模型能力和計費表格：預扣／失敗退款、TTS、Music Generation、Voice Clone、Voice Design、Agent 對話
15. 歡迎使用與回饋群入口
16. 產品熱點：Rap MV Skill 與 2026 年 7 月產品快訊

官方示例中的長篇 prompt、圖片、影片與使用者留言以能力摘要與可重用輸入／輸出契約表示，不把示例文字當成固定指令，也不把示例輸出當成目前任務證據。評論區包含變動中的使用者回饋，不同步個別帳號、評論或其未驗證說法。

## 本次同步差異

- 主來源由 2026-08-10 的舊頁面切換為 2026-08-14 的現行指南。
- 補入國內／海外下載與 Media Plan 入口、飛書／機器人教程連結、更新失敗提示與官方教程影片說明。
- 補入五大產品特點、Creation Code 比較維度、DaVinci／Adobe 本機工作流、Canvas／Asset Center 操作、`short-drama` Skill、Voice Clone／Voice Design 與 Rap MV 熱點。
- 完整納入 Media Plan 六個官方工作表：`【视频】模型参数`、`【视频】模型计费`、`【图片】模型参数`、`【图片】模型计费`、`【参数】音频模型`、`【音频】模型计费`，共 46 個影片計費資料列（來源列 2–47）、17 個圖片計費列、5 個音頻參數模型列與 3 個音頻計費列。
- 音頻參數表的 `MiniMax-2.6`／`ElevenLabs Music-v2` 與音頻計費表的 `MiniMax-3.0` 差異原樣保留；不替官方文件猜測版本對應。

## 模型命名契約

Reference 使用 canonical 名稱；UI alias 只作搜尋與讀回比對，不得把 alias 當成另一個模型：

| Canonical name | Observed UI aliases | Category |
| --- | --- | --- |
| Hailuo 2.3 Fast | Hailuo 2.3 Fast | Video |
| Kling V3 | Kling V3 | Video |
| Kling Lip-Sync | Lip-Sync | Video/Audio |
| Kling Video to Audio | Video-to-Audio | Video/Audio |
| Kling Video O1 | Kling O1 | Video |
| Kling V3 Omni (Video) | Kling V3 Omni | Video |
| Wan 2.6 | Wan 2.6 | Video |
| Kling V2-6 | Kling V2-6 | Video |
| Kling V2-Master | V2-Master | Video |
| Kling V2.5-Turbo | V2.5-Turbo | Video |

If the current UI shows a name outside this mapping, preserve the exact UI
string and mark the canonical mapping `UNKNOWN` until the source manifest is
updated; never silently normalize it.

## H3 手冊章節映射

`h3-manual.md` 已覆蓋官方頁面下列章節：

1. 模型定位
2. 模型功能信息：輸出時長、畫幅、解析度、幀率、原生聲音、輸入格式、大小與 prompt 限制
3. 模型亮點能力與示例：商用級多場景內容生成（1.1–1.9）
4. 原生多模態理解與生成（2.1–2.3）
5. 全能精准编辑与修改（3.1–3.4）
6. 如何更好地使用 H3：提示詞公式、四要素、鏡頭拆解、三類生成模式、常見陷阱、風格示意、最佳方式

## Reference target files

每個同步 reference 都有明確的本機 target，完整性測試會逐一確認這些檔案存在：

- `references/design-user-guide.md`
- `references/h3-manual.md`
- `references/desktop-workflow.md`
- `references/source-manifest.md`
- `references/media-plan-model-pricing.md`

每次更新若發現來源章節、模型表、價格或入口變化，先更新本索引與 reference，再由 MiniMax Design 當前 UI 讀回決定是否可執行。
