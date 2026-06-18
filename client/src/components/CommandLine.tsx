/* =============================================================================
   Operator House — Command Line
   Persistent AI chat sidebar powered by Specter
   Context-aware: injects live pipeline, lead, and vault data into every session
   ============================================================================= */
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Terminal, X, Send, Loader2, ChevronDown, Sparkles,
  RotateCcw, Copy, Check,
} from "lucide-react";
import { Streamdown } from "streamdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface CommandLineProps {
  open: boolean;
  onClose: () => void;
}

// Cycling phrases Specter shows while thinking
const THINKING_PHRASES = [
  "Specter is thinking…",
  "Pulling context…",
  "Reading your pipeline…",
  "Connecting the dots…",
  "Crafting a response…",
  "Analyzing your data…",
  "Almost there…",
];

function TypingIndicator() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Cycle through phrases every 2.2 s with a brief fade-out/in
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setPhraseIdx((i) => (i + 1) % THINKING_PHRASES.length);
        setVisible(true);
      }, 300);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-start items-start gap-2.5" style={{ animation: 'cl-fade-in 200ms ease' }}>
      {/* Specter avatar — pulsing amber ring while thinking */}
      <div
        className="flex-shrink-0 flex items-center justify-center relative"
        style={{
          width: '22px', height: '22px', borderRadius: '5px',
          background: 'linear-gradient(135deg, rgba(245,166,35,0.22) 0%, rgba(245,166,35,0.07) 100%)',
          border: '1px solid var(--border-amber)',
          animation: 'cl-avatar-pulse 1.8s ease-in-out infinite',
        }}
      >
        <Sparkles size={10} style={{ color: 'var(--amber)' }} />
      </div>

      {/* Bubble */}
      <div style={{
        padding: '11px 14px',
        borderRadius: '3px 12px 12px 12px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: '10px',
        minWidth: '180px',
      }}>
        {/* Three-dot bounce */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {[0, 160, 320].map((delay) => (
            <span
              key={delay}
              style={{
                width: '5px', height: '5px',
                borderRadius: '50%',
                background: 'var(--amber)',
                display: 'inline-block',
                opacity: 0.7,
                animation: `cl-dot-bounce 1.2s ease-in-out ${delay}ms infinite`,
              }}
            />
          ))}
        </div>

        {/* Cycling phrase */}
        <span
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            fontFamily: 'Fira Code, monospace',
            letterSpacing: '0.04em',
            opacity: visible ? 1 : 0,
            transition: 'opacity 280ms ease',
            whiteSpace: 'nowrap',
          }}
        >
          {THINKING_PHRASES[phraseIdx]}
        </span>
      </div>
    </div>
  );
}

export default function CommandLine({ open, onClose }: CommandLineProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "**Command Line active.** I'm Specter — your AI worker inside Operator House.\n\nI have full context on your pipeline, leads, and Vault. Ask me anything:\n- *\"What should I focus on today?\"*\n- *\"Analyze my pipeline health\"*\n- *\"Draft an outreach email for [client]\"*\n- *\"What's blocking my top deals?\"*",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const lastSentRef = useRef<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chat = trpc.operator.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          timestamp: new Date(),
        },
      ]);
      setIsStreaming(false);
    },
    onError: (err) => {
      setIsStreaming(false);
      const errMsg = err.message?.includes('timed out')
        ? 'Request timed out — Specter is thinking hard. Try again.'
        : err.message || 'Specter is temporarily unavailable.';
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== 'streaming-placeholder'),
        {
          id: `error-${Date.now()}`,
          role: 'assistant' as const,
          content: `**Signal interrupted.** ${errMsg}\n\nYour last message has been restored in the input — just hit send again.`,
          timestamp: new Date(),
        },
      ]);
      setInput(lastSentRef.current);
      toast.error(errMsg, { duration: 5000 });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    lastSentRef.current = text;
    setInput("");
    setIsStreaming(true);

    const history = messages
      .filter((m) => m.id !== "welcome")
      .slice(-8)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    chat.mutate({ message: text, history });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReset = () => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: "**Command Line reset.** Fresh session started. What do you need?",
      timestamp: new Date(),
    }]);
    setIsStreaming(false);
  };

  return (
    <>
      {/* Keyframes */}
      <style>{`
        @keyframes cl-dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes cl-avatar-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,166,35,0); }
          50% { box-shadow: 0 0 0 4px rgba(245,166,35,0.18); }
        }
        @keyframes cl-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cl-msg-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 39,
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            animation: 'fadeIn 180ms ease',
          }}
        />
      )}

      {/* Panel */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: '420px',
          zIndex: 40,
          background: 'linear-gradient(180deg, rgba(10,10,16,0.98) 0%, rgba(6,6,10,0.99) 100%)',
          borderLeft: '1px solid var(--border-amber)',
          boxShadow: '-8px 0 48px rgba(0,0,0,0.6), -1px 0 0 rgba(245,166,35,0.08)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          display: 'flex',
          flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 280ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 flex-shrink-0"
          style={{
            height: '64px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(245,166,35,0.03)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center relative"
              style={{
                width: '32px', height: '32px',
                background: 'linear-gradient(135deg, rgba(245,166,35,0.2) 0%, rgba(245,166,35,0.06) 100%)',
                border: '1px solid var(--border-amber)',
                borderRadius: '7px',
                boxShadow: '0 0 16px rgba(245,166,35,0.15)',
              }}
            >
              <Terminal size={14} style={{ color: 'var(--amber)' }} />
              <div style={{
                position: 'absolute', top: '-3px', right: '-3px',
                width: '7px', height: '7px', borderRadius: '50%',
                background: isStreaming ? 'var(--amber)' : '#4ADE80',
                boxShadow: isStreaming
                  ? '0 0 6px rgba(245,166,35,0.8)'
                  : '0 0 6px rgba(74,222,128,0.8)',
                border: '1.5px solid rgba(6,6,10,0.99)',
                animation: 'statusPulse 2.5s ease-in-out infinite',
                transition: 'background 400ms, box-shadow 400ms',
              }} />
            </div>
            <div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                Command Line
              </div>
              <div style={{ fontFamily: 'Fira Code, monospace', fontSize: '9px', letterSpacing: '0.12em', color: isStreaming ? 'var(--amber)' : 'var(--text-muted)', textTransform: 'uppercase', marginTop: '1px', transition: 'color 300ms' }}>
                {isStreaming ? 'Specter · Thinking' : 'Specter · Active'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleReset}
              title="Reset conversation"
              style={{
                width: '30px', height: '30px', borderRadius: '5px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)',
                border: '1px solid transparent',
                transition: 'all 150ms',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
            >
              <RotateCcw size={12} />
            </button>
            <button
              onClick={onClose}
              style={{
                width: '30px', height: '30px', borderRadius: '5px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)',
                border: '1px solid transparent',
                transition: 'all 150ms',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(248,113,113,0.3)'; (e.currentTarget as HTMLButtonElement).style.color = '#F87171'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--border-subtle) transparent' }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ animation: 'cl-msg-in 220ms ease' }}
            >
              {msg.role === 'assistant' && (
                <div
                  className="flex-shrink-0 flex items-center justify-center mr-2.5 mt-0.5"
                  style={{
                    width: '22px', height: '22px', borderRadius: '5px',
                    background: 'linear-gradient(135deg, rgba(245,166,35,0.18) 0%, rgba(245,166,35,0.05) 100%)',
                    border: '1px solid var(--border-amber)',
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={10} style={{ color: 'var(--amber)' }} />
                </div>
              )}
              <div style={{ maxWidth: '85%', position: 'relative' }}>
                <div
                  style={{
                    padding: msg.role === 'user' ? '10px 14px' : '12px 14px',
                    borderRadius: msg.role === 'user' ? '12px 12px 3px 12px' : '3px 12px 12px 12px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, rgba(245,166,35,0.18) 0%, rgba(245,166,35,0.08) 100%)'
                      : 'rgba(255,255,255,0.04)',
                    border: msg.role === 'user'
                      ? '1px solid rgba(245,166,35,0.3)'
                      : '1px solid var(--border-subtle)',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    color: 'var(--text-primary)',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose-operator">
                      <Streamdown>{msg.content}</Streamdown>
                    </div>
                  ) : (
                    <span>{msg.content}</span>
                  )}
                </div>
                {msg.role === 'assistant' && msg.id !== 'welcome' && (
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    style={{
                      position: 'absolute', bottom: '-18px', right: '4px',
                      display: 'flex', alignItems: 'center', gap: '3px',
                      fontSize: '10px', color: 'var(--text-muted)',
                      fontFamily: 'Fira Code, monospace',
                      padding: '2px 6px',
                      transition: 'color 150ms',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--amber)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    {copiedId === msg.id ? <Check size={9} /> : <Copy size={9} />}
                    {copiedId === msg.id ? 'copied' : 'copy'}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Rich typing indicator */}
          {isStreaming && <TypingIndicator />}

          <div ref={bottomRef} style={{ height: '24px' }} />
        </div>

        {/* Quick prompts */}
        <div
          className="px-4 pb-2 flex gap-2 overflow-x-auto flex-shrink-0"
          style={{ scrollbarWidth: 'none' }}
        >
          {[
            "Today's focus",
            "Pipeline health",
            "Stale deals",
            "Draft outreach",
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
              style={{
                flexShrink: 0,
                padding: '5px 10px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(255,255,255,0.03)',
                fontSize: '11px',
                color: 'var(--text-muted)',
                fontFamily: 'Fira Code, monospace',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
                transition: 'all 150ms',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-amber)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--amber)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input */}
        <div
          className="px-4 pb-4 flex-shrink-0"
          style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}
        >
          <div
            className="flex items-end gap-2"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '10px 12px',
              transition: 'border-color 180ms',
            }}
            onFocusCapture={e => (e.currentTarget.style.borderColor = 'var(--border-amber)')}
            onBlurCapture={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isStreaming ? "Specter is responding…" : "Ask Specter anything…"}
              rows={1}
              disabled={isStreaming}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontSize: '13px',
                color: 'var(--text-primary)',
                fontFamily: 'DM Sans, sans-serif',
                lineHeight: 1.5,
                maxHeight: '100px',
                overflowY: 'auto',
                opacity: isStreaming ? 0.5 : 1,
                transition: 'opacity 200ms',
              }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 100) + 'px';
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              style={{
                flexShrink: 0,
                width: '30px', height: '30px',
                borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: input.trim() && !isStreaming ? 'var(--amber)' : 'rgba(255,255,255,0.06)',
                color: input.trim() && !isStreaming ? 'var(--obsidian)' : 'var(--text-muted)',
                transition: 'all 180ms',
                border: 'none',
                cursor: input.trim() && !isStreaming ? 'pointer' : 'not-allowed',
              }}
            >
              {isStreaming
                ? <Loader2 size={13} className="animate-spin" style={{ color: 'var(--amber)' }} />
                : <Send size={13} />
              }
            </button>
          </div>
          <div style={{ marginTop: '6px', textAlign: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'Fira Code, monospace', letterSpacing: '0.06em' }}>
              ↵ send · shift+↵ newline · context-aware
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
