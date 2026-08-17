# MiniMax Design User Guide：完整結構化同步摘要

整理日期：2026-08-16

主要來源：[MiniMax Design User Guide](https://my.feishu.cn/wiki/VEoVwpfCKiTHvHkAGQ7cQJxCncf)

相關來源：[MiniMax H3 模型使用手冊](https://vrfi1sk8a0.feishu.cn/wiki/FIWjwgL33ipnkekzk30crmKUnIh)

官方頁面修改時間：2026-08-14。這是給 Agent 使用的完整章節結構化摘要，不是目前介面的替代品。來源章節映射見 `source-manifest.md`；官方長篇 prompt、圖片、影片與留言只做能力摘要，不複製成固定指令或外部指令。方案、可用模型、費用、按鈕、Skill 與 Plugin 都可能更新；每次任務都必須先讀取目前 MiniMax Design 畫面，並以畫面實際讀回為準。文件中的價格與能力只可作為核對線索，不能當成即時報價或自動授權。

## 0. What's New

2026-08-14 的官方頁面更新摘要：

- MiniMax Hub 正式更名為 MiniMax Design。
- 免費使用 credits 與年方案促銷延長至 8 月 15 日；頁面宣稱在該日期前購買年方案可享下一年 H3 生成 8 折。這是文件快照中的促銷條款，不代表目前仍有效；執行前仍要讀取目前 UI。
- Project Library 升級為主導航，可建立／管理本機專案、查看專案詳情、整理 creations；常用專案可釘選，並提供 sample project 與逐步導覽。
- 新增 anime game PV、brand visual shorts、dynamic music videos、educational content studios、kinetic typography packages、TD tracking-style videos 等創作能力。
- Settings 支援帳戶刪除申請；完成安全驗證後可提交刪除。
- 持續修正已知問題以改善穩定性與使用體驗。
- H3 已上線，官方定位為原生多模態理解與生成、精準多模態編輯控制及商用級內容製作。
- 頁面新增國內版與海外版下載入口、Design 教程、H3 使用手冊，以及飛書／機器人接入教程的連結。
- 頁面提示線上更新失敗時可從官網下載最新版本手動更新；這是文件提示，不代表目前 App 的更新狀態。

## 0.1 What is MiniMax Hub／MiniMax Design

MiniMax Design 是在 macOS／Windows 執行的多模態 Agent。使用者以自然語言描述目標，Agent 可使用圖片、影片、音訊與文字模型，讀取本機檔案、網頁／社群連結，管理本機資料夾，並把成品送到剪映／DaVinci／Adobe。它不只是單一圖片或影片生成器，而是把研究、腳本、分鏡、素材生成、工作流與交付放在同一工作區。

官方定位的五個核心特點是：全鏈路生產、Agent 智能編排、Skill 技能庫、Memory 記憶，以及打通本地工作流。模型、Canvas、Skill 與 Plugin 的實際可用性仍要以當前 App 讀回。

## 1. 產品定位與能力範圍

MiniMax Design 是在 macOS／Windows 執行的多模態 Agent。使用者以自然語言描述目標，Agent 可協調圖片、影片、音訊與文字模型，也可讀取本機檔案、網頁與社群連結，並和剪輯軟體協作。

官方概覽列出的核心能力：

- 端到端製作：研究、腳本、分鏡、圖片、影片、音訊與交付在同一工作區，可並行多個專案。
- Agent-first：Agent 依任務規劃與執行；使用者仍可在模型控制中限制可用模型。
- Skills：把工作流、提示詞、專業判斷與美學標準封裝成可重用 Skill；Skill Square 有 100+ 項能力與社群 Plugin。
- Memory：記住使用者偏好，使後續輸出逐漸貼近使用者風格。
- 本機整合：可讀取 PDF／Word、本機資料夾與素材，並把成品送入剪映／DaVinci／Adobe。

官方比較頁以以下維度比較 MiniMax Design、其他 AI 創作工具與 OpenClaw：

- Creation Code：把文字調研、多模態製作與無限 Canvas 統一在同一平台。
- 多模態內容創作：一站式支援圖片、影片、音訊與文字，多模型由 Agent 依任務調度。
- AI Agent：依需求規劃與執行，不必手動抽卡或手動串接工作流。
- Canvas 與工作流：支援多媒體展示、插件、超清／去字幕等操作，Agent 可自動編組與連線，也可由使用者手動編輯。
- 更廣泛的通用能力：Skill 可沉澱認知、經驗、流程與審美，並可協同本機文件與剪輯軟體。

## 2. 安裝、登入與方案

- 下載入口：國內版 <https://design.minimaxi.com/>；海外版 <https://design.minimax.io/>。兩版能力相同，但登入會跳轉至不同網頁。
- 支援 Windows、macOS Apple Silicon、macOS Intel。
- MiniMax Design 有專屬 Media Plan；既有 Hailuo 使用者可依官方轉移指南選擇轉移 credits。
- Media Plan 入口：<https://design.minimaxi.com/media-plan/subscribe>；文件要求在 Design 端內開啟以正確登入。
- 登入後主介面包含左側 Project Library／檔案／Skills & Plugins／Asset Center，以及中央／右側 Agent 與 Canvas 創作區。
- Settings 可查看帳戶資訊；若要刪除帳戶，需完成安全驗證後提交刪除申請。這是帳戶設定動作，不是生成授權。
- 方案、促銷、H3 折扣、credits 轉移與保留期限可能改變；不要從舊文件或使用者留言推定目前帳戶權益。
- 需要帳戶、方案或付款狀態時，只讀取目前 App／文件顯示內容；不要求或保存密碼、Cookie、OTP、API key。
- 文件連結的 H3 手冊為 <https://vrfi1sk8a0.feishu.cn/wiki/FIWjwgL33ipnkekzk30crmKUnIh>；飛書／機器人接入教程為 <https://my.feishu.cn/wiki/OAmLwbUOsiGOfSk8sB8c3klinPd>。本 Plugin 僅同步本頁的產品內容，不把未同步的外部教程當成已驗證操作契約。

### 2.1 帳戶方案、餘額與 entitlement 的分離

帳戶面板只能作為欄位關係的測試素材，不能把真實帳戶名稱、UID、餘額、到期日或扣點紀錄寫入 reference。合成 fixture 可使用 `subscription_status=canceled`、`expiry=<date>`、`total=<total>`、`subscription=<subscription>`、`recharge=0`、`gifted=0` 與 `<model>`／`<timestamp>`，但不得保留可回溯到特定使用者的值。

這些欄位只代表某次 UI 讀回的狀態，不是目前有效方案或模型權限的證明，也不應保存使用者 UID。Agent 每次執行都必須重新讀回：

- subscription status 與 expiry window；
- total credits 與 subscription／recharge／gifted 等可見 bucket；
- 目標媒體類別、模型是否可選及任何 plan／entitlement 限制；
- 目前 UI 顯示的成本與扣款方式。

`credits_available`、`subscription_active`、適用的 `model_entitled`／`export_entitled` 與 `cost_visible` 是分開欄位。取消方案但仍有非零餘額時，不能直接推論「仍可使用所有模型」，也不能直接推論「餘額完全不可用」；若 status、expiry、bucket 可用性或本次媒體的 model entitlement 無法現讀且一致，應停在 `VALIDATE`，付費匯出則改核對其 export permission，不得顯示付費確認或 Send。若只有成本欄位未顯示，記錄 `cost: unavailable`，在其餘適用帳戶與 entitlement 證據一致時仍可建立卡片並等待確認。

原始餘額、到期日與 bucket 數值只可在當次 preflight 與卡後 fresh readback 的暫存狀態中比較；付費卡、draft fingerprint、reference、log 或輸出 artifact 只能保存 `subscription_state`、`expiry_window`、`bucket_availability`、適用的 `model_entitled`／`action_entitled`／`export_entitled` 與 `cost_visible` 等 redacted account-preflight 欄位。

## 3. 介面與專案工作區

### 3.1 三個主要區域

- 中央／右側：創作區，可和 Agent 對話並操作 Canvas。
- 左側：Project Library、專案檔案、Skills & Plugins、Asset Center。
- Canvas：顯示媒體節點與工作流；Agent 可理解使用者在畫布上的操作。

### 3.2 建立專案

- 從聊天框直接輸入第一個任務可建立新專案。
- 可建立空白專案，手動排列素材與節點。
- 本機檔案可拖到聊天框、用 Add 選取、拖到左側專案區，或直接拖到 Canvas。
- 專案工作區包含資料夾、Asset Center、Skills 與 Plugins。
- 切換專案是導航，不代表內容、對話或素材已完整載入；切換後要讀回專案名稱、對話、workspace URL 與現有草稿。

### 3.3 Agent Conversation

Agent 可讀取檔案、網頁／社群連結，並行多個 session，執行電腦可完成的工作。模型控制有自動選模與手動限制範圍的能力；若使用者要自己選模，開啟 chat bar 的 Model 選項並切換 Ask 模式，讓 Agent 在選模前確認。

任何對話內的付費生成都要另外走草稿、付費操作卡、使用者確認與一次送出流程；Agent 回覆「已生成」不是結果證據。

### 3.4 Agent Conversation & General Operations

- Reference files 可包含 txt、Word、Markdown、PDF、Excel，以及圖片、音訊與影片；來源可以是本機檔案、Canvas 或左側 sidebar。
- 可從 Canvas 多選素材批次加入對話，或從 sidebar 直接拖入；也可直接傳送網頁／社群 URL 讓 Agent 讀取。
- 可請 Agent 研究題目並產生 reference material；可建立新 session、查看與搜尋對話歷史。
- Agent 可依使用者命名規則重新命名、分類、整理本機檔案，並把資產送進 CapCut 或其他本機 App；記憶功能則可在使用者開啟後保存創作偏好。
- 官方示例把文件研究、產品介紹海報／PPT、角色與場景素材、短片、MV、檔案整理及剪輯交付串成同一工作流；這些是能力展示，不是對每個帳戶的可用性承諾。
- 使用者可在 Model 選項選擇自動、Ask 或限制可用模型；本 Plugin 不把 Ask／Auto 的畫面文字當作已鎖定模型，送出前仍要讀回實際供應商與模型。

### 3.5 官方教程影片

- 文件附有「MiniMax Hub 教程－中文」新手村影片，片長 06:36；影片以 1.0.0 版本錄製，頁面提醒部分模組已更新，使用時仍應下載最新版本。
- 官方帳號入口包含微信公眾號／視頻號／抖音號「海螺 AI－MiniMaxDesign」與 Bilibili「海螺 AI 官方」。影片與圖片資產不複製進 Plugin，只保留可重用的功能與版本提示。

## 4. Skills

### 4.1 Skill 定義

Skill 是 Agent 遵循的固定、可重用創作工作流，可是產業標準／技術流程，也可是品牌視覺或美學規範。例：短劇的 script → storyboard → characters／scenes → image-to-video → dubbing／scoring → final composite。

### 4.2 Skill Square

- 在專案左側第二頁開啟 Skills & Plugins，可瀏覽描述並逐一啟用／停用。
- Skill Square 有 100+ 實務 Skill，包括 Promo Video、Character Storyboard、Path-Guided Camera Move 等。
- 當前頁面列出的 Skill 類型還包括宣傳影片、人物分鏡、線控軌跡運鏡，以及電商批量出圖／出視頻、品牌 TVC、投放素材、短劇／漫劇工作流。
- 開啟 Skill 詳情可看到 `SKILL.md` 與 `meta.yaml`。前者是 Agent instruction manual，後者是 Skill 的 ID、類型與使用情境。
- 使用方法：Skill Square／My Skills 的 Try in Chat；在聊天輸入 `/` 選 Skill；或讓已啟用的 Skill 依任務自動觸發。
- 已保存的 Skill 可在 My Tools 與 `/` 選單中找到。
- 文件提醒：自己建立的 Skill 更貼近個人工作流；預設 Skill 僅作參考。即使不使用 Skill，Agent 仍可完成任務，Skill 不等於 Agent 能力或產品能力。

### 4.3 建立自訂 Skill

1. 直接描述需求，讓 Agent 建立後檢閱並保存。
2. 完成一段工作流後輸入 `/skill-creator`，或請 Agent 將對話摘要成 Skill。
3. 使用既有 Skill 時途中調整，完成後要求「save this as my own Skill」。
4. 上傳經驗文件、筆記或其他 `SKILL.md`，讓 Agent 依材料生成 Skill。
5. 建立後使用 `/skill-reviewer` 檢查品質與一致性。

## 5. Premium Plugins：Multi-Angle、Multi-Panel Storyboards、Relighting、AI Editing 與更多能力

在任意 Canvas 開啟左側 Skills & Plugins → Plugins → 按 `+` 加入 Canvas。官方列出的 Plugin 包含：

- 3D Director Stage：放置多角色、調整相機與姿勢，建立分鏡參考。
- Panorama Viewer：鎖定 360° 場景，可拖曳環看、滾輪縮放、自動旋轉。
- Multi-Panel Storyboard：輸入劇情摘要或腳本，產生具節奏的多鏡頭分鏡版面。
- Relight Studio：上傳圖片或影片，產生新的光線氛圍與電影光效。
- Multi-Angle Generator：依同一主體產生不同相機角度與景別。
- Watermark Tool：批次加入浮水印、Logo 與著作權資訊到圖片與影片。
- AI Editing：官方章節標題列出的 AI 編輯能力總稱；具體 Plugin 名稱、入口與是否已安裝仍要以目前 Plugins tab 讀回。

Plugin 可用性與 UI 入口以目前 App 為準；不要因文件列出某 Plugin 就假設它已安裝或已掛入目前 Canvas。

## 6. Canvas 與 Asset Center

### 6.1 Canvas

- Canvas 是可無限延伸的工作區；使用者可手動新增節點、填寫提示詞並連線。
- 基礎節點：image、video、audio、text。
- 進階節點：storyboard table、editing timeline。
- 可手動建立節點、輸入 prompt、連接節點，產生圖片與影片。
- Agentic Canvas 能自動分組生成素材、自動依素材關係建立 reference links，並理解使用者在 Canvas 上的操作。

### 6.2 Asset Center

- 從 Canvas 節點選 Save as Asset，輸入名稱與分類即可建立資產。
- Asset Library 可跨專案重用已保存資產。
- 在 Agent 對話輸入 `@`，從 Assets 分頁選取資產。
- Asset Center 可集中檢視與管理所有資產。
- 每個素材在付費生成前都要記錄 UI 檔名、類型、數量與角色；「已上傳」不等於模型知道用途。

## 7. 模型與生成能力

### 7.1 選模規則

Agent 預設自動選擇合適模型；使用者可在 Model 選單用 checkbox 限制模型範圍。模型清單與名稱會漂移，不能把 Auto 當作已鎖定的供應商，也不能把歷史模型名當成目前可用模型。送出前必須讀回：媒體類別、實際模型、模式、時長／比例／解析度、音訊設定、素材與費用。

### 7.2 H3 影片能力

完整限制與提示詞結構見 `h3-manual.md`。重點：

- MiniMax H3 影片單次 4–15 秒、24 FPS、原生雙聲道音訊、prompt 最多 7000 字元。
- 畫幅：21:9、16:9、4:3、1:1、3:4、9:16；首／尾幀跟隨輸入圖比例。
- 解析度路徑：768p 可升級 1440p；官方建議 1440p／2K；Design UI 曾標示 `MiniMax H3 New 2K 4-15s`。
- 首／尾幀：0–2 張圖片，尺寸 256–5760 px，比例 5:2–2:5。
- 全能參考：圖片最多 9 張；影片最多 3 段，每段 2–15 秒、總長最多 15 秒；音訊最多 3 段，每段 2–15 秒且必須搭配圖片或影片；混合檔案最多 12 個。
- 單檔限制：影片 50 MB、圖片 30 MB、音訊 15 MB；格式為 H.264／H.265、JPG／JPEG／PNG／WEBP／HEIC／HEIF、WAV／MP3。
- 音訊不能是全能參考的唯一輸入；沒有媒體輸入才是文生影片。

### 7.3 影片模型（User Guide 價格表快照）

2026-08-14 的主指南在「模型列表和生成能力」章節明確記錄：Agent 會依任務自動選擇模型，也可透過勾選限制可用模型範圍；完整模型與 Media Plan 計費連到外部表格 <https://ycn2jv5fww3x.feishu.cn/wiki/JY7PwkqvtiKl9dk1P9DcW9FWnrb?sheet=1c8YYE>。該官方表格頁面顯示最新修改時間為 `08月15日`（原頁面未顯示年份），六個工作表的逐格內容已完整同步至 [`media-plan-model-pricing.md`](media-plan-model-pricing.md)。以下既有 rows 是主指南本身的歷史快照，不能取代外部 Media Plan 表，也不能當成目前帳戶報價：

#### 7.3.0 官方 Media Plan 完整工作表

完整表格包含：

- `【视频】模型参数`：MiniMax H3、Seedance、Beta、Hailuo、Kling、Wan 的支援能力、參考數量、prompt 限制、特殊限制與逐步生成校驗。
- `【视频】模型计费`：46 個資料列（官方來源列 2–47），包含积分／秒或條、單位，以及 Starter／Plus／Pro 月付與年付 RMB。
- `【图片】模型参数`：Design Image、香蕉、Seedream、Kling、Midjourney 的支援能力與生成校驗。
- `【图片】模型计费`：17 個來源列，包含解析度、積分／張、單位與六種方案價格。
- `【参数】音频模型`：speech、Seed Audio、MiniMax-2.6、ElevenLabs Music-v2 的輸入與校驗契約。
- `【音频】模型计费`：speech-2.8-hd、Seed Audio 1.0、MiniMax-3.0 的計費方式、積分與六種方案價格。

來源列號、合併儲存格歸屬、空白單位與兩個音頻工作表之間的模型名稱差異均保留在獨立 reference；不把 `MiniMax-2.6`、`ElevenLabs Music-v2` 與 `MiniMax-3.0` 擅自合併。

#### 7.3.1 Generic Video pricing rows

官方 Video Models 章節前置表格以輸入形態與畫質列出另一組 credits／秒快照；頁面表格的模型名稱在部分列以合併儲存格呈現，因此保留其原始分組，不替它猜測供應商：

| Input profile | 解析度 | 模式 | Original credits／秒 | Discounted credits／秒 | 計價基準 |
| --- | --- | --- | ---: | ---: | --- |
| Input + output | 1080P | Fast | 500 | 180 | — |
| Input + output | 720P | Standard | 280 | 100 | — |
| Input + output | 720P | Fast | 220 | 80 | — |
| Input + output | 480P | Standard | 120 | 40 | — |
| Input + output | 480P | Fast | 80 | 30 | — |
| w/o Video | 1080P | Standard | 1000 | 350 | Output duration |
| w/o Video | 1080P | Fast | 800 | 280 | Output duration |
| w/o Video | 720P | Standard | 420 | 150 | Output duration |
| w/o Video | 720P | Fast | 340 | 120 | Output duration |
| w/o Video | 480P | Standard | 200 | 70 | Output duration |
| w/o Video | 480P | Fast | 160 | 60 | Output duration |

| 模型 | 解析度／時長 | 文件列示 credits |
| --- | --- | --- |
| Seedance 2.0 | 480P／720P／1080P，4–15 秒 | 以目前方案表為準 |
| Seedance 2.0 Fast | 480P／720P／1080P，4–15 秒 | 以目前方案表為準 |
| Beta Pro | —，8 秒 | 1200 |
| Beta Fast | —，8 秒 | 600 |
| Hailuo 2.0 | 768P，6／10 秒；1080P，6 秒 | 250／500；800 |
| Hailuo 2.3 | 768P，6／10 秒；1080P，6 秒 | 250／500；800 |
| Hailuo 2.3 Fast | 768P，6／10 秒；1080P，6 秒 | 150／300；500 |
| Kling V3 有聲 | Standard／Pro，按秒 | 270／360 credits／秒 |
| Kling V3 無聲 | Standard／Pro，按秒 | 180／240 credits／秒 |
| Kling Lip-Sync | — | 100 credits／次 |
| Kling Video to Audio | — | 30 credits／次 |
| Kling Video O1 | Standard／Pro；有／無 reference video，3–10 秒 | 文件快照只保留四欄 tuple `240／360／320／480 credits／秒`，未標示各組合欄名；組合對價以目前 UI 為準 |
| Kling V3 Omni (Video) | Standard／Pro；有／無 audio、reference，3–15 秒；另有 4K with refs | 文件快照只保留七欄 tuple `240／320／360／320／400／480／1200 credits／秒`，未標示各組合欄名；組合對價以目前 UI 為準 |
| Wan 2.6 | 720P／1080P，5／10／15 秒 | 250／500／750；800／1600／2400 |
| Kling V2-6（Audio） | Standard／Pro，5／10 秒 | 1300／2600；1500／3000 |
| Kling V2-6（No audio） | Standard／Pro，5／10 秒 | 450／900；700／1400 |
| Kling V2-Master | Standard／Pro，5／10 秒 | 2000／4000；2000／4000 |
| Kling V2.5-Turbo | Standard／Pro，5／10 秒 | 400／800；700／1400 |

MiniMax Design UI 另曾實際顯示 MiniMax H3、Seedance 2.0／Fast／Mini、Kling O1／O3／Avatar／Motion Control、Wan 2.6、Jimeng Motion Control 2.0、Veo 3.1／Fast；可用性與價格仍要以當前 UI 讀回。表中的「按秒」是官方頁面快照，不可用舊價格預先計算扣點。

### 7.4 圖片模型（User Guide 價格表快照）

外部官方 Media Plan 的圖片參數與完整 17 列計費表見 [`media-plan-model-pricing.md`](media-plan-model-pricing.md) 的第 3、4 節；下表保留主指南原有的歷史能力快照，執行前仍以目前 UI 為準。

| 模型 | 解析度／模式 | 文件列示 credits |
| --- | --- | --- |
| Nano Banana Pro | 1K／2K／4K | 60／60／100 |
| Nano Banana 2 Flash | 1K／2K／4K | 40／50／80 |
| GPT Image 1.5 | Low／Medium／High | 40／80／150 |
| Seedream 4.5 | 2K／4K | 40 |
| Seedream 5.0 Lite | 2K／3K | 40 |
| Flux Kontext | — | 20 |
| Midjourney V7 | — | 30 |
| Qwen Image Edit | — | 20 |
| Kling V1.5／V2／V2.1 | — | 20 |

圖片生成與圖片編輯要分開記錄輸入素材角色、模型、解析度、結果檔名與 QA；不能把圖片節點存在當作成功。

### 7.5 Audio Models：TTS、Music Generation 與 Music Cover

外部官方 Media Plan 的音頻參數與計費完整表見 [`media-plan-model-pricing.md`](media-plan-model-pricing.md) 的第 5、6 節。參數工作表列出 `speech-2.8-hd`、`Seed Audio-1.0`、`speech-2.8-turbo`、`MiniMax-2.6`、`ElevenLabs Music-v2`；計費工作表列出 `speech-2.8-hd`、`Seed Audio 1.0`、`MiniMax-3.0`。主指南／歷史 UI 快照曾讀到 `Speech-2.8-HD`、`Music-3.0`／`Music Cover`；這些官方列示不一致時，保留原文並以目前 Model 選單為準。

User Guide 的音訊價格：

| 能力 | 模型／方案 | 文件列示費用 |
| --- | --- | --- |
| TTS HD | speech-2.8-hd（default）、speech-02-hd、speech-2.5-hd-preview | 1000 字符／5 積分 |
| Music Generation | 每首歌 | 20 credits |
| Voice Clone（音色克隆） | 每個音色 | 100 credits／音色 |
| Voice Design（音色設計） | 每個音色 | 50 credits／音色 |

TTS 是文字轉語音；Music Generation 是完整音樂生成；Music Cover、Voice Clone 與 Voice Design 是另外的音訊能力。它們不可互換，必須在付費卡或工作區摘要中寫清楚實際 Audio 模型與模式。當前頁面未列出 Turbo 價格，不能沿用舊快照補推。

音樂請求還要讀回：歌詞／對白的確切文字、語言、目標長度、曲風、節拍、樂器、人聲、環境音、音效、是否要重作旋律、輸出格式，以及不要加入的內容。音樂生成成功不等於歌詞、混音、長度或播放品質已通過；需另做音訊 QA。

### 7.6 Agent 對話模型

User Guide 列示：33,333 weighted tokens＝10 credits；約略計算為 input×3＋output×10，cache hit 可降低 10×。這是 Agent conversation 的後扣款規則，不可拿來代替媒體生成費用。

## 8. 能力展示與 Preset Skills

官方展示涵蓋：

- 影視與短視頻：角色資產管理、劇本轉分鏡、AI 影片生成、配音與音效，以及多專案並行。
- 漫劇與動畫：腳本／分鏡設計、角色 Skill、風格切換與一致性。
- 品牌廣告／內容營銷：品牌 Skill、批量圖片生成、TVC 影片生成與多格式交付。
- 電商／社媒內容：批量生成、產品詳情圖、本機素材調用與匯出剪映。
- 電商：從製造商照片辨識產品與賣點，批量產生 1:1／3:4 主圖、詳情圖、白底圖、SKU 圖，依平台命名並分資料夾；可在同一對話中修正不滿意輸出。
- 平面設計：依參考圖與產品需求產生海報，控制材質、排版、文字與產品賣點。
- UGC 廣告：依品牌／產品／受眾／平台／9:16／約 30 秒 brief 規劃短片。
- TVC：讀取 brief 與參考影片，保留視覺質地、色彩、開場節奏與產品風格，輸出指定時長／畫幅。
- MV：輸入歌曲音訊（示例為 `歌曲.mp3`）與整體風格，產生音樂影片；音訊是 MV 來源，不代表同一動作會自動生成新歌。
- 短劇：以角色、劇本、場景與影片工作流製作內容。
- 更多官方示例：Shopee／Xiaohongshu／Taobao 電商圖組、Jo Malone 房間噴霧 UGC、Nike 60 秒 16:9 TVC、貓咪咀嚼玩具、日式手工蛋糕海報、泰式紅奶茶海報，以及把 Feishu User Guide 轉成產品介紹海報與 PPT。

文件列示的 Preset Skills 與指令：

- `/promo-video`：輸入產品 URL，規劃並生成產品宣傳影片。
- `/path-guided-camera-move`：以兩張圖（乾淨參考圖＋紅箭頭路徑圖）生成結構化 image-to-video prompt，預設加入同步真實音效並禁止 BGM。
- `/clip-export`：將生成結果或專案匯出成 Jianying／CapCut 草稿。
- `/animal-podcast`：以動物角色、喜劇腳本、影片、音樂、字幕產生可批次製作的 podcast 短片。
- `/short-drama`：以結構化編劇方法覆蓋選題、人設、分集、劇本、合規與出海，文件示例描述可一次產生創作方案、角色檔案、分集目錄與多集劇本；是否安裝仍以目前 Skills UI 為準。
- `/image-remix`：拆解參考圖的構圖、節奏、色彩、材質與意義，再驅動新內容生成。
- `/ad-idea`：規劃廣告提案並生成概念圖片／影片。

Preset Skill 是否安裝、名稱是否變更、入口是否可用，都要透過當前 Skills UI 讀回。

### 8.1 General Capabilities

官方一般能力展示包括：

- 組織檔案：依使用者規則重新命名與分類本機檔案。
- 從 Feishu 文件建立產品介紹海報與 PPT，並把結果保存為可回讀的交付資產。
- 研究、腳本、圖片、影片、音訊、字幕、檔案整理與本機剪輯交付可由 Agent 串成同一工作流。
- 文件的產品案例還涵蓋影視／短視頻、漫劇／動畫、品牌廣告／內容營銷、電商／社媒內容、TVC、MV 與短劇；這些案例是能力展示，不是目前帳戶的結果證據。

這些是文件展示的能力範例，不是代表每個帳戶、每個 Skill 或每個 Plugin 都已啟用。

### 8.2 FAQ

官方頁面目前保留 FAQ 章節標題，但未提供可穩定抽取的固定問答正文。遇到方案、模型、價格、登入、匯出或失敗問題時，必須以目前 App、當前方案頁與當前模型選單讀回，不得以空白 FAQ 推測答案。

### 8.3 Credits Consumption

- MiniMax Design 使用專屬 Media Plan 與 credits 制度；既有 Hailuo 使用者可依官方轉移指南處理 credits。
- 媒體生成採預扣模式，生成失敗自動退款。
- Agent conversation 採後扣款模式，達到 token 門檻後扣款且不打斷對話。
- 生成、重試、升級畫質、批次生成與可能扣款的匯出都要各自建立 action record；不可用總餘額或歷史價格推定目前可用額度。

### 8.4 Model Capabilities & Pricing

官方頁面把完整模型表放在文件末段，包含 Video Models、Image Models、Audio Models 與 Agent Conversation。媒體生成費用在生成前扣除，失敗退款；Agent conversation 的 token 計算獨立於媒體生成，不能混用。完整表格快照見本節 7.3–7.6，UI 顯示的當前模型與成本優先。

### 8.5 Special Offer

官方頁面在 2026-08-14 快照保留 Special Offer 章節；與 What's New 同期可見的促銷是「8 月 15 日前年方案 H3 生成 8 折」與免費使用 credits 延長。這些促銷有日期邊界，不能當成目前仍有效的 entitlement；執行前要重新讀取方案頁。

### 8.6 Welcome — Join Us in Building the Product!／Community Group

官方頁面邀請創作者加入 MiniMax Design 社群，當前頁面要求從 <https://design.minimaxi.com/> 查找最新回饋群入口；先前同步快照另列 Discord <https://discord.com/invite/hmfVm9dc4B>。這些是參考連結，不是本 Plugin 可自行發訊息、加入社群或分享檔案的授權。

### 8.7 產品熱點：Rap MV Skill

頁面保留 2026 年 7 月產品快訊：MiniMax Design 與創作者合作推出由 AI 生成歌曲與畫面的 Rap MV，並提供「杰克小兔同款 MV Skill」入口 <https://design.minimaxi.com/skill/rap-avatar-mv>。這是產品展示與歷史快訊，不代表該 Skill 目前已安裝或帳戶可用。

## 9. 費用與付款安全

- Media Plan 採 credits 制度。
- 媒體生成是預扣 credits；生成失敗自動退款。
- Agent 對話是達到 token 門檻後扣款，對話不中斷。
- 帳戶截圖中的餘額、方案狀態與扣點 ledger 是帳戶特定且會漂移的證據；不可用總餘額代替 subscription／expiry、媒體的 model entitlement、匯出的 export permission 或即時成本核對。
- 文件價格不是即時報價；若目前 UI 沒有顯示費用，付費卡固定寫 `cost: unavailable`。
- 任何可能消耗 credits 的生成、重試、升級畫質、批次生成或匯出，都要在動作前顯示完整付費卡並取得新的「確認生成？」；匯出動作使用「確認匯出？」。非付費的 Asset Center 保存、Canvas 連結或 Skill／Plugin 啟用，也要在動作後讀回實際記錄。
- 確認後若專案、對話、媒體類別、模型、Skill、模式、時長／目標長度、比例、解析度、語言、音訊、素材、prompt／歌詞、輸出格式、旋律重作設定、source audio、export target、費用或 App draft／quote／export job identifier 任一欄位改變，舊確認失效，回到草稿狀態。

## 10. 跨模態執行與驗證契約

固定狀態：`DISCOVER → VALIDATE → DRAFTED → AWAITING_USER_CONFIRMATION → SUBMITTED → RUNNING → SUCCEEDED | FAILED | CANCELLED | UNKNOWN`。

每次工作：

1. 以 `computer-use:computer-use` 讀取 App、專案、對話、連線、模型與現有草稿。
2. 依媒體類別驗證輸入限制、素材角色、模型、時長／畫幅／解析度／音訊與費用。
3. 用 `set_value` 填 prompt；不使用 Return；每次 UI 動作後重新讀取 state。
4. 付費卡固定列出專案、對話、媒體類別、實際模型、精確 Skill identifier、模式、輸出設定、輸出格式、音訊、素材角色、完整 prompt／歌詞、旋律是否重作、負面限制、draft／quote identifier、匯出 target／action（若適用）與費用。
5. 生成時只有使用者在卡片後明確確認「確認生成？」才按 Send；匯出時用「確認匯出？」；一次確認只允許一次 Send／匯出。
6. 送出後只追蹤同一個原始任務。spinner、舊節點、Agent 回覆、數量增加或畫面無變化都不能授權重送。
7. `SUCCEEDED` 必須有與本次動作關聯的 modality-specific 證據：媒體生成要有新增輸出節點、實際模型／參數與結果檔名／下載入口；Asset Center 要有資產記錄；Skill／Plugin 要有啟用記錄；匯出要有 export job／draft 與可開啟結果。圖片、影片、音訊與 MV 另做相應播放／內容 QA。

## 11. 文件更新與不確定性

- 官方 User Guide 頁面修改時間為 2026-08-14；本 reference 於 2026-08-16 同步。H3 手冊頁面修改時間為 2026-08-11；兩份來源與章節映射見 `source-manifest.md`。
- 這兩份文件與目前 App 都是外部可變狀態；新模型、價格、入口、Skill、Plugin 或方案規則出現時，先更新 reference，再依目前 UI 讀回。
- 不把本文件的價格、歷史 UI、示例輸出、留言、檔名或 Agent 回覆當成目前任務的授權或成功證據。
