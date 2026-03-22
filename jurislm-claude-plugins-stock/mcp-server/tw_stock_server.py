#!/usr/bin/env python3
"""
台股數據 MCP Server
使用 Yahoo Finance 取得台股股價與財務數據，搭配 TWSE 開放資料取得法人籌碼資訊。
"""

import json
import datetime
from typing import Any

import yfinance as yf
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("tw-stock-data", instructions="台灣股票數據服務：提供即時/歷史股價、財務指標、法人籌碼資訊")


def _normalize_ticker(stock_id: str) -> str:
    """將台股代號轉為 Yahoo Finance 格式 (e.g. 2330 -> 2330.TW)"""
    stock_id = stock_id.strip()
    if stock_id.endswith(".TW") or stock_id.endswith(".TWO"):
        return stock_id
    # 預設使用上市 (.TW)，如果查不到會在函式內 fallback 到 .TWO
    return f"{stock_id}.TW"


def _try_ticker(stock_id: str) -> tuple[yf.Ticker, str]:
    """嘗試取得 ticker，先試 .TW 再試 .TWO"""
    ticker_str = _normalize_ticker(stock_id)
    ticker = yf.Ticker(ticker_str)
    info = ticker.info
    if info and info.get("regularMarketPrice") is not None:
        return ticker, ticker_str
    # fallback to OTC
    if not ticker_str.endswith(".TWO"):
        otc_str = stock_id.strip().split(".")[0] + ".TWO"
        ticker = yf.Ticker(otc_str)
        info = ticker.info
        if info and info.get("regularMarketPrice") is not None:
            return ticker, otc_str
    return yf.Ticker(ticker_str), ticker_str


def _safe_get(d: dict, *keys, default=None) -> Any:
    """安全地從字典取值"""
    for key in keys:
        val = d.get(key)
        if val is not None:
            return val
    return default


@mcp.tool()
def get_stock_quote(stock_id: str) -> str:
    """
    取得台股個股即時報價與基本資訊。

    Args:
        stock_id: 台股代號，例如 "2330"（台積電）、"0050"（元大台灣50）
    """
    try:
        ticker, ticker_str = _try_ticker(stock_id)
        info = ticker.info

        if not info or info.get("regularMarketPrice") is None:
            return json.dumps({"error": f"找不到股票 {stock_id} 的資料，請確認代號是否正確"}, ensure_ascii=False)

        result = {
            "股票代號": ticker_str,
            "名稱": _safe_get(info, "longName", "shortName", default="N/A"),
            "現價": _safe_get(info, "regularMarketPrice", "currentPrice"),
            "漲跌": _safe_get(info, "regularMarketChange"),
            "漲跌幅(%)": round(_safe_get(info, "regularMarketChangePercent", default=0), 2),
            "開盤": _safe_get(info, "regularMarketOpen", "open"),
            "最高": _safe_get(info, "regularMarketDayHigh", "dayHigh"),
            "最低": _safe_get(info, "regularMarketDayLow", "dayLow"),
            "昨收": _safe_get(info, "regularMarketPreviousClose", "previousClose"),
            "成交量": _safe_get(info, "regularMarketVolume", "volume"),
            "52週最高": _safe_get(info, "fiftyTwoWeekHigh"),
            "52週最低": _safe_get(info, "fiftyTwoWeekLow"),
            "市值": _safe_get(info, "marketCap"),
            "本益比(PE)": _safe_get(info, "trailingPE"),
            "股價淨值比(PB)": _safe_get(info, "priceToBook"),
            "殖利率(%)": round(_safe_get(info, "dividendYield", default=0) * 100, 2) if _safe_get(info, "dividendYield") else None,
            "產業": _safe_get(info, "industry"),
            "類股": _safe_get(info, "sector"),
        }

        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception as e:
        return json.dumps({"error": f"查詢 {stock_id} 時發生錯誤: {str(e)}"}, ensure_ascii=False)


@mcp.tool()
def get_stock_history(stock_id: str, period: str = "3mo", interval: str = "1d") -> str:
    """
    取得台股個股歷史股價資料（K線數據）。

    Args:
        stock_id: 台股代號，例如 "2330"
        period: 時間範圍，可選 "1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "max"
        interval: K線週期，可選 "1d"(日), "1wk"(週), "1mo"(月)
    """
    try:
        ticker, ticker_str = _try_ticker(stock_id)
        hist = ticker.history(period=period, interval=interval)

        if hist.empty:
            return json.dumps({"error": f"找不到 {stock_id} 的歷史數據"}, ensure_ascii=False)

        records = []
        for date, row in hist.iterrows():
            records.append({
                "日期": date.strftime("%Y-%m-%d"),
                "開盤": round(row["Open"], 2),
                "最高": round(row["High"], 2),
                "最低": round(row["Low"], 2),
                "收盤": round(row["Close"], 2),
                "成交量": int(row["Volume"]),
            })

        # 計算一些基本統計
        closes = [r["收盤"] for r in records]
        summary = {
            "股票代號": ticker_str,
            "查詢期間": period,
            "K線週期": interval,
            "資料筆數": len(records),
            "期間最高": max(r["最高"] for r in records),
            "期間最低": min(r["最低"] for r in records),
            "期初收盤": closes[0],
            "期末收盤": closes[-1],
            "漲跌幅(%)": round((closes[-1] - closes[0]) / closes[0] * 100, 2),
        }

        # 計算均線
        if len(closes) >= 5:
            summary["5日均線"] = round(sum(closes[-5:]) / 5, 2)
        if len(closes) >= 10:
            summary["10日均線"] = round(sum(closes[-10:]) / 10, 2)
        if len(closes) >= 20:
            summary["20日均線(月線)"] = round(sum(closes[-20:]) / 20, 2)
        if len(closes) >= 60:
            summary["60日均線(季線)"] = round(sum(closes[-60:]) / 60, 2)

        # 只返回最近 30 筆詳細數據以避免過長
        recent = records[-30:] if len(records) > 30 else records

        return json.dumps({
            "摘要": summary,
            "近期數據": recent,
        }, ensure_ascii=False, indent=2)
    except Exception as e:
        return json.dumps({"error": f"查詢 {stock_id} 歷史數據時發生錯誤: {str(e)}"}, ensure_ascii=False)


@mcp.tool()
def get_financials(stock_id: str) -> str:
    """
    取得台股個股財務數據，包含損益表、資產負債表、現金流量表的關鍵指標。

    Args:
        stock_id: 台股代號，例如 "2330"
    """
    try:
        ticker, ticker_str = _try_ticker(stock_id)
        info = ticker.info

        # 基本估值指標
        valuation = {
            "本益比(PE)": _safe_get(info, "trailingPE"),
            "預估本益比": _safe_get(info, "forwardPE"),
            "股價淨值比(PB)": _safe_get(info, "priceToBook"),
            "市值": _safe_get(info, "marketCap"),
            "企業價值": _safe_get(info, "enterpriseValue"),
            "EV/EBITDA": _safe_get(info, "enterpriseToEbitda"),
        }

        # 獲利指標
        profitability = {
            "毛利率(%)": round(_safe_get(info, "grossMargins", default=0) * 100, 2) if _safe_get(info, "grossMargins") else None,
            "營業利益率(%)": round(_safe_get(info, "operatingMargins", default=0) * 100, 2) if _safe_get(info, "operatingMargins") else None,
            "淨利率(%)": round(_safe_get(info, "profitMargins", default=0) * 100, 2) if _safe_get(info, "profitMargins") else None,
            "ROE(%)": round(_safe_get(info, "returnOnEquity", default=0) * 100, 2) if _safe_get(info, "returnOnEquity") else None,
            "ROA(%)": round(_safe_get(info, "returnOnAssets", default=0) * 100, 2) if _safe_get(info, "returnOnAssets") else None,
            "每股盈餘(EPS)": _safe_get(info, "trailingEps"),
            "預估EPS": _safe_get(info, "forwardEps"),
        }

        # 股利資訊
        dividends = {
            "殖利率(%)": round(_safe_get(info, "dividendYield", default=0) * 100, 2) if _safe_get(info, "dividendYield") else None,
            "每股股利": _safe_get(info, "dividendRate"),
            "配息率(%)": round(_safe_get(info, "payoutRatio", default=0) * 100, 2) if _safe_get(info, "payoutRatio") else None,
        }

        # 財務健全度
        health = {
            "負債比率": _safe_get(info, "debtToEquity"),
            "流動比率": _safe_get(info, "currentRatio"),
            "速動比率": _safe_get(info, "quickRatio"),
            "自由現金流": _safe_get(info, "freeCashflow"),
            "營業現金流": _safe_get(info, "operatingCashflow"),
            "總收入": _safe_get(info, "totalRevenue"),
            "營收成長率(%)": round(_safe_get(info, "revenueGrowth", default=0) * 100, 2) if _safe_get(info, "revenueGrowth") else None,
            "盈餘成長率(%)": round(_safe_get(info, "earningsGrowth", default=0) * 100, 2) if _safe_get(info, "earningsGrowth") else None,
        }

        # 歷史股利
        div_history = []
        try:
            divs = ticker.dividends
            if not divs.empty:
                for date, amount in divs.tail(8).items():
                    div_history.append({
                        "日期": date.strftime("%Y-%m-%d"),
                        "每股股利": round(amount, 2),
                    })
        except Exception:
            pass

        result = {
            "股票代號": ticker_str,
            "名稱": _safe_get(info, "longName", "shortName", default="N/A"),
            "估值指標": valuation,
            "獲利能力": profitability,
            "股利資訊": dividends,
            "財務健全度": health,
        }
        if div_history:
            result["歷史配息"] = div_history

        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception as e:
        return json.dumps({"error": f"查詢 {stock_id} 財務數據時發生錯誤: {str(e)}"}, ensure_ascii=False)


@mcp.tool()
def get_institutional_trading(stock_id: str) -> str:
    """
    取得台股個股法人持股與交易資訊。

    Args:
        stock_id: 台股代號，例如 "2330"
    """
    try:
        ticker, ticker_str = _try_ticker(stock_id)
        info = ticker.info

        # 從 Yahoo Finance 可取得的法人相關資訊
        holders_info = {
            "機構持股比例(%)": round(_safe_get(info, "heldPercentInstitutions", default=0) * 100, 2) if _safe_get(info, "heldPercentInstitutions") else None,
            "內部人持股比例(%)": round(_safe_get(info, "heldPercentInsiders", default=0) * 100, 2) if _safe_get(info, "heldPercentInsiders") else None,
            "融券比例": _safe_get(info, "shortPercentOfFloat"),
            "流通股數": _safe_get(info, "floatShares"),
            "總股數": _safe_get(info, "sharesOutstanding"),
        }

        # 嘗試取得主要持股人資訊
        major_holders = []
        try:
            mh = ticker.major_holders
            if mh is not None and not mh.empty:
                for _, row in mh.iterrows():
                    major_holders.append({
                        "比例": str(row.iloc[0]),
                        "說明": str(row.iloc[1]) if len(row) > 1 else "",
                    })
        except Exception:
            pass

        # 嘗試取得機構持股人
        inst_holders = []
        try:
            ih = ticker.institutional_holders
            if ih is not None and not ih.empty:
                for _, row in ih.head(10).iterrows():
                    inst_holders.append({
                        "機構名稱": str(row.get("Holder", "")),
                        "持股數": int(row.get("Shares", 0)) if row.get("Shares") else None,
                        "持股比例(%)": round(row.get("pctHeld", 0) * 100, 2) if row.get("pctHeld") else None,
                        "持股價值": int(row.get("Value", 0)) if row.get("Value") else None,
                    })
        except Exception:
            pass

        result = {
            "股票代號": ticker_str,
            "名稱": _safe_get(info, "longName", "shortName", default="N/A"),
            "持股概況": holders_info,
            "提示": "如需台股三大法人（外資、投信、自營商）每日買賣超明細，建議搭配 WebSearch 搜尋「[代號] 三大法人買賣超」取得最新資訊，因為 Yahoo Finance 對台股法人的每日進出資料涵蓋度有限。",
        }

        if major_holders:
            result["主要持股人"] = major_holders
        if inst_holders:
            result["前十大機構持股人"] = inst_holders

        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception as e:
        return json.dumps({"error": f"查詢 {stock_id} 法人資訊時發生錯誤: {str(e)}"}, ensure_ascii=False)


@mcp.tool()
def compare_stocks(stock_ids: list[str]) -> str:
    """
    比較多檔台股個股的關鍵指標。

    Args:
        stock_ids: 台股代號列表，例如 ["2330", "2454", "2317"]（最多 5 檔）
    """
    if len(stock_ids) > 5:
        return json.dumps({"error": "最多比較 5 檔股票"}, ensure_ascii=False)

    results = []
    for sid in stock_ids:
        try:
            ticker, ticker_str = _try_ticker(sid)
            info = ticker.info

            results.append({
                "代號": ticker_str,
                "名稱": _safe_get(info, "longName", "shortName", default="N/A"),
                "現價": _safe_get(info, "regularMarketPrice"),
                "漲跌幅(%)": round(_safe_get(info, "regularMarketChangePercent", default=0), 2),
                "本益比(PE)": _safe_get(info, "trailingPE"),
                "股價淨值比(PB)": _safe_get(info, "priceToBook"),
                "殖利率(%)": round(_safe_get(info, "dividendYield", default=0) * 100, 2) if _safe_get(info, "dividendYield") else None,
                "ROE(%)": round(_safe_get(info, "returnOnEquity", default=0) * 100, 2) if _safe_get(info, "returnOnEquity") else None,
                "毛利率(%)": round(_safe_get(info, "grossMargins", default=0) * 100, 2) if _safe_get(info, "grossMargins") else None,
                "營收成長(%)": round(_safe_get(info, "revenueGrowth", default=0) * 100, 2) if _safe_get(info, "revenueGrowth") else None,
                "市值": _safe_get(info, "marketCap"),
            })
        except Exception as e:
            results.append({"代號": sid, "error": str(e)})

    return json.dumps({"比較結果": results}, ensure_ascii=False, indent=2)


@mcp.tool()
def get_twse_market_summary() -> str:
    """
    取得台股大盤（加權指數）的即時概況與近期走勢。
    """
    try:
        ticker = yf.Ticker("^TWII")
        info = ticker.info
        hist = ticker.history(period="1mo", interval="1d")

        summary = {
            "指數名稱": "加權指數 (TAIEX)",
            "現值": _safe_get(info, "regularMarketPrice"),
            "漲跌": _safe_get(info, "regularMarketChange"),
            "漲跌幅(%)": round(_safe_get(info, "regularMarketChangePercent", default=0), 2),
            "今日最高": _safe_get(info, "regularMarketDayHigh", "dayHigh"),
            "今日最低": _safe_get(info, "regularMarketDayLow", "dayLow"),
            "昨收": _safe_get(info, "regularMarketPreviousClose"),
            "52週最高": _safe_get(info, "fiftyTwoWeekHigh"),
            "52週最低": _safe_get(info, "fiftyTwoWeekLow"),
        }

        # 近期走勢
        if not hist.empty:
            recent = []
            for date, row in hist.tail(10).iterrows():
                recent.append({
                    "日期": date.strftime("%Y-%m-%d"),
                    "收盤": round(row["Close"], 2),
                    "成交量": int(row["Volume"]),
                })
            summary["近10日走勢"] = recent

        return json.dumps(summary, ensure_ascii=False, indent=2)
    except Exception as e:
        return json.dumps({"error": f"查詢大盤資訊時發生錯誤: {str(e)}"}, ensure_ascii=False)


if __name__ == "__main__":
    mcp.run(transport="stdio")
