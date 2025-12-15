import type { FinancialSummary, AIInsights } from '../types/ai'

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'

const SYSTEM_PROMPT = `You are a CFO and financial analyst for a digital entrepreneur who runs multiple online businesses (websites generating revenue through ads, affiliates, and digital products).

Analyze their financial data and provide insights in JSON format.

IMPORTANT: Respond ONLY with valid JSON matching this exact structure:
{
  "summary": {
    "health": "excellent" | "good" | "fair" | "poor",
    "description": "1-2 sentence assessment",
    "keyMetric": "Key highlight like '$18K+ profit YTD'"
  },
  "trends": [
    {
      "type": "growth" | "decline" | "stable",
      "metric": "Revenue" | "Profit" | etc,
      "percentChange": number,
      "description": "Brief description",
      "details": "Optional additional context"
    }
  ],
  "anomalies": [
    {
      "severity": "low" | "medium" | "high",
      "metric": "What metric",
      "month": month_number,
      "description": "What happened",
      "suggestion": "What to do about it"
    }
  ],
  "topPerformers": [
    {
      "type": "website" | "category",
      "name": "Name",
      "metric": "What metric they excel in (e.g., Profit Margin, Revenue)",
      "value": number,
      "reason": "Why they're top"
    }
  ],
  "recommendations": [
    {
      "priority": "high" | "medium" | "low",
      "title": "Short title",
      "description": "Detailed explanation",
      "action": "Specific action to take"
    }
  ],
  "forecast": {
    "nextMonth": month_number,
    "projectedRevenue": number,
    "projectedExpense": number,
    "projectedProfit": number,
    "confidence": "high" | "medium" | "low",
    "reasoning": "Why this projection"
  },
  "alerts": [
    {
      "severity": "warning" | "critical",
      "title": "Alert title",
      "description": "What needs attention",
      "action": "Recommended action"
    }
  ]
}

CRITICAL JSON RULES:
- All numeric fields (value, projectedRevenue, projectedExpense, projectedProfit, percentChange, month) MUST be plain numbers WITHOUT currency symbols, percentage signs, or commas
- Example: 9790.63 NOT $9,790.63, and 99.8 NOT 99.8%
- Currency/percentage symbols are ONLY allowed in string fields like description, keyMetric, reason

ANALYSIS RULES:
- Currency is USD - use $ symbol in text descriptions (e.g., "$2.1K profit", "$18K revenue")
- IGNORE months with zero or near-zero revenue - they have not been entered yet, do NOT flag them as anomalies
- Do NOT make year-over-year comparisons - only analyze month-over-month trends within the provided data
- Forecast should be based on the AVERAGE of months that have actual data (non-zero revenue)
- Percentages use % symbol in text (e.g., "99.8% margin"), NOT currency symbols
- For topPerformers: if metric is a margin/percentage, value is the number (99.8), if metric is revenue/profit, value is the dollar amount (2500)

Guidelines:
- Format large USD amounts as $2.1K, $18K, etc. in text fields
- Be specific with numbers and percentages
- Focus on actionable insights, not just observations
- If no anomalies or alerts exist, return empty arrays
- Provide 2-3 recommendations maximum
- Identify top 2-3 performers`

const CHAT_SYSTEM_PROMPT = `You are a CFO and financial analyst assistant for a digital entrepreneur who runs multiple online businesses (websites generating revenue through ads, affiliates, and digital products).

You have access to their financial data which will be provided with each question. Answer questions helpfully and concisely.

Guidelines:
- Currency is USD - use $ symbol (e.g., $2.1K, $500)
- Be specific with numbers when answering
- Keep responses brief and actionable (2-4 sentences unless more detail is needed)
- If you don't have enough data to answer, say so
- Focus on practical advice, not generic financial platitudes
- Do NOT make year-over-year comparisons unless previous year data is explicitly provided`

export async function analyzeFinancials(data: FinancialSummary): Promise<AIInsights> {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY

  if (!apiKey) {
    throw new Error('Claude API key not configured')
  }

  // Filter out months with zero revenue (not yet entered)
  const monthsWithData = data.monthlyTrends.filter(m => m.revenue > 0)
  const monthsWithDataCount = monthsWithData.length

  const userMessage = `Analyze this financial data for ${data.period.year}:

IMPORTANT CONTEXT:
- This is ${data.period.year} data only. No previous year data exists - do NOT make year-over-year comparisons.
- Only ${monthsWithDataCount} months have actual data entered. Months with $0 revenue have NOT been entered yet - ignore them completely.
- Base your forecast on the average of months that have data.

TOTALS (for months with data):
- Revenue: $${data.totals.revenue.toLocaleString()}
- Expenses: $${data.totals.expense.toLocaleString()}
- Profit: $${data.totals.profit.toLocaleString()}
- Profit Margin: ${data.totals.margin.toFixed(1)}%

MONTHLY DATA (only showing months with data):
${monthsWithData.map(m => `Month ${m.month}: Revenue $${m.revenue.toLocaleString()}, Expense $${m.expense.toLocaleString()}, Profit $${m.profit.toLocaleString()}`).join('\n')}

WEBSITE PERFORMANCE:
${data.websitePerformance.filter(w => w.revenue > 0).map(w => `${w.name}: Revenue $${w.revenue.toLocaleString()}, Expense $${w.expense.toLocaleString()}, Profit $${w.profit.toLocaleString()} (${w.margin.toFixed(1)}% margin)`).join('\n')}

REVENUE CATEGORIES:
${data.categoryBreakdown.revenue.filter(c => c.amount > 0).map(c => `${c.name}: $${c.amount.toLocaleString()}`).join('\n')}

EXPENSE CATEGORIES:
${data.categoryBreakdown.expense.filter(c => c.amount > 0).map(c => `${c.name}: $${c.amount.toLocaleString()}`).join('\n')}

INVESTMENTS:
- Principal: $${data.investments.principal.toLocaleString()}
- Dividends Received: $${data.investments.dividends.toLocaleString()}
- Dividend Yield: ${data.investments.yield.toFixed(2)}%

Provide your CFO analysis as JSON. Remember: forecast based on average monthly revenue of ~$${(data.totals.revenue / monthsWithDataCount).toFixed(0)}.`

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Claude API error: ${error}`)
  }

  const result = await response.json()
  const content = result.content[0]?.text

  if (!content) {
    throw new Error('No response from Claude')
  }

  // Parse the JSON response
  try {
    // Extract JSON from potential markdown code blocks
    let jsonStr = content
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }

    const insights = JSON.parse(jsonStr.trim())

    return {
      ...insights,
      generatedAt: Date.now(),
    }
  } catch (parseError) {
    console.error('Failed to parse Claude response:', content)
    throw new Error('Failed to parse AI response')
  }
}

function formatFinancialContext(data: FinancialSummary): string {
  const monthsWithData = data.monthlyTrends.filter(m => m.revenue > 0)

  return `FINANCIAL DATA (${data.period.year}, ${monthsWithData.length} months with data):

TOTALS: Revenue $${data.totals.revenue.toLocaleString()}, Expenses $${data.totals.expense.toLocaleString()}, Profit $${data.totals.profit.toLocaleString()} (${data.totals.margin.toFixed(1)}% margin)

MONTHLY:
${monthsWithData.map(m => `M${m.month}: R$${m.revenue.toLocaleString()} E$${m.expense.toLocaleString()} P$${m.profit.toLocaleString()}`).join(' | ')}

WEBSITES:
${data.websitePerformance.filter(w => w.revenue > 0).map(w => `${w.name}: R$${w.revenue.toLocaleString()} P$${w.profit.toLocaleString()} (${w.margin.toFixed(0)}%)`).join(' | ')}

REVENUE BY CATEGORY: ${data.categoryBreakdown.revenue.filter(c => c.amount > 0).map(c => `${c.name} $${c.amount.toLocaleString()}`).join(', ')}

INVESTMENTS: Principal $${data.investments.principal.toLocaleString()}, Dividends $${data.investments.dividends.toLocaleString()} (${data.investments.yield.toFixed(1)}% yield)`
}

export async function askFinancialQuestion(
  question: string,
  financialData: FinancialSummary
): Promise<string> {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY

  if (!apiKey) {
    throw new Error('Claude API key not configured')
  }

  const context = formatFinancialContext(financialData)

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      temperature: 0.5,
      system: CHAT_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `${context}\n\nQUESTION: ${question}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Claude API error: ${error}`)
  }

  const result = await response.json()
  const content = result.content[0]?.text

  if (!content) {
    throw new Error('No response from Claude')
  }

  return content.trim()
}
