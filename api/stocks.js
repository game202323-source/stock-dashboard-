// Vercel 서버리스 함수: Yahoo Finance 비공식 API로 현재가 · 목표주가(애널리스트 컨센서스)를 가져옵니다.
const TICKERS = [
  // AI반도체
  { name: "삼성전자", sector: "AI반도체", ticker: "005930.KS" },
  { name: "SK하이닉스", sector: "AI반도체", ticker: "000660.KS" },
  { name: "한미반도체", sector: "AI반도체", ticker: "042700.KS" },
  { name: "DB하이텍", sector: "AI반도체", ticker: "000990.KS" },
  { name: "리노공업", sector: "AI반도체", ticker: "058470.KQ" },
  { name: "엔비디아", sector: "AI반도체", ticker: "NVDA" },

  // 장비
  { name: "원익IPS", sector: "장비", ticker: "240810.KQ" },
  { name: "피에스케이", sector: "장비", ticker: "319660.KQ" },
  { name: "테스", sector: "장비", ticker: "095610.KQ" },
  { name: "유진테크", sector: "장비", ticker: "084370.KQ" },
  { name: "이오테크닉스", sector: "장비", ticker: "039030.KQ" },
  { name: "ASML", sector: "장비", ticker: "ASML" },

  // 데이터센터
  { name: "삼성SDS", sector: "데이터센터", ticker: "018260.KS" },
  { name: "KT", sector: "데이터센터", ticker: "030200.KS" },
  { name: "LG유플러스", sector: "데이터센터", ticker: "032640.KS" },
  { name: "더존비즈온", sector: "데이터센터", ticker: "012510.KS" },
  { name: "에스넷시스템", sector: "데이터센터", ticker: "234340.KQ" },

  // 광통신
  { name: "코히런트", sector: "광통신", ticker: "COHR" },
  { name: "루멘텀", sector: "광통신", ticker: "LITE" },
  { name: "시에나", sector: "광통신", ticker: "CIEN" },
  { name: "어플라이드옵토일렉트로닉스", sector: "광통신", ticker: "AAOI" },
  { name: "파브리넷", sector: "광통신", ticker: "FN" },
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
