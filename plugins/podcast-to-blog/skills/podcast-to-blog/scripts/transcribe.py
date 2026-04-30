#!/usr/bin/env python3
"""
使用 OpenAI Whisper 開源模型將音檔轉錄為文字。

用法：
    python3 transcribe.py <audio_path> <output_path> [--language zh] [--model medium]

範例：
    python3 transcribe.py /tmp/podcast.mp3 /tmp/transcript.txt --language zh --model medium

模型選擇指南：
    tiny   - 最快，品質最低，約 39MB（測試用）
    base   - 快速，基本品質，約 74MB
    small  - 平衡速度與品質，約 244MB
    medium - 高品質，推薦用於中文，約 769MB
    large  - 最高品質，但很慢，約 1.5GB（需較多 RAM）
"""

import sys
import argparse
import time
from pathlib import Path


def format_timestamp(seconds: float) -> str:
    """將秒數格式化為 HH:MM:SS。"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


def transcribe(audio_path: str, output_path: str, language: str = "zh",
               model_name: str = "medium"):
    """執行轉錄。"""
    print(f"[INFO] 載入 Whisper 模型: {model_name}")
    print(f"[INFO] 這可能需要一些時間（首次使用會下載模型）...")

    import whisper

    start_load = time.time()
    model = whisper.load_model(model_name)
    load_time = time.time() - start_load
    print(f"[INFO] 模型載入完成（{load_time:.1f} 秒）")

    print(f"[INFO] 開始轉錄: {audio_path}")
    print(f"[INFO] 語言: {language}")
    print(f"[INFO] 轉錄中，請耐心等待...")

    start_transcribe = time.time()
    result = model.transcribe(
        audio_path,
        language=language,
        verbose=True,  # 顯示進度
        task="transcribe",
    )
    transcribe_time = time.time() - start_transcribe

    # 取得完整文字
    full_text = result["text"]
    segments = result.get("segments", [])

    print(f"\n[INFO] 轉錄完成（{transcribe_time:.1f} 秒）")
    print(f"[INFO] 共 {len(segments)} 個段落")

    # 寫入純文字版（帶時間戳）
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("# Podcast 逐字稿\n\n")
        for seg in segments:
            ts = format_timestamp(seg["start"])
            text = seg["text"].strip()
            if text:
                f.write(f"[{ts}] {text}\n\n")

    print(f"[OK] 逐字稿已存至: {output_path}")

    # 也寫入一個不帶時間戳的純文字版，方便後續生成文章
    plain_path = output_path.replace(".txt", "_plain.txt")
    with open(plain_path, "w", encoding="utf-8") as f:
        f.write(full_text)

    print(f"[OK] 純文字版已存至: {plain_path}")

    # 統計
    word_count = len(full_text)
    audio_duration = segments[-1]["end"] if segments else 0
    print(f"\n[統計]")
    print(f"  音檔長度: {format_timestamp(audio_duration)}")
    print(f"  文字字數: {word_count}")
    print(f"  轉錄耗時: {transcribe_time:.0f} 秒")
    print(f"  速度比: {audio_duration / transcribe_time:.1f}x" if transcribe_time > 0 else "")

    return output_path


def main():
    parser = argparse.ArgumentParser(description="Whisper Podcast 轉錄工具")
    parser.add_argument("audio_path", help="音檔路徑")
    parser.add_argument("output_path", help="輸出逐字稿路徑")
    parser.add_argument("--language", default="zh", help="語言代碼 (預設: zh)")
    parser.add_argument("--model", default="medium",
                        choices=["tiny", "base", "small", "medium", "large"],
                        help="Whisper 模型大小 (預設: medium)")

    args = parser.parse_args()

    if not Path(args.audio_path).exists():
        print(f"[ERROR] 音檔不存在: {args.audio_path}")
        sys.exit(1)

    try:
        transcribe(args.audio_path, args.output_path, args.language, args.model)
    except ImportError:
        print("[ERROR] 未安裝 Whisper。請執行: pip install openai-whisper --break-system-packages")
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] 轉錄失敗: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
