// 종목 데이터 - 여기 숫자만 실제 값으로 바꾸면 대시보드에 바로 반영됩니다.
// sector: 'AI반도체' | '장비' | '데이터센터' | '광통신'
// current: 현재가(원), target: 목표주가(원)
export const stocks = [
  // AI반도체
  { sector: "AI반도체", name: "삼성전자", current: 71000, target: 95000 },
  { sector: "AI반도체", name: "SK하이닉스", current: 220000, target: 280000 },
  { sector: "AI반도체", name: "한미반도체", current: 135000, target: 170000 },
  { sector: "AI반도체", name: "DB하이텍", current: 48000, target: 60000 },
  { sector: "AI반도체", name: "리노공업", current: 260000, target: 250000 },
  { sector: "AI반도체", name: "제주반도체", current: 4200, target: 5500 },

  // 장비
  { sector: "장비", name: "원익IPS", current: 38000, target: 50000 },
  { sector: "장비", name: "피에스케이", current: 45000, target: 55000 },
  { sector: "장비", name: "주성엔지니어링", current: 28000, target: 38000 },
  { sector: "장비", name: "테스", current: 25000, target: 32000 },
  { sector: "장비", name: "유진테크", current: 33000, target: 42000 },
  { sector: "장비", name: "이오테크닉스", current: 150000, target: 190000 },

  // 데이터센터
  { sector: "데이터센터", name: "삼성SDS", current: 165000, target: 200000 },
  { sector: "데이터센터", name: "KT", current: 42000, target: 48000 },
  { sector: "데이터센터", name: "LG유플러스", current: 11000, target: 13500 },
  { sector: "데이터센터", name: "더존비즈온", current: 55000, target: 68000 },
  { sector: "데이터센터", name: "에스넷시스템", current: 6500, target: 8000 },

  // 광통신
  { sector: "광통신", name: "오이솔루션", current: 32000, target: 42000 },
  { sector: "광통신", name: "우리로", current: 3800, target: 5000 },
  { sector: "광통신", name: "텔레필드", current: 18000, target: 24000 },
  { sector: "광통신", name: "파이버프로", current: 15000, target: 20000 },
  { sector: "광통신", name: "라이트론", current: 9500, target: 13000 },
];

export const sectors = ["전체", "AI반도체", "장비", "데이터센터", "광통신"];
