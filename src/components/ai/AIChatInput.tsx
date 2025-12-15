import { useState, useRef, useEffect } from 'react'
import { useFinancialSummary } from '../../hooks/useFinancialSummary'
import { askFinancialQuestion } from '../../lib/claude'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function AIChatInput() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { summary, isLoading: dataLoading } = useFinancialSummary()
  const hasApiKey = Boolean(import.meta.env.VITE_CLAUDE_API_KEY)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  if (!hasApiKey) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !summary) return

    const question = input.trim()
    setInput('')
    setError(null)
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setIsLoading(true)

    try {
      const response = await askFinancialQuestion(question, summary)
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setMessages([])
    setError(null)
  }

  // Collapsed state - just a button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-colors"
      >
        <span>💬</span>
        <span>Ask AI CFO a question...</span>
      </button>
    )
  }

  // Expanded state - chat interface
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <span>💬</span>
          <span>Ask AI CFO</span>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      {messages.length > 0 && (
        <div className="max-h-64 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`text-sm ${
                msg.role === 'user'
                  ? 'text-gray-600 font-medium'
                  : 'text-gray-800 bg-gray-50 rounded-lg p-3'
              }`}
            >
              {msg.role === 'user' && <span className="text-blue-600">You: </span>}
              {msg.content}
            </div>
          ))}
          {isLoading && (
            <div className="text-sm text-gray-500 animate-pulse">
              AI is thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-2 text-sm text-red-600 bg-red-50">
          {error}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-100 p-2">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={dataLoading ? 'Loading data...' : 'Ask about your finances...'}
            disabled={isLoading || dataLoading || !summary}
            className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || dataLoading || !summary}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '...' : 'Ask'}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400 px-1">
          e.g., "Which website should I focus on?" or "Why did expenses increase?"
        </p>
      </form>
    </div>
  )
}
