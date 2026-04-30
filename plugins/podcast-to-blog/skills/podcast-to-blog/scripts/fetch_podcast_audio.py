#!/usr/bin/env python3
"""
從 Apple Podcasts URL 提取並下載 Podcast 音檔。

流程：
1. 解析 Apple Podcasts URL 取得 podcast ID 和 episode ID
2. 呼叫 iTunes Lookup API 取得 RSS Feed URL
3. 解析 RSS Feed 找到指定集數的音檔 URL
4. 下載音檔

用法：
    python3 fetch_podcast_audio.py <apple_podcasts_url> <output_path>

範例：
    python3 fetch_podcast_audio.py "https://podcasts.apple.com/tw/podcast/xxx/id1590806478?i=1000755918639" /tmp/podcast.mp3
"""

import sys
import re
import json
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from pathlib import Path


def parse_apple_url(url: str) -> tuple[str, str | None]:
    """從 Apple Podcasts URL 提取 podcast ID 和 episode ID。"""
    # 提取 podcast ID (id 後面的數字)
    podcast_match = re.search(r'/id(\d+)', url)
    if not podcast_match:
        raise ValueError(f"無法從 URL 提取 podcast ID: {url}")
    podcast_id = podcast_match.group(1)

    # 提取 episode ID (i= 參數)
    episode_match = re.search(r'[?&]i=(\d+)', url)
    episode_id = episode_match.group(1) if episode_match else None

    return podcast_id, episode_id


def get_rss_feed_url(podcast_id: str) -> str:
    """透過 iTunes Lookup API 取得 RSS Feed URL。"""
    lookup_url = f"https://itunes.apple.com/lookup?id={podcast_id}&entity=podcast"
    print(f"[INFO] 查詢 iTunes API: {lookup_url}")

    req = urllib.request.Request(lookup_url, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    results = data.get("results", [])
    if not results:
        raise ValueError(f"iTunes API 未找到 podcast ID: {podcast_id}")

    feed_url = results[0].get("feedUrl")
    if not feed_url:
        raise ValueError(f"該 podcast 沒有公開的 RSS Feed URL")

    print(f"[INFO] RSS Feed URL: {feed_url}")
    return feed_url


def find_episode_audio(feed_url: str, episode_id: str | None) -> tuple[str, str]:
    """解析 RSS Feed 找到指定集數的音檔 URL 和標題。"""
    print(f"[INFO] 下載並解析 RSS Feed...")

    req = urllib.request.Request(feed_url, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
    })
    with urllib.request.urlopen(req, timeout=60) as resp:
        feed_xml = resp.read()

    root = ET.fromstring(feed_xml)

    # RSS Feed 的命名空間
    ns = {
        "itunes": "http://www.itunes.com/dtds/podcast-1.0.dtd",
        "content": "http://purl.org/rss/1.0/modules/content/",
    }

    items = root.findall(".//item")
    print(f"[INFO] 找到 {len(items)} 集 episodes")

    for item in items:
        # 檢查是否符合指定的 episode ID
        if episode_id:
            # Apple episode ID 可能在多個位置
            guid = item.findtext("guid", "")
            # 有些 podcast 的 guid 包含 episode ID
            # 也嘗試比對 iTunes episode 相關的 URL
            enclosure = item.find("enclosure")
            item_title = item.findtext("title", "未知標題")

            # 方法1：嘗試透過 iTunes episode lookup 比對
            # 方法2：比對 guid 中的數字
            # 方法3：若無法精確比對，用 episode 發佈順序

            # 嘗試直接用 episode ID 查 iTunes API
            pass

        # 如果有 enclosure，取得音檔 URL
        enclosure = item.find("enclosure")
        if enclosure is not None:
            audio_url = enclosure.get("url", "")
            item_title = item.findtext("title", "未知標題")

            if episode_id:
                # 嘗試用 iTunes episode lookup 確認
                try:
                    ep_lookup = f"https://itunes.apple.com/lookup?id={episode_id}&entity=podcastEpisode"
                    req2 = urllib.request.Request(ep_lookup, headers={
                        "User-Agent": "Mozilla/5.0"
                    })
                    with urllib.request.urlopen(req2, timeout=15) as resp2:
                        ep_data = json.loads(resp2.read().decode("utf-8"))
                    ep_results = ep_data.get("results", [])
                    if ep_results:
                        target_title = ep_results[0].get("trackName", "")
                        target_url = ep_results[0].get("episodeUrl", "")
                        if target_url:
                            print(f"[INFO] 透過 iTunes API 找到音檔: {target_title}")
                            return target_url, target_title
                        # 如果 API 有標題但沒 URL，用標題去 RSS 比對
                        if target_title:
                            for it in items:
                                t = it.findtext("title", "")
                                if target_title in t or t in target_title:
                                    enc = it.find("enclosure")
                                    if enc is not None:
                                        print(f"[INFO] 透過標題比對找到: {t}")
                                        return enc.get("url", ""), t
                except Exception as e:
                    print(f"[WARN] iTunes episode lookup 失敗: {e}")

                # fallback: 回傳第一集（最新的）
                print(f"[WARN] 無法精確比對 episode ID，使用最新一集: {item_title}")
                return audio_url, item_title
            else:
                # 沒有 episode ID，回傳最新一集
                print(f"[INFO] 未指定 episode ID，使用最新一集: {item_title}")
                return audio_url, item_title

    raise ValueError("RSS Feed 中找不到可用的音檔")


def download_audio(audio_url: str, output_path: str):
    """下載音檔。"""
    print(f"[INFO] 開始下載音檔...")
    print(f"[INFO] URL: {audio_url}")
    print(f"[INFO] 儲存至: {output_path}")

    req = urllib.request.Request(audio_url, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
    })

    with urllib.request.urlopen(req, timeout=300) as resp:
        total = resp.headers.get("Content-Length")
        total = int(total) if total else None

        downloaded = 0
        chunk_size = 1024 * 256  # 256KB chunks

        with open(output_path, "wb") as f:
            while True:
                chunk = resp.read(chunk_size)
                if not chunk:
                    break
                f.write(chunk)
                downloaded += len(chunk)
                if total:
                    pct = (downloaded / total) * 100
                    mb_done = downloaded / (1024 * 1024)
                    mb_total = total / (1024 * 1024)
                    print(f"\r[下載中] {mb_done:.1f}/{mb_total:.1f} MB ({pct:.0f}%)", end="", flush=True)
                else:
                    mb_done = downloaded / (1024 * 1024)
                    print(f"\r[下載中] {mb_done:.1f} MB", end="", flush=True)

    print()
    file_size = Path(output_path).stat().st_size / (1024 * 1024)
    print(f"[OK] 下載完成！檔案大小: {file_size:.1f} MB")


def main():
    if len(sys.argv) < 3:
        print("用法: python3 fetch_podcast_audio.py <apple_podcasts_url> <output_path>")
        sys.exit(1)

    url = sys.argv[1]
    output_path = sys.argv[2]

    try:
        # Step 1: 解析 URL
        podcast_id, episode_id = parse_apple_url(url)
        print(f"[INFO] Podcast ID: {podcast_id}, Episode ID: {episode_id}")

        # Step 2: 取得 RSS Feed
        feed_url = get_rss_feed_url(podcast_id)

        # Step 3: 找到音檔 URL
        audio_url, episode_title = find_episode_audio(feed_url, episode_id)
        print(f"[INFO] Episode: {episode_title}")
        print(f"[INFO] Audio URL: {audio_url}")

        # Step 4: 下載
        download_audio(audio_url, output_path)

        # 輸出 metadata 供後續使用
        meta = {
            "title": episode_title,
            "podcast_id": podcast_id,
            "episode_id": episode_id,
            "audio_url": audio_url,
            "output_path": output_path
        }
        meta_path = output_path + ".meta.json"
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)
        print(f"[INFO] Metadata 已存至: {meta_path}")

    except Exception as e:
        print(f"[ERROR] {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
