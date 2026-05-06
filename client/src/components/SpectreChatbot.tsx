/**
 * SpectreChatbot — floating bottom-right customer service chatbot
 *
 * Design: Obsidian/amber glass treatment matching the app aesthetic.
 * - Large Specter video (~160px) at the top of the panel
 * - Dark obsidian panel (#0a0908) with amber accent border
 * - Amber glow behind Specter header
 * - Auto-opens on first visit (localStorage flag "spectre_chatbot_greeted")
 * - Can be dismissed; user can reopen by clicking the avatar
 * - Respects spectreChatbotEnabled from SpectreContext
 */

import { useState, useEffect, useRef } from "react";
import { Send, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SpectreVideoPlayer } from "@/components/SpectreVideoPlayer";
import { useSpectre } from "@/contexts/SpectreContext";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";

const GREETED_KEY = "spectre_chatbot_greeted";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const WELCOME_MSG: ChatMessage = {
  role: "assistant",
  content:
    "Welcome to Operator House. I'm Specter — your intelligence operator. Ask me anything about your pipeline, leads, or strategy, or just say hello.",
};

export function SpectreChatbot() {
  const { spectreChatbotEnabled } = useSpectre();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [spectreState, setSpectreState] = useState<
    "happy_greeting" | "gesturing" | "thinking" | "idle" | "wave"
  >("happy_greeting");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chatMutation = trpc.operator.chat.useMutation({
    onSuccess: (data: { reply: string }) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
      setIsTyping(false);
      setSpectreState("happy_greeting");
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I ran into an issue. Please try again." },
      ]);
      setIsTyping(false);
      setSpectreState("happy_greeting");
    },
  });

  // Auto-open on first visit
  useEffect(() => {
    if (!spectreChatbotEnabled) return;
    const greeted = localStorage.getItem(GREETED_KEY);
    if (!greeted) {
      const timer = setTimeout(() => {
        setOpen(true);
        setSpectreState("happy_greeting");
        localStorage.setItem(GREETED_KEY, "1");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [spectreChatbotEnabled]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsTyping(true);
    setSpectreState("thinking");
    setTimeout(() => setSpectreState("gesturing"), 1200);
    chatMutation.mutate({
      message: text,
      history: messages
        .filter((m) => m.role !== "assistant" || m !== messages[0])
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!spectreChatbotEnabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {/* ── Chat panel ── */}
      <div
        className={cn(
          "transition-all duration-300 origin-bottom-right",
          open
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        )}
        style={{ width: "340px" }}
      >
        <div
          style={{
            background: "#0a0908",
            border: "1px solid rgba(201,160,74,0.28)",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,160,74,0.08)",
            display: "flex",
            flexDirection: "column",
            height: "520px",
          }}
        >
          {/* ── Specter video header ── */}
          <div
            style={{
              position: "relative",
              height: "164px",
              flexShrink: 0,
              background: "radial-gradient(ellipse 80% 100% at 50% 100%, rgba(201,160,74,0.18) 0%, rgba(6,5,4,0.0) 70%)",
              borderBottom: "1px solid rgba(201,160,74,0.15)",
              overflow: "hidden",
            }}
          >
            {/* Ambient glow */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: "180px",
                height: "80px",
                background: "radial-gradient(ellipse, rgba(201,160,74,0.22) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />
            {/* Specter video — fills the header, bottom-anchored */}
            <SpectreVideoPlayer
              state={spectreState}
              size="lg"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
              }}
            />
            {/* Gradient fade at bottom so it blends into the panel */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "48px",
                background: "linear-gradient(to top, #0a0908, transparent)",
                pointerEvents: "none",
              }}
            />
            {/* Name + status badge */}
            <div
              style={{
                position: "absolute",
                bottom: "10px",
                left: "14px",
                right: "40px",
              }}
            >
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 500, color: "#f2ead6", lineHeight: 1, margin: 0 }}>
                Specter
              </p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", color: "rgba(201,160,74,0.7)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "3px 0 0 0" }}>
                Operator House
              </p>
            </div>
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "rgba(242,234,214,0.06)",
                border: "1px solid rgba(242,234,214,0.1)",
                borderRadius: "50%",
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "rgba(242,234,214,0.45)",
                transition: "color 0.2s, background 0.2s",
              }}
              aria-label="Close chat"
            >
              <ChevronDown style={{ width: "14px", height: "14px" }} />
            </button>
          </div>

          {/* ── Messages ── */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(201,160,74,0.15) transparent",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "8px",
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  alignItems: "flex-start",
                }}
              >
                {msg.role === "assistant" && (
                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      flexShrink: 0,
                      background: "#000",
                      border: "1px solid rgba(201,160,74,0.3)",
                      marginTop: "2px",
                    }}
                  >
                    <img
                      src="/manus-storage/spector_friendly_welcome_6fb4122e.png"
                      alt="Specter"
                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
                    />
                  </div>
                )}
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "8px 12px",
                    borderRadius: msg.role === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                    background: msg.role === "user"
                      ? "rgba(201,160,74,0.15)"
                      : "rgba(242,234,214,0.05)",
                    border: msg.role === "user"
                      ? "1px solid rgba(201,160,74,0.2)"
                      : "1px solid rgba(242,234,214,0.07)",
                    fontSize: "13px",
                    lineHeight: 1.6,
                    color: msg.role === "user" ? "rgba(242,234,214,0.9)" : "rgba(242,234,214,0.75)",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {msg.role === "assistant" ? (
                    <Streamdown>{msg.content}</Streamdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    flexShrink: 0,
                    background: "#000",
                    border: "1px solid rgba(201,160,74,0.3)",
                    marginTop: "2px",
                  }}
                >
                  <img
                    src="/manus-storage/spector_friendly_welcome_6fb4122e.png"
                    alt="Specter"
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
                  />
                </div>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "4px 12px 12px 12px",
                    background: "rgba(242,234,214,0.05)",
                    border: "1px solid rgba(242,234,214,0.07)",
                  }}
                >
                  <div style={{ display: "flex", gap: "4px", alignItems: "center", height: "14px" }}>
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        style={{
                          width: "5px",
                          height: "5px",
                          borderRadius: "50%",
                          background: "rgba(201,160,74,0.6)",
                          display: "inline-block",
                          animation: `chatbot-bounce 1.2s ease-in-out ${delay}ms infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ── Input ── */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: "1px solid rgba(201,160,74,0.12)",
              display: "flex",
              gap: "8px",
              alignItems: "flex-end",
              background: "rgba(0,0,0,0.3)",
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Specter anything..."
              rows={1}
              style={{
                flex: 1,
                resize: "none",
                background: "rgba(242,234,214,0.05)",
                border: "1px solid rgba(242,234,214,0.1)",
                borderRadius: "10px",
                padding: "9px 12px",
                fontSize: "13px",
                color: "rgba(242,234,214,0.9)",
                fontFamily: "'Inter', sans-serif",
                outline: "none",
                maxHeight: "80px",
                lineHeight: 1.5,
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,160,74,0.4)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(242,234,214,0.1)"; }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: input.trim() && !isTyping ? "rgba(201,160,74,0.25)" : "rgba(201,160,74,0.08)",
                border: "1px solid rgba(201,160,74,0.25)",
                color: input.trim() && !isTyping ? "#c9a04a" : "rgba(201,160,74,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: input.trim() && !isTyping ? "pointer" : "not-allowed",
                flexShrink: 0,
                transition: "background 0.2s, color 0.2s",
              }}
              aria-label="Send message"
            >
              <Send style={{ width: "14px", height: "14px" }} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Floating avatar button ── */}
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) {
            setSpectreState("happy_greeting");
          }
        }}
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          overflow: "hidden",
          background: "#0a0908",
          boxShadow: open
            ? "0 0 0 2px rgba(201,160,74,0.6), 0 8px 24px rgba(0,0,0,0.5)"
            : "0 0 0 2px rgba(201,160,74,0.25), 0 8px 24px rgba(0,0,0,0.4)",
          transform: open ? "scale(0.95)" : "scale(1)",
          transition: "box-shadow 0.2s, transform 0.2s",
          cursor: "pointer",
          border: "none",
          padding: 0,
        }}
        aria-label="Open Specter chat"
        title="Chat with Specter"
      >
        <SpectreVideoPlayer
          state={open ? spectreState : "happy_greeting"}
          size="sm"
          style={{ width: "100%", height: "100%" }}
        />
      </button>

      {/* Bounce keyframes injected inline */}
      <style>{`
        @keyframes chatbot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
