// Milestone 4: בדיחה אקראית מגיליון Google שמפורסם כ-CSV.
// הכתובת נקראת רק מ-process.env.SHEET_CSV_URL, ולא כתובה בשום קובץ.

const CACHE_MS = 60 * 1000;

const ERRORS = {
  config: 'המאגר עוד לא מחובר',
  notCsv: 'הגיליון לא מפורסם כ-CSV',
  empty: 'המאגר ריק',
  network: 'אין חיבור למאגר כרגע. נסו שוב עוד רגע',
};

// השורות בזיכרון לדקה. מופע חדש של הפונקציה מתחיל בלי זיכרון
let cache = null; // { rows, at }

class SheetError extends Error {
  constructor(key, detail) {
    super(detail);
    this.key = key;
  }
}

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

// פענוח CSV אמיתי: פסיקים, מירכאות ("" בתוך שדה במירכאות) ושורות חדשות בתוך שדה
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// מהטקסט של הגיליון לרשימת בדיחות { topic, text }
function toJokes(csv) {
  const [header = [], ...lines] = parseCsv(csv.replace(/^﻿/, ''));
  const names = header.map((h) => h.trim().toLowerCase());
  const topicCol = names.indexOf('topic');
  const textCol = names.indexOf('text');
  if (textCol === -1) throw new SheetError('notCsv', `no "text" header: ${JSON.stringify(header)}`);

  const jokes = [];
  for (const line of lines) {
    const text = (line[textCol] ?? '').trim();
    if (!text) continue;
    const topic = topicCol === -1 ? '' : (line[topicCol] ?? '').trim();
    jokes.push({ topic, text });
  }
  return jokes;
}

async function loadJokes(url) {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.rows;

  console.log('random: downloading sheet');
  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  } catch (err) {
    throw new SheetError('network', `sheet fetch failed: ${err?.name}: ${err?.message}`);
  }
  if (!res.ok) throw new SheetError('network', `sheet status=${res.status}`);

  const type = res.headers.get('content-type') || '';
  const body = await res.text();
  if (type.includes('text/html') || /^\s*</.test(body)) {
    throw new SheetError('notCsv', `sheet returned HTML (content-type=${type})`);
  }

  const rows = toJokes(body);
  if (!rows.length) throw new SheetError('empty', 'sheet has no jokes');

  cache = { rows, at: Date.now() };
  return rows;
}

export default {
  async fetch(request) {
    if (request.method !== 'GET') {
      return json({ error: 'אפשר לשלוח רק GET.' }, 405);
    }

    const url = process.env.SHEET_CSV_URL;
    if (!url) {
      console.error('SHEET_CSV_URL is missing');
      return json({ error: ERRORS.config }, 500);
    }

    try {
      const rows = await loadJokes(url);
      const { topic, text } = rows[Math.floor(Math.random() * rows.length)];
      return json({ joke: text, topic });
    } catch (err) {
      const key = err instanceof SheetError ? err.key : 'network';
      console.error(`random error: ${key}: ${err?.message}`);
      return json({ error: ERRORS[key] }, 502);
    }
  },
};
