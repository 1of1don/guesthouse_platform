import { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export default function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'model',
      text: "Hello! I am your MiCasa Concierge. Ask me about Botswana guesthouses, travel routes, or portal guidance.\n\nNote: Direct database edits and payment transactions are outside my scope. I will let you know if a request cannot be performed.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3.8-flash');

  const widgetRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !widgetRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError('');

    try {
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
      if (!res.ok) throw new Error(data.error || 'Failed to fetch AI response.');

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setError(err?.message || 'Chat service encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={widgetRef} className="fixed bottom-6 right-6 z-40">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 bg-[#231A14] hover:bg-[#372A22] dark:bg-[#EAE2D8] dark:text-[#181310] dark:hover:bg-white text-white rounded-2xl shadow-xl transition-all duration-200 cursor-pointer group"
          aria-label="Open AI Assistant"
        >
          <div className="relative">
            <Sparkles className="w-4 h-4 text-[#D6A670] dark:text-[#9E7246]" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <span className="text-xs font-semibold">Ask MiCasa AI</span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-white/95 dark:bg-[#181412]/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/80 dark:border-white/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-3.5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#231A14] text-white dark:bg-[#EAE2D8] dark:text-[#181310] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-[#D6A670] dark:text-[#9E7246]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#231A14] dark:text-[#F7F4EF]">
                  MiCasa Concierge
                </h3>
                <p className="text-[10px] text-[#8F7F70] dark:text-[#9E8E80]">
                  Botswana Hospitality AI
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link
                to="/assistant"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-[#7A6C60] hover:text-[#231A14] dark:text-[#A69788] dark:hover:text-[#F7F4EF] rounded-lg hover:bg-black/[0.04]"
                title="Open full page"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-[#7A6C60] hover:text-[#231A14] dark:text-[#A69788] dark:hover:text-[#F7F4EF] rounded-lg hover:bg-black/[0.04] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Model Selection Row */}
          <div className="px-3.5 py-1.5 border-b border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between text-[11px] bg-black/[0.01]">
            <span className="text-[#8F7F70] dark:text-[#9E8E80]">Engine:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent border-0 font-medium text-[#231A14] dark:text-[#F7F4EF] text-[11px] cursor-pointer focus:outline-hidden"
            >
              <option value="gemini-3.8-flash">Gemini 3.8 Flash (General)</option>
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Fast)</option>
              <option value="gemini-4-argon">Gemini 4 Argon (Complex)</option>
            </select>
          </div>

          {/* Thread */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div key={m.id} className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-6 h-6 rounded-lg bg-black/[0.04] dark:bg-white/[0.05] text-[#9E7246] dark:text-[#D6A670] flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-2xl max-w-[85%] whitespace-pre-wrap leading-relaxed ${
                      isUser
                        ? 'bg-[#231A14] text-white dark:bg-[#EAE2D8] dark:text-[#181310]'
                        : 'glass-card text-[#231A14] dark:text-[#F7F4EF]'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-lg bg-black/[0.04] text-[#9E7246] flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="glass-card p-2.5 rounded-xl text-[11px] text-[#7A6C60] dark:text-[#A69788]">
                  Consulting Gemini...
                </div>
              </div>
            )}

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center gap-2 bg-black/[0.02]"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about lodges or test out of scope..."
              disabled={loading}
              className="flex-1 px-3 py-2 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-[#231A14] dark:text-[#F7F4EF] placeholder:text-[#8F7F70] focus:bg-white dark:focus:bg-[#251E1A] focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 bg-[#231A14] hover:bg-[#372A22] dark:bg-[#EAE2D8] dark:text-[#181310] text-white rounded-xl disabled:opacity-50 cursor-pointer shrink-0 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
