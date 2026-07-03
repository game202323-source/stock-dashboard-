// Vercel 서버리스 함수: Yahoo Finance 비공식 API로 현재가 · 목표주가(애널리스트 컨센서스)를 가져옵니다.
const TICKERS = [
  // AI반도체
  { name: "엔비디아", sector: "AI반도체", ticker: "NVDA" },
  { name: "브로드컴", sector: "AI반도체", ticker: "AVGO" },
  { name: "AMD", sector: "AI반도체", ticker: "AMD" },
  { name: "TSMC", sector: "AI반도체", ticker: "TSM" },
  { name: "마이크론", sector: "AI반도체", ticker: "MU" },
  { name: "마벨테크놀로지", sector: "AI반도체", ticker: "MRVL" },

  // 장비
  { name: "ASML", sector: "장비", ticker: "ASML" },
  { name: "어플라이드머티어리얼즈", sector: "장비", ticker: "AMAT" },
  { name: "램리서치", sector: "장비", ticker: "LRCX" },
  { name: "KLA", sector: "장비", ticker: "KLAC" },

  // 데이터센터
  { name: "버티브", sector: "데이터센터", ticker: "VRT" },
  { name: "이튼", sector: "데이터센터", ticker: "ETN" },
  { name: "GE버노바", sector: "데이터센터", ticker: "GEV" },
  { name: "아리스타네트웍스", sector: "데이터센터", ticker: "ANET" },
  { name: "에퀴닉스", sector: "데이터센터", ticker: "EQIX" },
  { name: "컨스텔레이션에너지", sector: "데이터센터", ticker: "CEG" },

  // 광통신
  { name: "루멘텀", sector: "광통신", ticker: "LITE" },
  { name: "코히런트", sector: "광통신", ticker: "COHR" },
  { name: "시에나", sector: "광통신", ticker: "CIEN" },
  { name: "코닝", sector: "광통신", ticker: "GLW" },
  { name: "파브리넷", sector: "광통신", ticker: "FN" },
  { name: "크레도테크놀로지", sector: "광통신", ticker: "CRDO" },

  // 헬스케어
  { name: "유나이티드헬스그룹", sector: "헬스케어", ticker: "UNH" },
  { name: "존슨앤드존슨", sector: "헬스케어", ticker: "JNJ" },
  { name: "애보트래보러토리스", sector: "헬스케어", ticker: "ABT" },
  { name: "인튜이티브서지컬", sector: "헬스케어", ticker: "ISRG" },
  { name: "써모피셔사이언티픽", sector: "헬스케어", ticker: "TMO" },

  // 바이오
  { name: "일라이릴리", sector: "바이오", ticker: "LLY" },
  { name: "버텍스파마슈티컬스", sector: "바이오", ticker: "VRTX" },
  { name: "리제네론파마슈티컬스", sector: "바이오", ticker: "REGN" },
  { name: "암젠", sector: "바이오", ticker: "AMGN" },
  { name: "길리어드사이언스", sector: "바이오", ticker: "GILD" },
  { name: "모더나", sector: "바이오", ticker: "MRNA" },

  // 에너지
  { name: "엑슨모빌", sector: "에너지", ticker: "XOM" },
  { name: "셰브런", sector: "에너지", ticker: "CVX" },
  { name: "넥스트에라에너지", sector: "에너지", ticker: "NEE" },
  { name: "비스트라", sector: "에너지", ticker: "VST" },
  { name: "탈렌에너지", sector: "에너지", ticker: "TLN" },
  { name: "카메코", sector: "에너지", ticker: "CCJ" },
];

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

let cachedCrumb = null;
let cachedCookie = null;
let crumbFetchedAt = 0;

async function getCrumb(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedCrumb && now - crumbFetchedAt < 55 * 60 * 1000) {
    return { crumb: cachedCrumb, cookie: cachedCookie };
  }

  const cookieRes = await fetch("https://fc.yahoo.com", {
    headers: { "User-Agent": UA },
  });
  const cookie = (cookieRes.headers.get("set-cookie") || "").split(";")[0];

  const crumbRes = await fetch(
    "https://query1.finance.yahoo.com/v1/test/getcrumb",
    { headers: { "User-Agent": UA, Cookie: cookie } }
  );
  const crumb = (await crumbRes.text()).trim();

  cachedCrumb = crumb;
  cachedCookie = cookie;
  crumbFetchedAt = now;
  return { crumb, cookie };
}

async function fetchQuote(ticker, crumb, cookie) {
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(
    ticker
  )}?modules=financialData,price&crumb=${encodeURIComponent(crumb)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Cookie: cookie } });
  const data = await res.json();
  const result = data?.quoteSummary?.result?.[0];
  if (!result) throw new Error("no data");

  const price = result.price || {};
  const fin = result.financialData || {};
  return {
    current: fin.currentPrice?.raw ?? price.regularMarketPrice?.raw ?? null,
    target: fin.targetMeanPrice?.raw ?? null,
    currency: price.currency ?? null,
  };
}

async function fetchAll(crumb, cookie) {
  return Promise.all(
    TICKERS.map(async (t) => {
      try {
        const q = await fetchQuote(t.ticker, crumb, cookie);
        return { ...t, ...q, error: null };
      } catch (e) {
        return { ...t, current: null, target: null, currency: null, error: "fetch_failed" };
      }
    })
  );
}

export default async function handler(req, res) {
  try {
    let { crumb, cookie } = await getCrumb();
    let stocks = await fetchAll(crumb, cookie);

    // 크럼(crumb)이 만료됐을 수 있으니, 전부 실패하면 한 번만 새로 발급받아 재시도
    if (stocks.every((s) => s.error)) {
      ({ crumb, cookie } = await getCrumb(true));
      stocks = await fetchAll(crumb, cookie);
    }

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.status(200).json({ updatedAt: new Date().toISOString(), stocks });
  } catch (e) {
    res.status(500).json({ error: "server_error", message: String(e) });
  }
}
