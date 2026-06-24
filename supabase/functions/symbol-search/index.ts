// Supabase Edge Function: symbol-search
// Autocomplete for stock/ETF/crypto tickers, backed by Yahoo Finance's free
// search endpoint (no key required).
//
// Request  (POST JSON): { query: string }
// Response (JSON):      { results: [{ symbol, name, exchange, type }] }

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json().catch(() => ({}))
    const q = String(query ?? '').trim()
    if (q.length < 1) {
      return json({ results: [] })
    }

    const url =
      `https://query1.finance.yahoo.com/v1/finance/search` +
      `?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0&listsCount=0`

    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) {
      return json({ error: 'upstream', message: `Yahoo search returned ${res.status}` }, 502)
    }
    const data = await res.json()
    const quotes: any[] = Array.isArray(data?.quotes) ? data.quotes : []

    const results = quotes
      .filter((qt) => qt.symbol && ['EQUITY', 'ETF', 'CRYPTOCURRENCY', 'INDEX', 'MUTUALFUND'].includes(qt.quoteType))
      .map((qt) => ({
        symbol: qt.symbol as string,
        name: (qt.longname || qt.shortname || qt.symbol) as string,
        exchange: (qt.exchDisp || qt.exchange || '') as string,
        type: (qt.typeDisp || qt.quoteType || '') as string,
      }))

    return json({ results })
  } catch (e) {
    return json({ error: 'internal', message: String(e) }, 500)
  }
})
