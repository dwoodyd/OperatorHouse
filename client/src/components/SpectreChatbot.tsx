/**
 * SpectreChatbot — floating bottom-right customer service chatbot
 *
 * - Shows Specter as a small avatar in the bottom-right corner
 * - Auto-opens on first visit (localStorage flag "spectre_chatbot_greeted")
 * - Can be dismissed; user can reopen by clicking the avatar
 * - Respects spectreChatbotEnabled from SpectreContext
 * - Sends messages to the /api/trpc chat procedure
 */

import { useState, useEffect, useRef } from "react";
import { X, Send, ChevronDown } from "lucide-react";
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
  const [spectreState, setSpectreState] = useState<"idle" | "typing" | "thinking" | "wave">("idle");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chatMutation = trpc.operator.chat.useMutation({
    onSuccess: (data: { reply: string }) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
      setIsTyping(false);
      setSpectreState("idle");
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I ran into an issue. Please try again." },
      ]);
      setIsTyping(false);
      setSpectreState("idle");
    },
  });

  // Auto-open on first visit
  useEffect(() => {
    if (!spectreChatbotEnabled) return;
    const greeted = localStorage.getItem(GREETED_KEY);
    if (!greeted) {
      const timer = setTimeout(() => {
        setOpen(true);
        setSpectreState("wave");
        setTimeout(() => setSpectreState("idle"), 3000);
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
    setTimeout(() => setSpectreState("typing"), 1200);
    chatMutation.mutate({
      message: text,
      history: messages
        .filter((m) => m.role !== "assistant" || m !== messages[0]) // skip welcome
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
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Chat panel */}
      <div
        className={cn(
          "transition-all duration-300 origin-bottom-right",
          open
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        )}
        style={{ width: "340px" }}
      >
        <div className="rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-[#0a0a0a] flex flex-col"
          style={{ height: "480px" }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#111]">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-black flex-shrink-0 ring-1 ring-[#c9a84c]/40">
                <SpectreVideoPlayer
                state={spectreState}
                size="xs"
                className="w-full h-full"
                style={{ mixBlendMode: "multiply" }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white leading-none">Specter</p>
              <p className="text-xs text-white/40 mt-0.5">Operator House Support</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/40 hover:text-white/80 transition-colors p-1 rounded"
              aria-label="Close chat"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-2 text-sm",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-white/5 flex-shrink-0 ring-1 ring-[#c9a84c]/30 mt-0.5">
                    <img
                      src="/manus-storage/spector_friendly_welcome_6fb4122e.png"
                      alt="Specter"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-xl px-3 py-2 max-w-[80%] leading-relaxed",
                    msg.role === "user"
                      ? "bg-[#c9a84c]/20 text-white/90 rounded-tr-sm"
                      : "bg-white/5 text-white/80 rounded-tl-sm"
                  )}
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
              <div className="flex gap-2 text-sm">
                <div className="w-6 h-6 rounded-full overflow-hidden bg-black flex-shrink-0 ring-1 ring-[#c9a84c]/30 mt-0.5">
                  <SpectreVideoPlayer
                    state={spectreState}
                    size="xs"
                    className="w-full h-full"
                    style={{ mixBlendMode: "screen" }}
                  />
                </div>
                <div className="bg-white/5 rounded-xl rounded-tl-sm px-3 py-2">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-white/10 flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Specter anything..."
              rows={1}
              className="flex-1 resize-none bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
              style={{ maxHeight: "80px" }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="p-2 rounded-lg bg-[#c9a84c]/20 hover:bg-[#c9a84c]/30 text-[#c9a84c] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating avatar button */}
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) {
            setSpectreState("wave");
            setTimeout(() => setSpectreState("idle"), 2500);
          }
        }}
        className={cn(
          "w-14 h-14 rounded-full overflow-hidden bg-black shadow-xl ring-2 transition-all duration-200",
          open ? "ring-[#c9a84c]/60 scale-95" : "ring-[#c9a84c]/30 hover:ring-[#c9a84c]/60 hover:scale-105"
        )}
        aria-label="Open Specter chat"
        title="Chat with Specter"
      >
        <SpectreVideoPlayer
          state={open ? spectreState : "idle"}
          size="sm"
          className="w-full h-full"
          style={{ mixBlendMode: "screen" }}
        />
      </button>
    </div>
  );
}
