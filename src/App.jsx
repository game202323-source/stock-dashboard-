import { useEffect, useState, useMemo, useCallback } from "react";
import { sectors } from "./data/stocks";
import marketComments from "./data/marketComments.json";
import "./App.css";

function formatCommentDate(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${y}.${m}.${d}`;
}

function MarketComments() {
  const sorted = useMemo(
    () => [...marketComments].sort((a, b) => (a.date < b.date ? 1 : -1)),
    []
  );

  if (sorted.length === 0) return null;

  return (
    <section className="market-comments">
      <h2 className="section-title">오늘의 시장 코멘트</h2>
      <ul className="comment-list">
        {sorted.map((entry) => (
          <li key={entry.date} className="comment-item">
            <span className="comment-date">{formatCommentDate(entry.date)}</span>
            <p className="comment-text">{entry.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatPrice(value, currency) {
  if (value == null) return "-";
  if (currency === "KRW") {
    return Math.round(value).toLocaleString("ko-KR") + "원";
  }
  return "$" + value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function StockRow({ stock }) {
  const { name, ticker, current, target, currency, error } = stock;

  if (error || current == null) {
    return (
      <div className="stock-row">
        <div className="stock-header">
          <span className="stock-name">
            {name} <span className="stock-ticker">{ticker}</span>
          </span>
          <span className="badge badge-na">시세 불러오기 실패</span>
        </div>
      </div>
    );
  }

  const hasTarget = target != null;
  const max = hasTarget ? Math.max(current, target) : current;
  const currentPct = (current / max) * 100;
  const targetPct = hasTarget ? (target / max) * 100 : 0;
  const diffPct = hasTarget ? ((target - current) / current) * 100 : null;
  const isOver = diffPct != null && diffPct <= 0;

  return (
    <div className="stock-row">
      <div className="stock-header">
        <span className="stock-name">
          {name} <span className="stock-ticker">{ticker}</span>
        </span>
        {diffPct == null ? (
          <span className="badge badge-na">컨센서스 없음</span>
        ) : (
          <span className={`badge ${isOver ? "badge-over" : "badge-upside"}`}>
            {isOver
              ? `목표가 초과 +${Math.abs(diffPct).toFixed(1)}%`
              : `여력 ${diffPct.toFixed(1)}%`}
          </span>
        )}
      </div>

      <div className="bar-line">
        <span className="bar-label">현재가</span>
        <div className="bar-track">
          <div
            className="bar-fill bar-current"
            style={{ width: `${currentPct}%` }}
          />
        </div>
        <span className="bar-value">{formatPrice(current, currency)}</span>
      </div>

      {hasTarget && (
        <div className="bar-line">
          <span className="bar-label">목표가</span>
          <div className="bar-track">
            <div
              className="bar-fill bar-target"
              style={{ width: `${targetPct}%` }}
            />
          </div>
          <span className="bar-value">{formatPrice(target, currency)}</span>
        </div>
      )}
    </div>
  );
}

function App() {
  const [activeSector, setActiveSector] = useState("전체");
  const [stocks, setStocks] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/stocks");
      if (!res.ok) throw new Error("bad response");
      const data = await res.json();
      setStocks(data.stocks);
      setUpdatedAt(data.updatedAt);
      setStatus("ready");
    } catch (e) {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (activeSector === "전체") return stocks;
    return stocks.filter((s) => s.sector === activeSector);
  }, [activeSector, stocks]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>AI 반도체 밸류체인 대시보드</h1>
        <p className="subtitle">
          AI반도체 · 장비 · 데이터센터 · 광통신 21개 종목 현재가 &amp; 목표주가
        </p>
      </header>

      <MarketComments />

      <nav className="tabs">
        {sectors.map((sector) => (
          <button
            key={sector}
            className={`tab ${activeSector === sector ? "tab-active" : ""}`}
            onClick={() => setActiveSector(sector)}
          >
            {sector}
          </button>
        ))}
      </nav>

      <div className="legend">
        <span className="legend-item">
          <span className="legend-dot legend-current" /> 현재가
        </span>
        <span className="legend-item">
          <span className="legend-dot legend-target" /> 목표주가
        </span>
        <button className="refresh-btn" onClick={load} disabled={status === "loading"}>
          {status === "loading" ? "불러오는 중..." : "새로고침"}
        </button>
      </div>

      <main className="stock-list">
        {status === "error" && (
          <div className="status-message status-error">
            데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
          </div>
        )}
        {status === "loading" && stocks.length === 0 && (
          <div className="status-message">시세를 불러오는 중입니다...</div>
        )}
        {filtered.map((stock) => (
          <StockRow key={stock.ticker} stock={stock} />
        ))}
      </main>

      <footer className="app-footer">
        <p>
          ※ 현재가는 실시간(지연) 시세, 목표주가는 Yahoo Finance 애널리스트
          컨센서스 기준입니다. 일부 종목은 분석 커버리지가 없어 목표주가가
          제공되지 않을 수 있습니다.
        </p>
        {updatedAt && (
          <p>마지막 업데이트: {new Date(updatedAt).toLocaleTimeString("ko-KR")}</p>
        )}
      </footer>
    </div>
  );
}

export default App;
