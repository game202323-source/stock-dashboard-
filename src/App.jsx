import { useState, useMemo } from "react";
import { stocks, sectors } from "./data/stocks";
import "./App.css";

function formatWon(n) {
  return n.toLocaleString("ko-KR") + "원";
}

function StockRow({ stock }) {
  const { name, current, target } = stock;
  const max = Math.max(current, target);
  const currentPct = (current / max) * 100;
  const targetPct = (target / max) * 100;
  const diffPct = ((target - current) / current) * 100;
  const isOver = diffPct <= 0;

  return (
    <div className="stock-row">
      <div className="stock-header">
        <span className="stock-name">{name}</span>
        <span className={`badge ${isOver ? "badge-over" : "badge-upside"}`}>
          {isOver
            ? `목표 초과 ${Math.abs(diffPct).toFixed(1)}%`
            : `여력 +${diffPct.toFixed(1)}%`}
        </span>
      </div>

      <div className="bar-line">
        <span className="bar-label">현재가</span>
        <div className="bar-track">
          <div
            className="bar-fill bar-current"
            style={{ width: `${currentPct}%` }}
          />
        </div>
        <span className="bar-value">{formatWon(current)}</span>
      </div>

      <div className="bar-line">
        <span className="bar-label">목표가</span>
        <div className="bar-track">
          <div
            className="bar-fill bar-target"
            style={{ width: `${targetPct}%` }}
          />
        </div>
        <span className="bar-value">{formatWon(target)}</span>
      </div>
    </div>
  );
}

function App() {
  const [activeSector, setActiveSector] = useState("전체");

  const filtered = useMemo(() => {
    if (activeSector === "전체") return stocks;
    return stocks.filter((s) => s.sector === activeSector);
  }, [activeSector]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>AI 반도체 밸류체인 대시보드</h1>
        <p className="subtitle">
          AI반도체 · 장비 · 데이터센터 · 광통신 22개 종목 현재가 &amp; 목표주가
        </p>
      </header>

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
      </div>

      <main className="stock-list">
        {filtered.map((stock) => (
          <StockRow key={stock.name} stock={stock} />
        ))}
      </main>

      <footer className="app-footer">
        <p>※ 데이터는 예시(placeholder)이며, src/data/stocks.js에서 직접 수정할 수 있습니다.</p>
      </footer>
    </div>
  );
}

export default App;
