#!/usr/bin/env python3
"""Static checks for the synchronized MiniMax Design references."""

import re
from pathlib import Path


PLUGIN_ROOT = Path(__file__).resolve().parents[3]
SKILL = PLUGIN_ROOT / "skills/minimax-design-video/SKILL.md"
GUIDE = PLUGIN_ROOT / "skills/minimax-design-video/references/design-user-guide.md"
H3 = PLUGIN_ROOT / "skills/minimax-design-video/references/h3-manual.md"
MANIFEST = PLUGIN_ROOT / "skills/minimax-design-video/references/source-manifest.md"
PRESSURE = PLUGIN_ROOT / "skills/minimax-design-video/tests/pressure-scenarios.md"
DESKTOP = PLUGIN_ROOT / "skills/minimax-design-video/references/desktop-workflow.md"
MEDIA_PRICING = PLUGIN_ROOT / "skills/minimax-design-video/references/media-plan-model-pricing.md"
REFERENCE_TARGETS = [
    "references/design-user-guide.md",
    "references/h3-manual.md",
    "references/desktop-workflow.md",
    "references/source-manifest.md",
    "references/media-plan-model-pricing.md",
]

GUIDE_SECTIONS = [
    "## 0. What's New",
    "## 0.1 What is MiniMax Hub\uFF0FMiniMax Design",
    "## 1. 產品定位與能力範圍",
    "## 2. 安裝、登入與方案",
    "## 3. 介面與專案工作區",
    "## 4. Skills",
    "## 5. Premium Plugins",
    "## 6. Canvas 與 Asset Center",
    "## 7. 模型與生成能力",
    "## 8. 能力展示與 Preset Skills",
    "## 9. 費用與付款安全",
    "## 10. 跨模態執行與驗證契約",
    "## 11. 文件更新與不確定性",
]

GUIDE_MODEL_BLOCKS = {
    "### 7.3 影片模型（User Guide 價格表快照）": [
        "Seedance 2.0",
        "Seedance 2.0 Fast",
        "Beta Pro",
        "Beta Fast",
        "Hailuo 2.0",
        "Hailuo 2.3",
        "Hailuo 2.3 Fast",
        "Kling V3 有聲",
        "Kling V3 無聲",
        "Kling Lip-Sync",
        "Kling Video to Audio",
        "Kling Video O1",
        "Kling V3 Omni (Video)",
        "Wan 2.6",
        "Kling V2-6\uFF08Audio\uFF09",
        "Kling V2-6\uFF08No audio\uFF09",
        "Kling V2-Master",
        "Kling V2.5-Turbo",
    ],
    "### 7.4 圖片模型（User Guide 價格表快照）": [
        "Nano Banana Pro",
        "Nano Banana 2 Flash",
        "GPT Image 1.5",
        "Seedream 4.5",
        "Seedream 5.0 Lite",
        "Flux Kontext",
        "Midjourney V7",
        "Qwen Image Edit",
        "Kling V1.5\uFF0FV2\uFF0FV2.1",
    ],
    "### 7.5 Audio Models\uFF1ATTS、Music Generation 與 Music Cover": [
        "Speech-2.8-HD",
        "Seed Audio 1.0",
        "Music-3.0",
        "Music Cover",
        "Music Generation",
    ],
}

H3_INDEX_MARKERS = [
    "1.1 品牌大片與影視內容",
    "1.2 視覺創意與內容包裝",
    "1.3 動態圖形、MG動畫、AE特效",
    "1.4 AR現實增強創意視頻",
    "1.5 AI 劇情內容創作",
    "1.6 產品與電商營銷",
    "1.7 數字體驗與遊戲創意",
    "1.8 硬件\uFF0F實體工業\uFF0F具身智能演示",
    "1.9 動畫與風格化影像",
    "2.1 多素材聯合參考",
    "2.2 角色\uFF0F動作\uFF0F鏡頭參考",
    "2.3 音色克隆與遷移",
    "3.1 角色與物體編輯",
    "3.2 場景與視覺效果編輯",
    "3.3 聲音\uFF0F台詞\uFF0F音色修改",
    "3.4 高精度的指令遵循",
]

H3_SECTION_BLOCKS = {
    "## 9. 多模態組合模式": ["### 9.1", "### 9.2", "### 9.3"],
    "## 10. 精準編輯": ["### 10.1", "### 10.2", "### 10.3", "### 10.4"],
    "## 11. 商業場景": [
        "### 11.1",
        "### 11.2",
        "### 11.3",
        "### 11.4",
        "### 11.5",
        "### 11.6",
        "### 11.7",
        "### 11.8",
        "### 11.9",
    ],
}


def assert_contains(path: Path | str, required: list[str]) -> None:
    text = path.read_text(encoding="utf-8") if isinstance(path, Path) else path
    missing = [item for item in required if item not in text]
    name = path.name if isinstance(path, Path) else "section"
    if missing:
        raise AssertionError(f"{name} missing: {', '.join(missing)}")


def section_text(path: Path, heading: str) -> str:
    text = path.read_text(encoding="utf-8")
    start = text.find(heading)
    if start < 0:
        raise AssertionError(f"{path.name} missing section: {heading}")
    remainder = text[start + len(heading) :]
    level = len(heading) - len(heading.lstrip("#"))
    next_heading = re.search(rf"^#{{1,{level}}} ", remainder, flags=re.MULTILINE)
    end = start + len(heading) + (next_heading.start() if next_heading else len(remainder))
    return text[start:end]


def assert_section_contains(path: Path, required_by_section: dict[str, list[str]]) -> None:
    for heading, required in required_by_section.items():
        assert_contains(section_text(path, heading), required)


def test_user_guide_snapshot_covers_current_sections_and_models() -> None:
    assert_contains(
        GUIDE,
        [
            "官方頁面修改時間\uFF1A2026-08-14",
            "https://my.feishu.cn/wiki/VEoVwpfCKiTHvHkAGQ7cQJxCncf",
            "What's New",
            "What is MiniMax Hub",
            "Creation Code",
            "General Capabilities",
            "FAQ",
            "Special Offer",
            "Welcome — Join Us in Building the Product!",
            "https://discord.com/invite/hmfVm9dc4B",
            "https://design.minimaxi.com/media-plan/subscribe",
            "DaVinci",
            "Adobe",
            "short-drama",
            "音色克隆",
            "音色設計",
            "rap-avatar-mv",
            "JY7PwkqvtiKl9dk1P9DcW9FWnrb",
            "Agent Conversation & General Operations",
            "Input + output",
            "w/o Video",
            "Original credits\uFF0F秒",
            "Kling V3 Omni (Video)",
            "Kling V2.5-Turbo",
            "Kling Video to Audio",
        ],
    )
    assert_contains(GUIDE, GUIDE_SECTIONS)
    assert_section_contains(GUIDE, GUIDE_MODEL_BLOCKS)


def test_skill_contract_covers_multimodal_safety_details() -> None:
    assert_contains(
        SKILL,
        [
            "action_entitled",
            "Music Cover:",
            "canonical UTF-8 JSON",
            "__MISSING__",
            "Unicode NFC",
            "SHA-256",
            "hard caps",
        ],
    )


def test_existing_audio_analysis_contract_is_documented() -> None:
    assert_contains(
        SKILL,
        [
            "Existing audio analysis",
            "Whisper transcription",
            "signal-derived",
            "model-inferred",
            "unknown",
        ],
    )
    assert_contains(
        DESKTOP,
        [
            "2026-08-14",
            "mode=lyrics",
            "provider=whisper",
            "total_duration",
            "音訊理解模型",
            "BPM／Key／拍號",
        ],
    )
    assert_contains(PRESSURE, ["情境 J：既有音樂分析", "Whisper", "證據分級"])


def test_media_plan_snapshot_covers_all_official_worksheets() -> None:
    assert_contains(
        MEDIA_PRICING,
        [
            "https://ycn2jv5fww3x.feishu.cn/wiki/JY7PwkqvtiKl9dk1P9DcW9FWnrb?sheet=1c8YYE",
            "最新修改時間：`08月15日`",
            "## 1. 【视频】模型参数",
            "## 2. 【视频】模型计费",
            "## 3. 【图片】模型参数",
            "## 4. 【图片】模型计费",
            "## 5. 【参数】音频模型",
            "## 6. 【音频】模型计费",
            "| 47 | Wan 2.6 | 1080P 15秒 | 2400",
            "| 18 | Midjourney V8.1/V7/Niji7 | 默认 | 120",
            "| 6 | ElevenLabs Music-v2 |",
            "| 4 | 音乐模型 | MiniMax-3.0 | 每首歌 | 20",
            "MiniMax-2.6",
            "保留兩組原文，不替官方推測版本對應",
        ],
    )


def test_h3_snapshot_covers_current_section_index() -> None:
    assert_contains(
        H3,
        [
            "官方頁面修改時間\uFF1A2026-08-11",
            *H3_INDEX_MARKERS,
            "API request body 64 MB",
        ],
    )
    assert_section_contains(H3, H3_SECTION_BLOCKS)


def test_source_manifest_records_provenance() -> None:
    assert_contains(
        MANIFEST,
        [
            "https://my.feishu.cn/wiki/VEoVwpfCKiTHvHkAGQ7cQJxCncf",
            "https://my.feishu.cn/wiki/X3pGw8I5Gi6E1fkMqQpcP5ZBnHd",
            "https://vrfi1sk8a0.feishu.cn/wiki/FIWjwgL33ipnkekzk30crmKUnIh",
            "https://ycn2jv5fww3x.feishu.cn/wiki/JY7PwkqvtiKl9dk1P9DcW9FWnrb",
            "2026-08-10",
            "2026-08-11",
            "2026-08-14",
            "2026-08-16",
            "08月15日（原頁面未顯示年份）",
            "media-plan-model-pricing.md",
            "【视频】模型参数",
            "【音频】模型计费",
            "章節映射",
            "H3 手冊章節映射",
            "16. 產品熱點：Rap MV Skill 與 2026 年 7 月產品快訊",
            "14. 模型能力和計費表格：預扣／失敗退款、TTS、Music Generation、Voice Clone、Voice Design、Agent 對話",
            "模型命名契約",
            "Kling Video O1",
            "Kling O1",
            "Kling V3 Omni (Video)",
            "V2-Master",
        ],
    )
    assert_contains(MANIFEST, REFERENCE_TARGETS)


def test_reference_targets_exist() -> None:
    for relative_path in REFERENCE_TARGETS:
        path = PLUGIN_ROOT / "skills/minimax-design-video" / relative_path
        if not path.is_file():
            raise AssertionError(f"missing reference target: {path}")


def test_references_do_not_include_private_account_snapshots() -> None:
    forbidden = [
        re.compile(
            r"(?:expiry|expires|expiry date|到期日|到期)[^\n]{0,32}"
            r"(?:\d{1,2}/\d{1,2}/\d{4}|\d{4}-\d{2}-\d{2}|"
            r"(?:January|February|March|April|May|June|July|August|September|"
            r"October|November|December)\s+\d{1,2},?\s+\d{4})",
            flags=re.IGNORECASE,
        ),
        re.compile(
            r"(?:remaining|available|account|total|subscription|餘額|余额)"
            r"[^\n]{0,32}(?:\d{1,3}(?:,\d{3})+|\d{2,})"
            r"(?:\s*(?:credits?|積分|积分))?",
            flags=re.IGNORECASE,
        ),
    ]
    synthetic_private_fixtures = [
        "到期日為 01/02/2030",
        "expiry date: August 15, 2030",
        "餘額仍有 12,345 credits",
        "available credits: 500",
        "余额：500 积分",
    ]
    for fixture in synthetic_private_fixtures:
        if not any(pattern.search(fixture) for pattern in forbidden):
            raise AssertionError(f"privacy patterns do not catch contextual fixture: {fixture}")
    for path in (GUIDE, H3, MANIFEST, DESKTOP, PRESSURE, MEDIA_PRICING):
        text = path.read_text(encoding="utf-8")
        for pattern in forbidden:
            if pattern.search(text):
                raise AssertionError(f"{path.name} contains private account snapshot pattern: {pattern.pattern}")


if __name__ == "__main__":
    tests = [
        test_user_guide_snapshot_covers_current_sections_and_models,
        test_skill_contract_covers_multimodal_safety_details,
        test_existing_audio_analysis_contract_is_documented,
        test_media_plan_snapshot_covers_all_official_worksheets,
        test_h3_snapshot_covers_current_section_index,
        test_source_manifest_records_provenance,
        test_reference_targets_exist,
        test_references_do_not_include_private_account_snapshots,
    ]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
