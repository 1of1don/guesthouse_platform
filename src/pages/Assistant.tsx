import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  Info,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
}

const AVAILABLE_MODELS = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    badge: 'General Tasks · Recommended',
    description: 'Fast, balanced model for lodging inquiries and concierge guidance.',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    badge: 'Fast Tasks · Low Latency',
    description: 'Optimized for high-speed, instant responses.',
  },
  {
    id: 'gemini-4-argon',
    name: 'Gemini 4 Argon',
    badge: 'Complex Analysis · Advanced Reasoning',
    description: 'Deep reasoning for comprehensive multi-property comparisons.',
  },
];

const SUGGESTED_PROMPTS = [
  'What are the key tourist hubs for guesthouses in Botswana?',
  'How do I register a new guesthouse through the admin portal?',
  'Can you delete a guesthouse directly from this chat?',
  'What are standard nightly rates for luxury lodges in Kasane?',
];

export default function Assistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      text: "Hello! I am the MiCasa SuCasa Hospitality Assistant. I can help you explore Botswana guesthouse destinations, review amenities and tariffs, and navigate the admin portal.\n\nPlease note: To ensure platform security, direct database changes (such as creating or deleting guesthouses) and payment processing cannot be performed directly in chat. If you request something outside my scope, I will let you know and direct you to the appropriate portal page or administrator.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.8-flash',
    },
  ]);

  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3.8-flash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showScopeInfo, setShowScopeInfo] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setLoading(true);
    setError('');

    try {
      // Build history for the multi-turn session
      const history = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history,
          model: selectedModel,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get a response from Gemini.');
      }

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.model || selectedModel,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      setError(err?.message || 'Error communicating with the assistant.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Clear the conversation history and start a new session?')) {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: 'model',
          text: "Conversation reset. How can I assist you with the MiCasa SuCasa platform today?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: selectedModel,
        },
      ]);
      setError('');
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#8F7F70] dark:text-[#9E8E80]">
            <span>Concierge</span>
            <span aria-hidden="true" className="text-black/20 dark:text-white/20">·</span>
            <span>Gemini AI Assistant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#231A14] dark:text-[#F7F4EF] mt-1">
            MiCasa AI Concierge
          </h1>
          <p className="text-xs text-[#7A6C60] dark:text-[#A69788] mt-0.5">
            Multi-turn assistant for Botswana tourism advice, catalog inquiries, and administrative portal guidance.
          </p>
        </div>

        {/* Model Selector & Actions */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[#8F7F70] dark:text-[#9E8E80] font-medium hidden sm:inline">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="py-1.5 px-3 bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-[#231A14] dark:text-[#F7F4EF] font-medium text-xs focus:outline-hidden cursor-pointer"
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.badge.split('·')[0].trim()})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleClearHistory}
            className="p-2 text-[#7A6C60] hover:text-rose-600 dark:text-[#A69788] dark:hover:text-rose-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] rounded-xl transition-colors cursor-pointer"
            title="Reset Conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scope Boundaries Banner */}
      <div className="glass-card rounded-2xl p-4 shadow-xs text-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#9E7246] dark:text-[#D6A670] font-semibold">
            <Info className="w-4 h-4" />
            <span>Scope Boundaries & Assistant Guardrails</span>
          </div>
          <button
            onClick={() => setShowScopeInfo(!showScopeInfo)}
            className="text-[11px] font-medium text-[#7A6C60] dark:text-[#A69788] hover:text-[#231A14] flex items-center gap-1 cursor-pointer"
          >
            <span>{showScopeInfo ? 'Hide Details' : 'View Scope Rules'}</span>
            {showScopeInfo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showScopeInfo && (
          <div className="pt-2 border-t border-black/[0.05] dark:border-white/[0.06] space-y-2 text-[#524438] dark:text-[#D4BA9E] leading-relaxed">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30">
                <p className="font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                  ✓ In-Scope Capabilities
                </p>
                <ul className="text-[11px] space-y-0.5 text-emerald-900 dark:text-emerald-400">
                  <li>• Answering questions on Botswana destinations & lodges</li>
                  <li>• Explaining amenities, tariffs, and currency options</li>
                  <li>• Guiding how to add/edit properties in the admin portal</li>
                  <li>• Sharing travel seasons and safari recommendations</li>
                </ul>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30">
                <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">
                  ✗ Out-of-Scope (Bot will notify you)
                </p>
                <ul className="text-[11px] space-y-0.5 text-amber-900 dark:text-amber-400">
                  <li>• Directly creating, editing, or deleting database listings</li>
                  <li>• Processing credit cards, bank transfers, or refunds</li>
                  <li>• Booking flights or hotels outside Botswana</li>
                  <li>• Medical, legal, or non-hospitality requests</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Thread Container */}
      <div className="glass-panel rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col h-[560px]">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 text-xs leading-relaxed ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-[#9E7246] dark:text-[#D6A670] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[82%] sm:max-w-[75%] space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-4 rounded-2xl relative group ${
                      isUser
                        ? 'bg-[#231A14] text-white dark:bg-[#EAE2D8] dark:text-[#181310] shadow-xs'
                        : 'glass-card text-[#231A14] dark:text-[#F7F4EF]'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>

                    {/* Copy action on hover */}
                    <button
                      onClick={() => handleCopy(m.id, m.text)}
                      className={`absolute top-2.5 right-2.5 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                        isUser
                          ? 'text-white/60 hover:text-white hover:bg-white/10'
                          : 'text-[#8F7F70] hover:text-[#231A14] dark:hover:text-white hover:bg-black/[0.04]'
                      }`}
                      title="Copy response"
                    >
                      {copiedId === m.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Message Metadata */}
                  <div className={`flex items-center gap-2 px-1 text-[10px] text-[#8F7F70] dark:text-[#9E8E80] ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <span>{m.timestamp}</span>
                    {m.modelUsed && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{m.modelUsed}</span>
                      </>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#231A14] text-white dark:bg-[#EAE2D8] dark:text-[#181310] flex items-center justify-center shrink-0 shadow-2xs mt-0.5 font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-3 text-xs justify-start">
              <div className="w-8 h-8 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-[#9E7246] dark:text-[#D6A670] flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="glass-card p-4 rounded-2xl flex items-center gap-1.5 text-[#7A6C60] dark:text-[#A69788]">
                <span className="inline-block w-2 h-2 rounded-full bg-[#9E7246] animate-bounce" />
                <span className="inline-block w-2 h-2 rounded-full bg-[#9E7246] animate-bounce [animation-delay:0.2s]" />
                <span className="inline-block w-2 h-2 rounded-full bg-[#9E7246] animate-bounce [animation-delay:0.4s]" />
                <span className="ml-2 font-mono text-[11px]">Thinking with {selectedModel}...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Pill Row */}
        <div className="pt-3 pb-2 border-t border-black/[0.05] dark:border-white/[0.06] overflow-x-auto flex items-center gap-1.5 text-xs">
          <span className="text-[10px] uppercase font-semibold text-[#8F7F70] shrink-0 mr-1">
            Try:
          </span>
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="px-2.5 py-1 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-[#524438] dark:text-[#D4BA9E] text-[11px] whitespace-nowrap transition-colors cursor-pointer border border-black/[0.04] dark:border-white/[0.06]"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Input Field */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="pt-2 flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask the concierge (e.g. "What lodges are in Maun?" or test out-of-scope boundaries)...`}
              disabled={loading}
              className="w-full px-4 py-2.5 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.07] dark:border-white/[0.08] rounded-xl text-[#231A14] dark:text-[#F7F4EF] placeholder:text-[#9E8E80] focus:bg-white dark:focus:bg-[#251E1A] focus:outline-hidden focus:ring-1 focus:ring-[#9E7246] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 bg-[#231A14] hover:bg-[#372A22] dark:bg-[#EAE2D8] dark:text-[#181310] dark:hover:bg-white text-white rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer shrink-0"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
