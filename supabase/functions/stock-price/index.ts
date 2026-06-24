// Supabase Edge Function: stock-price
// Returns the historical daily closing price for a stock ticker on (or just
// before) a given date.
//
// Primary source:  Yahoo Finance chart API (free, no key, full daily history).
// Fallback source: Alpha Vantage (free tier; only the last ~100 trading days
//                  because outputsize=full is now a paid feature). Uses the
//                  ALPHAVANTAGE_API_KEY secret, kept server-side.
//
// Request  (POST JSON): { ticker: string, date: "YYYY-MM-DD" }
// Response (JSON):      { ticker, requestedDate, priceDate, close, currency, source }
//                       or { error, message } with a non-200 status.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Step a YYYY-MM-DD string back by N calendar days (UTC-safe).
function minusDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

function unixSec(dateStr: string): number {
  return Math.floor(new Date(dateStr + 'T00:00:00Z').getTime() / 1000)
}

interface PriceHit {
  close: number
  priceDate: string
  currency: string
  source: string
}

// --- Yahoo Finance: free, no key, full daily history.
async function fromYahoo(symbol: string, date: string): Promise<PriceHit | null> {
  // Window: 10 days before (to skip weekends/holidays) through the day after.
  const p1 = unixSec(minusDays(date, 10))
  const p2 = unixSec(date) + 2 * 86400
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    `?period1=${p1}&period2=${p2}&interval=1d`

  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) return null
  const data = await res.json()
  const result = data?.chart?.result?.[0]
  if (!result) return null

  const ts: number[] = result.timestamp
  const closes: (number | null)[] = result.indicators?.quote?.[0]?.close
  const currency: string = result.meta?.currency || 'USD'
  if (!Array.isArray(ts) || !Array.isArray(closes)) return null

  // Pick the latest bar on or before the requested date that has a close.
  let best: PriceHit | null = null
  for (let i = 0; i < ts.length; i++) {
    const c = closes[i]
    if (c == null || Number.isNaN(Number(c))) continue
    const ds = new Date(ts[i] * 1000).toISOString().slice(0, 10)
    if (ds <= date && (!best || ds > best.priceDate)) {
      best = { close: Number(c), priceDate: ds, currency, source: 'yahoo' }
    }
  }
  return best
}

// --- Alpha Vantage fallback: free tier = compact (last ~100 trading days).
async function fromAlphaVantage(symbol: string, date: string): Promise<PriceHit | null> {
  const apiKey = Deno.env.get('ALPHAVANTAGE_API_KEY')
  if (!apiKey) return null

  const url =
    `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY` +
    `&symbol=${encodeURIComponent(symbol)}&outputsize=compact&apikey=${apiKey}`

  const res = await fetch(url)
  const data = await res.json()
  const series = data['Time Series (Daily)']
  if (!series || typeof series !== 'object') return null

  let target = date
  for (let i = 0; i < 10; i++) {
    const day = series[target]
    if (day && day['4. close']) {
      const close = Number(day['4. close'])
      if (!Number.isNaN(close)) {
        return { close, priceDate: target, currency: 'USD', source: 'alphavantage' }
      }
    }
    target = minusDays(target, 1)
  }
  return null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { ticker, date } = await req.json().catch(() => ({}))

    if (!ticker || !date) {
      return json({ error: 'bad_request', message: 'ticker and date are required' }, 400)
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return json({ error: 'bad_request', message: 'date must be YYYY-MM-DD' }, 400)
    }

    const symbol = String(ticker).trim().toUpperCase()

    // Try Yahoo first (full history), then Alpha Vantage (recent dates).
    let hit: PriceHit | null = null
    try {
      hit = await fromYahoo(symbol, date)
    } catch {
      /* fall through to Alpha Vantage */
    }
    if (!hit) {
      try {
        hit = await fromAlphaVantage(symbol, date)
      } catch {
        /* fall through to error */
      }
    }

    if (!hit) {
      return json(
        {
          error: 'no_price_for_date',
          message: `No price found for ${symbol} on or before ${date}. Check the ticker, or enter the price manually.`,
        },
        404,
      )
    }

    return json({
      ticker: symbol,
      requestedDate: date,
      priceDate: hit.priceDate,
      close: Math.round(hit.close * 10000) / 10000,
      currency: hit.currency,
      source: hit.source,
    })
  } catch (e) {
    return json({ error: 'internal', message: String(e) }, 500)
  }
})
