#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#   "yfinance>=0.2.40",
#   "mcp[cli]>=1.0.0",
#   "pandas>=2.0.0",
#   "requests>=2.28.0",
#   "numpy>=1.24.0",
# ]
# ///
"""
台股數據 MCP Server v2.0.0
使用 Yahoo Finance 取得台股/美股/原物料報價與財務數據，
搭配 TWSE/TAIFEX 開放資料取得三大法人買賣超、融資融券、期貨選擇權籌碼等。

v2.0.0 新增工具：
  - get_futures_oi: 期貨未平倉 / 選擇權籌碼（外資台指期多空、Put/Call Ratio）
  - get_monthly_revenue: 個股月營收（MOPS 公開資訊觀測站）
  - calculate_technical_indicators: 技術指標計算（KD、MACD、RSI、布林通道）
  - get_dividend_calendar: 除權息行事曆
  - get_sector_performance: 類股漲跌排行
  - get_exchange_rate: 台幣匯率
"""

import json
import re
import math
import datetime
from typing import Any

import yfinance as yf
import pandas as pd
import numpy as np
import requests
from mcp.server.fastmcp import FastMCP

mcp = FastMCP(
    "tw-stock-data",
    instructions="台灣股票數據服務：提供即時/歷史股價、財務指標、法人籌碼、美股報價、國際原物料、三大法人買賣超、融資融券、期貨選擇權籌碼、月營收、技術指標、除權息、類股排行、匯率",
)

# ====================================================================
# Helper Functions
# ====================================================================

def _normalize_ticker(stock_id: str) -> str:
    stock_id = stock_id.strip()
    if stock_id.endswith(".TW") or stock_id.endswith(".TWO"):
        return stock_id
    return f"{stock_id}.TW"

def _try_ticker(stock_id: str) -> tuple[yf.Ticker, str]:
    ticker_str = _normalize_ticker(stock_id)
    ticker = yf.Ticker(ticker_str)
    info = ticker.info
    if info and info.get("regularMarketPrice") is not None:
        return ticker, ticker_str
    if not ticker_str.endswith(".TWO"):
        otc_str = stock_id.strip().split(".")[0] + ".TWO"
        ticker = yf.Ticker(otc_str)
        info = ticker.info
        if info and info.get("regularMarketPrice") is not None:
            return ticker, otc_str
    return yf.Ticker(ticker_str), ticker_str

def _safe_get(d: dict, *keys, default=None) -> Any:
    for key in keys:
        val = d.get(key)
        if val is not None:
            return val
    return default

def _twse_request(url: str, params: dict = None) -> dict | list | None:
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
        }
        resp = requests.get(url, params=params, headers=headers, timeout=15)
        resp.raise_for_status()
        return resp.json()
    except Exception:
        return None

def _find_recent_trade_date(url: str, params: dict, trade_date: str, data_key: str = "data") -> tuple[dict | None, str]:
    """嘗試取得資料，若失敗往前找最近的交易日"""
    data = _twse_request(url, params)
    if data and data.get("stat") == "OK" and (data_key is None or data.get(data_key)):
        return data, trade_date
    dt = datetime.datetime.strptime(trade_date, "%Y%m%d")
    for i in range(1, 8):
        prev = dt - datetime.timedelta(days=i)
        p = dict(params)
        p["date"] = prev.strftime("%Y%m%d")
        data = _twse_request(url, p)
        if data and data.get("stat") == "OK" and (data_key is None or data.get(data_key)):
            return data, prev.strftime("%Y%m%d")
    return None, trade_date

def _today_str() -> str:
    return datetime.date.today().strftime("%Y%m%d")

# ====================================================================
# 既有工具（v1.0 ~ v1.6）— 保持原有功能不變
# ====================================================================

@mcp.tool()
def get_stock_quote(stock_id: str) -> str:
    """
    取得台股個股即時報價與基本資訊。

    Args:
        stock_id: 台股代號,例如 "2330"（台積電）、"0050"（元大台灣50）
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
            records.append({"日期": date.strftime("%Y-%m-%d"), "開盤": round(row["Open"], 2), "最高": round(row["High"], 2), "最低": round(row["Low"], 2), "收盤": round(row["Close"], 2), "成交量": int(row["Volume"])})
        closes = [r["收盤"] for r in records]
        summary = {"股票代號": ticker_str, "查詢期間": period, "K線週期": interval, "資料筆數": len(records), "期間最高": max(r["最高"] for r in records), "期間最低": min(r["最低"] for r in records), "期初收盤": closes[0], "期末收盤": closes[-1], "漲跌幅(%)": round((closes[-1] - closes[0]) / closes[0] * 100, 2)}
        for name, n in [("5日均線", 5), ("10日均線", 10), ("20日均線(月線)", 20), ("60日均線(季線)", 60)]:
            if len(closes) >= n:
                summary[name] = round(sum(closes[-n:]) / n, 2)
        return json.dumps({"摘要": summary, "近期數據": records[-30:]}, ensure_ascii=False, indent=2)
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
        valuation = {"本益比(PE)": _safe_get(info, "trailingPE"), "預估本益比": _safe_get(info, "forwardPE"), "股價淨值比(PB)": _safe_get(info, "priceToBook"), "市值": _safe_get(info, "marketCap"), "企業價值": _safe_get(info, "enterpriseValue"), "EV/EBITDA": _safe_get(info, "enterpriseToEbitda")}
        profitability = {"毛利率(%)": round(_safe_get(info, "grossMargins", default=0) * 100, 2) if _safe_get(info, "grossMargins") else None, "營業利益率(%)": round(_safe_get(info, "operatingMargins", default=0) * 100, 2) if _safe_get(info, "operatingMargins") else None, "淨利率(%)": round(_safe_get(info, "profitMargins", default=0) * 100, 2) if _safe_get(info, "profitMargins") else None, "ROE(%)": round(_safe_get(info, "returnOnEquity", default=0) * 100, 2) if _safe_get(info, "returnOnEquity") else None, "ROA(%)": round(_safe_get(info, "returnOnAssets", default=0) * 100, 2) if _safe_get(info, "returnOnAssets") else None, "每股盈餘(EPS)": _safe_get(info, "trailingEps"), "預估EPS": _safe_get(info, "forwardEps")}
        dividends = {"殖利率(%)": round(_safe_get(info, "dividendYield", default=0) * 100, 2) if _safe_get(info, "dividendYield") else None, "每股股利": _safe_get(info, "dividendRate"), "配息率(%)": round(_safe_get(info, "payoutRatio", default=0) * 100, 2) if _safe_get(info, "payoutRatio") else None}
        health = {"負債比率": _safe_get(info, "debtToEquity"), "流動比率": _safe_get(info, "currentRatio"), "速動比率": _safe_get(info, "quickRatio"), "自由現金流": _safe_get(info, "freeCashflow"), "營業現金流": _safe_get(info, "operatingCashflow"), "總收入": _safe_get(info, "totalRevenue"), "營收成長率(%)": round(_safe_get(info, "revenueGrowth", default=0) * 100, 2) if _safe_get(info, "revenueGrowth") else None, "盈餘成長率(%)": round(_safe_get(info, "earningsGrowth", default=0) * 100, 2) if _safe_get(info, "earningsGrowth") else None}
        div_history = []
        try:
            divs = ticker.dividends
            if not divs.empty:
                for date, amount in divs.tail(8).items():
                    div_history.append({"日期": date.strftime("%Y-%m-%d"), "每股股利": round(amount, 2)})
        except Exception:
            pass
        result = {"股票代號": ticker_str, "名稱": _safe_get(info, "longName", "shortName", default="N/A"), "估值指標": valuation, "獲利能力": profitability, "股利資訊": dividends, "財務健全度": health}
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
        holders_info = {"機構持股比例(%)": round(_safe_get(info, "heldPercentInstitutions", default=0) * 100, 2) if _safe_get(info, "heldPercentInstitutions") else None, "內部人持股比例(%)": round(_safe_get(info, "heldPercentInsiders", default=0) * 100, 2) if _safe_get(info, "heldPercentInsiders") else None, "融券比例": _safe_get(info, "shortPercentOfFloat"), "流通股數": _safe_get(info, "floatShares"), "總股數": _safe_get(info, "sharesOutstanding")}
        major_holders, inst_holders = [], []
        try:
            mh = ticker.major_holders
            if mh is not None and not mh.empty:
                for _, row in mh.iterrows():
                    major_holders.append({"比例": str(row.iloc[0]), "說明": str(row.iloc[1]) if len(row) > 1 else ""})
        except Exception:
            pass
        try:
            ih = ticker.institutional_holders
            if ih is not None and not ih.empty:
                for _, row in ih.head(10).iterrows():
                    inst_holders.append({"機構名稱": str(row.get("Holder", "")), "持股數": int(row.get("Shares", 0)) if row.get("Shares") else None, "持股比例(%)": round(row.get("pctHeld", 0) * 100, 2) if row.get("pctHeld") else None, "持股價值": int(row.get("Value", 0)) if row.get("Value") else None})
        except Exception:
            pass
        result = {"股票代號": ticker_str, "名稱": _safe_get(info, "longName", "shortName", default="N/A"), "持股概況": holders_info, "提示": "如需三大法人每日買賣超明細，請改用 get_institutional_daily 工具。"}
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
            results.append({"代號": ticker_str, "名稱": _safe_get(info, "longName", "shortName", default="N/A"), "現價": _safe_get(info, "regularMarketPrice"), "漲跌幅(%)": round(_safe_get(info, "regularMarketChangePercent", default=0), 2), "本益比(PE)": _safe_get(info, "trailingPE"), "股價淨值比(PB)": _safe_get(info, "priceToBook"), "殖利率(%)": round(_safe_get(info, "dividendYield", default=0) * 100, 2) if _safe_get(info, "dividendYield") else None, "ROE(%)": round(_safe_get(info, "returnOnEquity", default=0) * 100, 2) if _safe_get(info, "returnOnEquity") else None, "毛利率(%)": round(_safe_get(info, "grossMargins", default=0) * 100, 2) if _safe_get(info, "grossMargins") else None, "營收成長(%)": round(_safe_get(info, "revenueGrowth", default=0) * 100, 2) if _safe_get(info, "revenueGrowth") else None, "市值": _safe_get(info, "marketCap")})
        except Exception as e:
            results.append({"代號": sid, "error": str(e)})
    return json.dumps({"比較結果": results}, ensure_ascii=False, indent=2)

@mcp.tool()
def get_twse_market_summary() -> str:
    """取得台股大盤（加權指數）的即時概況與近期走勢。"""
    try:
        ticker = yf.Ticker("^TWII")
        info = ticker.info
        hist = ticker.history(period="1mo", interval="1d")
        summary = {"指數名稱": "加權指數 (TAIEX)", "現值": _safe_get(info, "regularMarketPrice"), "漲跌": _safe_get(info, "regularMarketChange"), "漲跌幅(%)": round(_safe_get(info, "regularMarketChangePercent", default=0), 2), "今日最高": _safe_get(info, "regularMarketDayHigh", "dayHigh"), "今日最低": _safe_get(info, "regularMarketDayLow", "dayLow"), "昨收": _safe_get(info, "regularMarketPreviousClose"), "52週最高": _safe_get(info, "fiftyTwoWeekHigh"), "52週最低": _safe_get(info, "fiftyTwoWeekLow")}
        if not hist.empty:
            summary["近10日走勢"] = [{"日期": d.strftime("%Y-%m-%d"), "收盤": round(row["Close"], 2), "成交量": int(row["Volume"])} for d, row in hist.tail(10).iterrows()]
        return json.dumps(summary, ensure_ascii=False, indent=2)
    except Exception as e:
        return json.dumps({"error": f"查詢大盤資訊時發生錯誤: {str(e)}"}, ensure_ascii=False)

# ====================================================================
# v1.6.0 工具 — 常用代號對照表
# ====================================================================

US_TICKER_ALIASES = {
    "SP500": "^GSPC", "S&P500": "^GSPC", "標普": "^GSPC", "標普500": "^GSPC",
    "NASDAQ": "^IXIC", "那斯達克": "^IXIC", "DJIA": "^DJI", "道瓊": "^DJI",
    "VIX": "^VIX", "恐慌指數": "^VIX", "SOX": "^SOX", "費半": "^SOX", "費城半導體": "^SOX",
    "SMH": "SMH", "QQQ": "QQQ", "SPY": "SPY", "DIA": "DIA",
    "TLT": "TLT", "HYG": "HYG", "GLD": "GLD", "SLV": "SLV",
    "NVDA": "NVDA", "輝達": "NVDA", "AAPL": "AAPL", "蘋果": "AAPL",
    "MSFT": "MSFT", "微軟": "MSFT", "GOOGL": "GOOGL", "谷歌": "GOOGL",
    "AMZN": "AMZN", "亞馬遜": "AMZN", "META": "META", "TSLA": "TSLA", "特斯拉": "TSLA",
    "TSM": "TSM", "台積電ADR": "TSM",
}

COMMODITY_ALIASES = {
    "黃金": "GC=F", "GOLD": "GC=F", "GC": "GC=F", "XAU": "GC=F",
    "白銀": "SI=F", "SILVER": "SI=F", "SI": "SI=F", "XAG": "SI=F",
    "鉑金": "PL=F", "PLATINUM": "PL=F",
    "原油": "CL=F", "WTI": "CL=F", "CL": "CL=F",
    "布蘭特原油": "BZ=F", "BRENT": "BZ=F", "BZ": "BZ=F",
    "天然氣": "NG=F", "NG": "NG=F",
    "銅": "HG=F", "COPPER": "HG=F", "HG": "HG=F",
    "鋁": "ALI=F", "ALUMINUM": "ALI=F",
    "黃豆": "ZS=F", "SOYBEAN": "ZS=F", "玉米": "ZC=F", "CORN": "ZC=F",
    "小麥": "ZW=F", "WHEAT": "ZW=F",
    "美元指數": "DX-Y.NYB", "DXY": "DX-Y.NYB",
}

@mcp.tool()
def get_us_market_quote(symbols: list[str]) -> str:
    """
    取得美股指數、個股或 ETF 的即時報價。一次可查詢多檔（最多 10 檔）。

    支援中文別名,例如:
    - 指數:「SP500」「NASDAQ」「道瓊」「VIX」「費半」
    - ETF:「SMH」「QQQ」「SPY」「GLD」「SLV」
    - 個股:「NVDA」「AAPL」「TSM」「台積電ADR」

    Args:
        symbols: 美股代號或中文別名列表,例如 ["SP500", "NASDAQ", "VIX", "NVDA"]
    """
    if len(symbols) > 10:
        return json.dumps({"error": "最多查詢 10 檔"}, ensure_ascii=False)
    results = []
    for sym in symbols:
        sym_upper = sym.strip().upper()
        ticker_str = US_TICKER_ALIASES.get(sym_upper, US_TICKER_ALIASES.get(sym.strip(), sym.strip()))
        try:
            ticker = yf.Ticker(ticker_str)
            info = ticker.info
            if not info or info.get("regularMarketPrice") is None:
                results.append({"代號": ticker_str, "查詢": sym, "error": "找不到資料"})
                continue
            entry = {"代號": ticker_str, "查詢": sym, "名稱": _safe_get(info, "longName", "shortName", default="N/A"), "現價": _safe_get(info, "regularMarketPrice", "currentPrice"), "漲跌": round(_safe_get(info, "regularMarketChange", default=0), 2), "漲跌幅(%)": round(_safe_get(info, "regularMarketChangePercent", default=0), 2), "開盤": _safe_get(info, "regularMarketOpen", "open"), "最高": _safe_get(info, "regularMarketDayHigh", "dayHigh"), "最低": _safe_get(info, "regularMarketDayLow", "dayLow"), "昨收": _safe_get(info, "regularMarketPreviousClose", "previousClose"), "成交量": _safe_get(info, "regularMarketVolume", "volume"), "52週最高": _safe_get(info, "fiftyTwoWeekHigh"), "52週最低": _safe_get(info, "fiftyTwoWeekLow")}
            pre = _safe_get(info, "preMarketPrice")
            post = _safe_get(info, "postMarketPrice")
            if pre:
                entry["盤前價"] = pre
                entry["盤前漲跌幅(%)"] = round(_safe_get(info, "preMarketChangePercent", default=0), 2)
            if post:
                entry["盤後價"] = post
                entry["盤後漲跌幅(%)"] = round(_safe_get(info, "postMarketChangePercent", default=0), 2)
            results.append(entry)
        except Exception as e:
            results.append({"代號": ticker_str, "查詢": sym, "error": str(e)})
    return json.dumps({"美股報價": results, "查詢時間": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}, ensure_ascii=False, indent=2)

@mcp.tool()
def get_commodity_quote(commodities: list[str]) -> str:
    """
    取得國際原物料期貨即時報價。一次可查詢多檔（最多 10 檔）。

    支援中文別名,例如:
    - 貴金屬:「黃金」「白銀」「鉑金」
    - 能源:「原油」(WTI)「布蘭特原油」「天然氣」
    - 金屬:「銅」「鋁」
    - 農產品:「黃豆」「玉米」「小麥」
    - 匯率指數:「美元指數」「DXY」

    Args:
        commodities: 原物料名稱或期貨代號列表,例如 ["黃金", "白銀", "原油", "銅"]
    """
    if len(commodities) > 10:
        return json.dumps({"error": "最多查詢 10 檔"}, ensure_ascii=False)
    results = []
    for name in commodities:
        name_clean = name.strip()
        ticker_str = COMMODITY_ALIASES.get(name_clean, COMMODITY_ALIASES.get(name_clean.upper(), name_clean))
        try:
            ticker = yf.Ticker(ticker_str)
            info = ticker.info
            if not info or info.get("regularMarketPrice") is None:
                results.append({"代號": ticker_str, "查詢": name, "error": "找不到資料"})
                continue
            entry = {"代號": ticker_str, "查詢": name, "名稱": _safe_get(info, "longName", "shortName", default="N/A"), "現價": _safe_get(info, "regularMarketPrice"), "漲跌": round(_safe_get(info, "regularMarketChange", default=0), 2), "漲跌幅(%)": round(_safe_get(info, "regularMarketChangePercent", default=0), 2), "開盤": _safe_get(info, "regularMarketOpen", "open"), "最高": _safe_get(info, "regularMarketDayHigh", "dayHigh"), "最低": _safe_get(info, "regularMarketDayLow", "dayLow"), "昨收": _safe_get(info, "regularMarketPreviousClose", "previousClose"), "52週最高": _safe_get(info, "fiftyTwoWeekHigh"), "52週最低": _safe_get(info, "fiftyTwoWeekLow")}
            hist = ticker.history(period="5d", interval="1d")
            if not hist.empty:
                entry["近5日走勢"] = [{"日期": d.strftime("%Y-%m-%d"), "收盤": round(row["Close"], 2)} for d, row in hist.iterrows()]
            results.append(entry)
        except Exception as e:
            results.append({"代號": ticker_str, "查詢": name, "error": str(e)})
    return json.dumps({"原物料報價": results, "查詢時間": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}, ensure_ascii=False, indent=2)

@mcp.tool()
def get_institutional_daily(trade_date: str = "") -> str:
    """
    取得三大法人每日買賣超金額（外資、投信、自營商）。

    資料來源:TWSE 證券交易所公開資訊。
    注意:當日數據通常在收盤後 15:00~16:00 後更新。

    Args:
        trade_date: 查詢日期,格式 "YYYYMMDD",例如 "20260317"。留空則查詢最近交易日。
    """
    try:
        if not trade_date:
            trade_date = _today_str()
        url = "https://www.twse.com.tw/rwd/zh/fund/BFI82U"
        params = {"date": trade_date, "response": "json"}
        data, trade_date = _find_recent_trade_date(url, params, trade_date)
        if not data or data.get("stat") != "OK" or not data.get("data"):
            return json.dumps({"error": f"無法取得 {trade_date} 的三大法人資料"}, ensure_ascii=False)
        rows = data["data"]
        result = {"查詢日期": f"{trade_date[:4]}-{trade_date[4:6]}-{trade_date[6:8]}", "資料標題": data.get("title", ""), "法人買賣超明細": []}
        total_buy = total_sell = 0
        for row in rows:
            name = row[0].strip() if len(row) > 0 else ""
            buy = row[1].replace(",", "").strip() if len(row) > 1 else "0"
            sell = row[2].replace(",", "").strip() if len(row) > 2 else "0"
            diff = row[3].replace(",", "").strip() if len(row) > 3 else "0"
            try:
                buy_val, sell_val, diff_val = int(buy), int(sell), int(diff)
            except ValueError:
                buy_val = sell_val = diff_val = 0
            result["法人買賣超明細"].append({"法人類別": name, "買進金額(元)": buy_val, "賣出金額(元)": sell_val, "買賣差額(元)": diff_val, "買進金額(億)": round(buy_val / 1e8, 2), "賣出金額(億)": round(sell_val / 1e8, 2), "買賣差額(億)": round(diff_val / 1e8, 2)})
            total_buy += buy_val
            total_sell += sell_val
        result["合計"] = {"買進總額(億)": round(total_buy / 1e8, 2), "賣出總額(億)": round(total_sell / 1e8, 2), "買賣差額(億)": round((total_buy - total_sell) / 1e8, 2)}
        result["使用提示"] = "此工具回傳大盤三大法人每日買賣超彙總。如需個股法人進出明細，請搭配 get_institutional_trading 或 WebSearch。"
        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception as e:
        return json.dumps({"error": f"查詢三大法人買賣超時發生錯誤: {str(e)}"}, ensure_ascii=False)

@mcp.tool()
def get_margin_trading(trade_date: str = "") -> str:
    """
    取得台股融資融券餘額變化（整體市場）。

    資料來源:TWSE 證券交易所公開資訊。
    回傳融資餘額、融券餘額、融資增減、融券增減等資金面數據。

    Args:
        trade_date: 查詢日期,格式 "YYYYMMDD",例如 "20260317"。留空則查詢最近交易日。
    """
    try:
        if not trade_date:
            trade_date = _today_str()
        url = "https://www.twse.com.tw/rwd/zh/marginTrading/MI_MARGN"
        params = {"date": trade_date, "response": "json", "selectType": "MS"}
        data, trade_date = _find_recent_trade_date(url, params, trade_date, data_key=None)
        if not data or data.get("stat") != "OK":
            return json.dumps({"error": f"無法取得 {trade_date} 的融資融券資料"}, ensure_ascii=False)
        result = {"查詢日期": f"{trade_date[:4]}-{trade_date[4:6]}-{trade_date[6:8]}", "資料標題": data.get("title", "")}
        credit_list = data.get("creditList", [])
        if credit_list:
            result["融資融券彙總"] = [{"項目": row[0].strip(), "買進": row[1].replace(",", "").strip(), "賣出": row[2].replace(",", "").strip(), "現金(券)償還": row[3].replace(",", "").strip(), "前日餘額": row[4].replace(",", "").strip(), "今日餘額": row[5].replace(",", "").strip(), "增減": row[6].replace(",", "").strip() if len(row) > 6 else "0"} for row in credit_list if len(row) >= 7]
        margin_list = data.get("marginList", [])
        if margin_list:
            result["融資金額"] = [{"項目": row[0].strip(), "金額(仟元)": row[1].replace(",", "").strip()} for row in margin_list if len(row) >= 2]
        result["使用說明"] = "融資餘額增加通常代表散戶看多加碼；融資餘額減少可能代表多方信心不足或主力洗盤。融券餘額增加代表放空力道增強。"
        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception as e:
        return json.dumps({"error": f"查詢融資融券資料時發生錯誤: {str(e)}"}, ensure_ascii=False)


# ====================================================================
# v2.0.0 新增工具
# ====================================================================

@mcp.tool()
def get_futures_oi(trade_date: str = "") -> str:
    """
    取得台指期貨與選擇權的籌碼數據，包含三大法人（特別是外資）的期貨未平倉量、
    選擇權 Put/Call Ratio 等。這是判斷大盤多空方向的重要領先指標。

    資料來源：TAIFEX 台灣期貨交易所公開資訊。
    注意：當日數據通常在收盤後 15:00~16:00 後更新。

    Args:
        trade_date: 查詢日期,格式 "YYYYMMDD",例如 "20260317"。留空則查詢最近交易日。
    """
    try:
        if not trade_date:
            trade_date = _today_str()
        date_slash = f"{trade_date[:4]}/{trade_date[4:6]}/{trade_date[6:8]}"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "Accept": "*/*"}
        result = {"查詢日期": f"{trade_date[:4]}-{trade_date[4:6]}-{trade_date[6:8]}"}

        # 1. 三大法人期貨未平倉（台指期）
        try:
            resp = requests.get("https://www.taifex.com.tw/cht/3/futContractsDateDown", params={"queryDate": date_slash, "commodityId": "TXF"}, headers=headers, timeout=15)
            if resp.status_code == 200:
                lines = [l for l in resp.text.strip().split("\n") if l.strip()]
                if len(lines) > 1:
                    futures_data = []
                    for line in lines[1:]:
                        cols = [c.strip().strip('"') for c in line.split(",")]
                        if len(cols) >= 9 and ("臺股期貨" in cols[1] or "股期貨" in cols[1]):
                            def _safe_int_div(s, divisor=1e4):
                                s = s.replace(",", "")
                                return round(int(s) / divisor, 2) if s.lstrip("-").isdigit() else s
                            futures_data.append({"身份別": cols[2], "多方口數": cols[3].replace(",", ""), "多方契約金額(億)": _safe_int_div(cols[4]), "空方口數": cols[5].replace(",", ""), "空方契約金額(億)": _safe_int_div(cols[6]), "多空淨額口數": cols[7].replace(",", ""), "多空淨額金額(億)": _safe_int_div(cols[8])})
                    if futures_data:
                        result["台指期三大法人未平倉"] = futures_data
        except Exception:
            pass

        # 2. 選擇權 Put/Call Ratio
        try:
            resp = requests.get("https://www.taifex.com.tw/cht/3/pcRatioDown", params={"queryStartDate": date_slash, "queryEndDate": date_slash}, headers=headers, timeout=15)
            if resp.status_code == 200:
                lines = [l for l in resp.text.strip().split("\n") if l.strip()]
                if len(lines) > 1:
                    cols = [c.strip().strip('"') for c in lines[1].split(",")]
                    if len(cols) >= 7:
                        result["選擇權Put/Call_Ratio"] = {"日期": cols[0], "賣權成交量": cols[1].replace(",", ""), "買權成交量": cols[2].replace(",", ""), "成交量PC_Ratio(%)": cols[3], "賣權未平倉量": cols[4].replace(",", ""), "買權未平倉量": cols[5].replace(",", ""), "未平倉量PC_Ratio(%)": cols[6]}
        except Exception:
            pass

        # 3. 外資選擇權未平倉
        try:
            resp = requests.get("https://www.taifex.com.tw/cht/3/callsAndPutsDateDown", params={"queryDate": date_slash, "commodityId": "TXO"}, headers=headers, timeout=15)
            if resp.status_code == 200:
                lines = [l for l in resp.text.strip().split("\n") if l.strip()]
                if len(lines) > 1:
                    opt_data = []
                    for line in lines[1:]:
                        cols = [c.strip().strip('"') for c in line.split(",")]
                        if len(cols) >= 10 and ("臺指選擇權" in cols[1] or "指選擇權" in cols[1]):
                            def _safe_int_div2(s, divisor=1e4):
                                s = s.replace(",", "")
                                return round(int(s) / divisor, 2) if s.lstrip("-").isdigit() else s
                            opt_data.append({"買賣權": cols[2], "身份別": cols[3], "多方口數": cols[4].replace(",", ""), "多方契約金額(億)": _safe_int_div2(cols[5]), "空方口數": cols[6].replace(",", ""), "空方契約金額(億)": _safe_int_div2(cols[7]), "多空淨額口數": cols[8].replace(",", ""), "多空淨額金額(億)": _safe_int_div2(cols[9])})
                    if opt_data:
                        result["台指選擇權三大法人未平倉"] = opt_data
        except Exception:
            pass

        # 若沒抓到任何資料，嘗試往前找
        if "台指期三大法人未平倉" not in result and "選擇權Put/Call_Ratio" not in result:
            dt = datetime.datetime.strptime(trade_date, "%Y%m%d")
            for i in range(1, 8):
                prev = (dt - datetime.timedelta(days=i)).strftime("%Y%m%d")
                retry = json.loads(get_futures_oi(prev))
                if "台指期三大法人未平倉" in retry or "選擇權Put/Call_Ratio" in retry:
                    return json.dumps(retry, ensure_ascii=False, indent=2)
            result["error"] = "無法取得期貨選擇權資料，可能為假日或資料尚未更新"

        result["使用說明"] = "外資台指期淨多單增加→外資看多；淨空單增加→外資看空。Put/Call Ratio>1代表市場偏悲觀，<0.7代表偏樂觀。未平倉PCR比成交量PCR更能反映中期趨勢。"
        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception as e:
        return json.dumps({"error": f"查詢期貨選擇權籌碼時發生錯誤: {str(e)}"}, ensure_ascii=False)


@mcp.tool()
def get_monthly_revenue(stock_id: str, months: int = 6) -> str:
    """
    取得台股個股的月營收數據（來自 MOPS 公開資訊觀測站）。
    月營收是台股最高頻的基本面指標，每月 10 日前公布上月營收。

    Args:
        stock_id: 台股代號,例如 "2330"
        months: 查詢最近幾個月的營收,預設 6 個月,最多 24 個月
    """
    try:
        stock_id = stock_id.strip().split(".")[0]
        months = min(months, 24)
        results = []
        today = datetime.date.today()

        for i in range(months):
            target_month = today.month - 1 - i
            target_year = today.year
            while target_month <= 0:
                target_month += 12
                target_year -= 1
            roc_year = target_year - 1911

            for typek in ["sii", "otc"]:
                try:
                    resp = requests.post("https://mops.twse.com.tw/server-java/t21sc03", data={"encodeURIComponent": 1, "step": 1, "firstin": 1, "off": 1, "TYPEK": typek, "year": str(roc_year), "month": str(target_month).zfill(2)}, headers={"User-Agent": "Mozilla/5.0", "Content-Type": "application/x-www-form-urlencoded"}, timeout=15)
                    if resp.status_code != 200:
                        continue
                    text = resp.text
                    pattern = rf'<td[^>]*>\s*{re.escape(stock_id)}\s*</td>'
                    match = re.search(pattern, text)
                    if not match:
                        continue
                    row_start = text.rfind("<tr", 0, match.start())
                    row_end = text.find("</tr>", match.end())
                    if row_start < 0 or row_end < 0:
                        continue
                    cells = re.findall(r'<td[^>]*>(.*?)</td>', text[row_start:row_end], re.DOTALL)
                    cells = [c.strip().replace(",", "").replace("&nbsp;", "").replace("\xa0", "") for c in cells]
                    if len(cells) >= 10:
                        def _to_int(s):
                            return int(s) if s.lstrip("-").isdigit() else None
                        def _to_float(s):
                            try:
                                return float(s)
                            except (ValueError, TypeError):
                                return None
                        results.append({"年月": f"{target_year}-{str(target_month).zfill(2)}", "公司代號": cells[0] or stock_id, "公司名稱": cells[1] if len(cells) > 1 else "", "當月營收(千元)": _to_int(cells[2]) if len(cells) > 2 else None, "上月營收(千元)": _to_int(cells[3]) if len(cells) > 3 else None, "去年同月營收(千元)": _to_int(cells[4]) if len(cells) > 4 else None, "月增率(%)": _to_float(cells[5]) if len(cells) > 5 else None, "年增率(%)": _to_float(cells[6]) if len(cells) > 6 else None, "累計營收(千元)": _to_int(cells[7]) if len(cells) > 7 else None, "去年累計營收(千元)": _to_int(cells[8]) if len(cells) > 8 else None, "累計年增率(%)": _to_float(cells[9]) if len(cells) > 9 else None})
                        break  # Found in this typek, no need to try next
                except Exception:
                    continue

        if not results:
            return json.dumps({"error": f"無法取得 {stock_id} 的月營收資料。可能原因：代號錯誤、ETF 無月營收、或 MOPS 暫時無法連線", "建議": f"可改用 WebSearch 搜尋「{stock_id} 月營收」"}, ensure_ascii=False)

        trend = {}
        if len(results) >= 2 and results[0].get("當月營收(千元)") and results[1].get("當月營收(千元)"):
            trend["最新月營收趨勢"] = "月增" if results[0]["當月營收(千元)"] > results[1]["當月營收(千元)"] else "月減"
        if results[0].get("年增率(%)") is not None:
            yr = results[0]["年增率(%)"]
            trend["營收成長評價"] = "🔥 高速成長" if yr > 20 else ("📈 穩定成長" if yr > 0 else ("📉 微幅衰退" if yr > -10 else "⚠️ 明顯衰退"))

        return json.dumps({"股票代號": stock_id, "查詢月數": months, "趨勢摘要": trend or "資料不足", "月營收數據": results}, ensure_ascii=False, indent=2, default=str)
    except Exception as e:
        return json.dumps({"error": f"查詢 {stock_id} 月營收時發生錯誤: {str(e)}"}, ensure_ascii=False)


@mcp.tool()
def calculate_technical_indicators(stock_id: str, period: str = "6mo") -> str:
    """
    計算台股個股的常用技術指標，包含 KD（隨機指標）、MACD、RSI、布林通道、均線排列。
    直接回傳計算結果與技術面判讀，不需要在 Skill 中另外寫 Python。

    Args:
        stock_id: 台股代號,例如 "2330"
        period: 計算用的歷史數據範圍,預設 "6mo",建議至少 "3mo"
    """
    try:
        ticker, ticker_str = _try_ticker(stock_id)
        hist = ticker.history(period=period, interval="1d")
        if hist.empty or len(hist) < 20:
            return json.dumps({"error": f"歷史數據不足（需至少 20 天），{stock_id} 僅有 {len(hist)} 天"}, ensure_ascii=False)

        close = hist["Close"].values.astype(float)
        high = hist["High"].values.astype(float)
        low = hist["Low"].values.astype(float)
        volume = hist["Volume"].values.astype(float)
        dates = [d.strftime("%Y-%m-%d") for d in hist.index]
        result = {"股票代號": ticker_str, "計算期間": period, "資料筆數": len(close), "最新收盤價": round(float(close[-1]), 2), "最新日期": dates[-1]}

        # 均線
        ma = {}
        for name, n in [("5日", 5), ("10日", 10), ("20日(月線)", 20), ("60日(季線)", 60), ("120日(半年線)", 120), ("240日(年線)", 240)]:
            if len(close) >= n:
                ma[name] = round(float(np.mean(close[-n:])), 2)
        result["均線"] = ma
        avail = [ma.get(k) for k in ["5日", "10日", "20日(月線)", "60日(季線)"] if k in ma]
        if len(avail) >= 3:
            if all(avail[i] >= avail[i+1] for i in range(len(avail)-1)):
                result["均線排列"] = "✅ 多頭排列（短均線 > 長均線）"
            elif all(avail[i] <= avail[i+1] for i in range(len(avail)-1)):
                result["均線排列"] = "❌ 空頭排列（短均線 < 長均線）"
            else:
                result["均線排列"] = "⚠️ 糾結整理"

        # KD 指標 (9日)
        n = 9
        if len(close) >= n:
            rsv_list = []
            for i in range(n - 1, len(close)):
                h, l = max(high[i-n+1:i+1]), min(low[i-n+1:i+1])
                rsv_list.append((close[i] - l) / (h - l) * 100 if h != l else 50.0)
            k_vals, d_vals = [50.0], [50.0]
            for rsv in rsv_list:
                k_vals.append(2/3 * k_vals[-1] + 1/3 * rsv)
                d_vals.append(2/3 * d_vals[-1] + 1/3 * k_vals[-1])
            ck, cd = round(k_vals[-1], 2), round(d_vals[-1], 2)
            sig = "✅ K線上穿D線（黃金交叉）" if ck > cd and k_vals[-2] <= d_vals[-2] else ("❌ K線下穿D線（死亡交叉）" if ck < cd and k_vals[-2] >= d_vals[-2] else ("⚠️ 超買區（K>80）" if ck > 80 else ("⚠️ 超賣區（K<20）" if ck < 20 else "中性區間")))
            result["KD指標"] = {"K值": ck, "D值": cd, "訊號": sig}

        # RSI (14日)
        rn = 14
        if len(close) >= rn + 1:
            d = np.diff(close)
            g, l = np.where(d > 0, d, 0), np.where(d < 0, -d, 0)
            ag, al = np.mean(g[:rn]), np.mean(l[:rn])
            for i in range(rn, len(d)):
                ag = (ag * (rn-1) + g[i]) / rn
                al = (al * (rn-1) + l[i]) / rn
            rsi = round(100.0 if al == 0 else 100 - 100 / (1 + ag / al), 2)
            sig = "⚠️ 超買（RSI>70）" if rsi > 70 else ("⚠️ 超賣（RSI<30）" if rsi < 30 else ("偏多（RSI>50）" if rsi > 50 else "偏空（RSI<50）"))
            result["RSI指標"] = {"RSI(14)": rsi, "訊號": sig}

        # MACD (12,26,9)
        if len(close) >= 26:
            ema12 = pd.Series(close).ewm(span=12, adjust=False).mean().values
            ema26 = pd.Series(close).ewm(span=26, adjust=False).mean().values
            dif = ema12 - ema26
            macd_sig = pd.Series(dif).ewm(span=9, adjust=False).mean().values
            osc = dif - macd_sig
            cd, cm, co, po = round(float(dif[-1]), 4), round(float(macd_sig[-1]), 4), round(float(osc[-1]), 4), round(float(osc[-2]), 4)
            if cd > cm and float(dif[-2]) <= float(macd_sig[-2]):
                mt = "✅ DIF上穿MACD（黃金交叉，偏多）"
            elif cd < cm and float(dif[-2]) >= float(macd_sig[-2]):
                mt = "❌ DIF下穿MACD（死亡交叉，偏空）"
            elif co > 0 and co > po:
                mt = "📈 柱狀體正值放大（多方動能增強）"
            elif co > 0:
                mt = "⚠️ 柱狀體正值縮小（多方動能減弱）"
            elif co < po:
                mt = "📉 柱狀體負值放大（空方動能增強）"
            else:
                mt = "柱狀體負值縮小（空方減弱，可能反轉）"
            result["MACD指標"] = {"DIF": cd, "MACD": cm, "柱狀體(OSC)": co, "訊號": mt}

        # 布林通道 (20日, 2σ)
        if len(close) >= 20:
            bm = float(np.mean(close[-20:]))
            bs = float(np.std(close[-20:], ddof=1))
            bu, bl = round(bm + 2*bs, 2), round(bm - 2*bs, 2)
            cp = float(close[-1])
            bp = "⚠️ 突破上軌" if cp > bu else ("⚠️ 跌破下軌" if cp < bl else ("中軌之上（偏多）" if cp > bm else "中軌之下（偏空）"))
            result["布林通道"] = {"上軌": bu, "中軌": round(bm, 2), "下軌": bl, "帶寬(%)": round((bu - bl) / bm * 100, 2), "位置": bp}

        # 量能
        if len(volume) >= 5:
            v5 = round(float(np.mean(volume[-5:])))
            v20 = round(float(np.mean(volume[-20:]))) if len(volume) >= 20 else None
            cv = int(volume[-1])
            vs = "🔥 爆量" if v20 and cv > v20 * 1.5 else ("📉 量縮" if v20 and cv < v20 * 0.5 else "正常量能")
            result["量能分析"] = {"今日成交量": cv, "5日均量": v5, "20日均量": v20, "訊號": vs}

        # 支撐壓力
        if len(close) >= 20:
            rh, rl = round(float(max(high[-20:])), 2), round(float(min(low[-20:])), 2)
            result["近20日支撐壓力"] = {"壓力位": rh, "支撐位": rl, "現價位置": f"距壓力 {round((rh - float(close[-1])) / float(close[-1]) * 100, 2)}% / 距支撐 {round((float(close[-1]) - rl) / float(close[-1]) * 100, 2)}%"}

        # 綜合評分
        score = 0
        if "均線排列" in result:
            score += 1 if "多頭" in result["均線排列"] else (-1 if "空頭" in result["均線排列"] else 0)
        if "KD指標" in result:
            score += 1 if "黃金交叉" in result["KD指標"]["訊號"] or "超賣" in result["KD指標"]["訊號"] else (-1 if "死亡交叉" in result["KD指標"]["訊號"] or "超買" in result["KD指標"]["訊號"] else 0)
        if "RSI指標" in result:
            score += 1 if result["RSI指標"]["RSI(14)"] > 50 else -1
        if "MACD指標" in result:
            score += 1 if "偏多" in result["MACD指標"]["訊號"] or "黃金交叉" in result["MACD指標"]["訊號"] else (-1 if "偏空" in result["MACD指標"]["訊號"] or "死亡交叉" in result["MACD指標"]["訊號"] else 0)
        result["技術面綜合判斷"] = "✅ 強勢偏多" if score >= 3 else ("📈 偏多" if score >= 1 else ("❌ 強勢偏空" if score <= -3 else ("📉 偏空" if score <= -1 else "⚠️ 中性觀望")))

        return json.dumps(result, ensure_ascii=False, indent=2, default=str)
    except Exception as e:
        return json.dumps({"error": f"計算 {stock_id} 技術指標時發生錯誤: {str(e)}"}, ensure_ascii=False)


@mcp.tool()
def get_dividend_calendar(month: str = "") -> str:
    """
    取得台股近期除權息行事曆，包含除息日、配息金額等資訊。

    Args:
        month: 查詢月份,格式 "YYYYMM",例如 "202603"。留空則查詢當月。
    """
    try:
        if not month:
            month = datetime.date.today().strftime("%Y%m")
        year, mon = int(month[:4]), int(month[4:6])
        last_day = 28 if mon == 2 else (30 if mon in [4,6,9,11] else 31)

        url = "https://www.twse.com.tw/rwd/zh/exRight/TWT49U"
        params = {"response": "json", "strDate": f"{year}{str(mon).zfill(2)}01", "endDate": f"{year}{str(mon).zfill(2)}{last_day}"}
        data = _twse_request(url, params)

        results = []
        if data and data.get("stat") == "OK" and data.get("data"):
            for row in data["data"]:
                if len(row) >= 8:
                    results.append({"除息日": row[0], "股票代號": row[1], "股票名稱": row[2], "除權息": row[3] if len(row) > 3 else "", "無償配股率": row[4] if len(row) > 4 else "", "現金增資配股率": row[5] if len(row) > 5 else "", "現金增資認購價": row[6] if len(row) > 6 else "", "現金股利": row[7] if len(row) > 7 else "", "參考價": row[8] if len(row) > 8 else ""})

        if not results:
            return json.dumps({"查詢月份": f"{year}-{str(mon).zfill(2)}", "message": "本月暫無除權息資料或資料尚未公布", "建議": "可用 WebSearch 搜尋「台股 除息 行事曆」"}, ensure_ascii=False, indent=2)

        return json.dumps({"查詢月份": f"{year}-{str(mon).zfill(2)}", "除權息筆數": len(results), "除權息行事曆": results, "使用說明": "買入最後日通常為除息日前一個交易日。想參與除息需在最後買進日（含）前買入。"}, ensure_ascii=False, indent=2)
    except Exception as e:
        return json.dumps({"error": f"查詢除權息行事曆時發生錯誤: {str(e)}"}, ensure_ascii=False)


@mcp.tool()
def get_sector_performance(trade_date: str = "") -> str:
    """
    取得台股各類股（產業別）的漲跌排行與表現，用於判斷資金輪動方向。

    Args:
        trade_date: 查詢日期,格式 "YYYYMMDD"。留空則查詢最近交易日。
    """
    try:
        if not trade_date:
            trade_date = _today_str()
        url = "https://www.twse.com.tw/rwd/zh/TAIEX/MI_5MINS_INDEX"
        params = {"date": trade_date, "response": "json"}
        data, trade_date = _find_recent_trade_date(url, params, trade_date)

        output = {"查詢日期": f"{trade_date[:4]}-{trade_date[4:6]}-{trade_date[6:8]}"}

        if data and data.get("data"):
            fields = data.get("fields", [])
            output["TWSE類股行情"] = [dict(zip([f.strip() for f in fields], [v.strip() if isinstance(v, str) else v for v in row])) for row in data["data"][:30]]

        # 補充主要類股 ETF 表現
        etf_perf = []
        for name, t in [("半導體", "00891.TW"), ("金融", "0055.TW"), ("台灣50", "0050.TW"), ("中型100", "0051.TW"), ("高股息", "0056.TW")]:
            try:
                info = yf.Ticker(t).info
                if info and info.get("regularMarketPrice"):
                    etf_perf.append({"類股": name, "ETF代號": t.replace(".TW", ""), "現價": _safe_get(info, "regularMarketPrice"), "漲跌幅(%)": round(_safe_get(info, "regularMarketChangePercent", default=0), 2)})
            except Exception:
                continue
        if etf_perf:
            etf_perf.sort(key=lambda x: x.get("漲跌幅(%)", 0), reverse=True)
            output["主要類股ETF表現"] = etf_perf

        output["使用說明"] = "領漲類股代表資金流入方向，領跌類股代表資金流出。搭配法人動向判斷資金輪動趨勢。"
        return json.dumps(output, ensure_ascii=False, indent=2)
    except Exception as e:
        return json.dumps({"error": f"查詢類股排行時發生錯誤: {str(e)}"}, ensure_ascii=False)


@mcp.tool()
def get_exchange_rate(currencies: list[str] = None) -> str:
    """
    取得主要貨幣兌台幣的匯率及近期走勢。

    Args:
        currencies: 貨幣列表,例如 ["USD", "JPY", "CNY"]。
                    留空則查詢美元、日圓、人民幣、歐元。
                    支援: USD, JPY, EUR, CNY, GBP, AUD, HKD, KRW
    """
    try:
        if not currencies:
            currencies = ["USD", "JPY", "EUR", "CNY"]
        fx_map = {"USD": "USDTWD=X", "美元": "USDTWD=X", "JPY": "JPYTWD=X", "日圓": "JPYTWD=X", "EUR": "EURTWD=X", "歐元": "EURTWD=X", "CNY": "CNYTWD=X", "人民幣": "CNYTWD=X", "GBP": "GBPTWD=X", "英鎊": "GBPTWD=X", "AUD": "AUDTWD=X", "澳幣": "AUDTWD=X", "HKD": "HKDTWD=X", "港幣": "HKDTWD=X", "KRW": "KRWTWD=X", "韓元": "KRWTWD=X"}
        results = []
        for c in currencies:
            ts = fx_map.get(c.strip().upper(), fx_map.get(c.strip(), f"{c.strip().upper()}TWD=X"))
            try:
                t = yf.Ticker(ts)
                info = t.info
                if not info or info.get("regularMarketPrice") is None:
                    results.append({"貨幣": c, "error": "找不到匯率資料"})
                    continue
                entry = {"貨幣": c, "即期匯率(兌台幣)": _safe_get(info, "regularMarketPrice"), "漲跌": round(_safe_get(info, "regularMarketChange", default=0), 4), "漲跌幅(%)": round(_safe_get(info, "regularMarketChangePercent", default=0), 2), "今日最高": _safe_get(info, "regularMarketDayHigh"), "今日最低": _safe_get(info, "regularMarketDayLow"), "昨收": _safe_get(info, "regularMarketPreviousClose")}
                hist = t.history(period="5d", interval="1d")
                if not hist.empty:
                    entry["近5日走勢"] = [{"日期": d.strftime("%Y-%m-%d"), "收盤": round(row["Close"], 4)} for d, row in hist.iterrows()]
                results.append(entry)
            except Exception as e:
                results.append({"貨幣": c, "error": str(e)})
        return json.dumps({"匯率資訊": results, "查詢時間": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "使用說明": "台幣升值（數字變小）對出口股不利但利於進口股。外資匯入推升台幣，匯出使台幣貶值。"}, ensure_ascii=False, indent=2)
    except Exception as e:
        return json.dumps({"error": f"查詢匯率時發生錯誤: {str(e)}"}, ensure_ascii=False)


# ====================================================================
# Entry point
# ====================================================================

if __name__ == "__main__":
    mcp.run(transport="stdio")
