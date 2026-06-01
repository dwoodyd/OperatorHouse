/* =============================================================================
   Operator House — Command Palette (Cmd+K / Ctrl+K)
   Global search and navigation shortcut overlay.
   ============================================================================= */
import { useEffect, useRef, useState, useCallback, useTransition } from "react";
import { useLocation } from "wouter";
import {
  Search, LayoutDashboard, GitBranch, FileText, Archive, CheckSquare,
  Activity, MessageSquare, Phone, Mail, Mic, Users, Layers, Share2,
  Workflow, Receipt, CalendarDays, Globe, Shield, FileSignature,
  Star, Plug, BarChart3, Info, CreditCard, MessageCircle, Settings,
  ArrowRight, Command,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface PaletteAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  category: string;
  keywords?: string[];
  action: () => void;
}

// ── Static navigation actions ─────────────────────────────────────────────────
function buildNavActions(navigate: (path: string) => void): PaletteAction[] {
  const pages: Array<{ label: string; path: string; icon: React.ElementType; description?: string }> = [
    { label: "Command Center",       path: "/dashboard",       icon: LayoutDashboard,  description: "Your daily briefing and metrics" },
    { label: "Lead Intelligence",    path: "/leads",           icon: Search,           description: "Analyze and score inbound leads" },
    { label: "Client Pipeline",      path: "/pipeline",        icon: GitBranch,        description: "Kanban deal board" },
    { label: "Strategy Generator",   path: "/strategy",        icon: FileText,         description: "Generate client strategies with AI" },
    { label: "The Vault",            path: "/vault",           icon: Archive,          description: "Frameworks, templates, case studies" },
    { label: "Tasks",                path: "/tasks",           icon: CheckSquare,      description: "Your task list" },
    { label: "Client Pulse",         path: "/pulse",           icon: Activity,         description: "Client health monitoring" },
    { label: "SMS Outreach",         path: "/sms",             icon: MessageSquare,    description: "Send SMS campaigns" },
    { label: "Call Center",          path: "/call-center",     icon: Phone,            description: "Manage outbound calls" },
    { label: "Email Sequences",      path: "/email-sequences", icon: Mail,             description: "Automated email drip sequences" },
    { label: "Voice Agents",         path: "/voice-agents",    icon: Mic,              description: "AI voice agent configuration" },
    { label: "CRM Suite",            path: "/crm",             icon: Users,            description: "Full CRM contact management" },
    { label: "Funnel Builder",       path: "/funnels",         icon: Layers,           description: "Build lead capture funnels" },
    { label: "Social Media Agents",  path: "/social",          icon: Share2,           description: "Automate social media posting" },
    { label: "Automations",          path: "/automations",     icon: Workflow,         description: "Build workflow automations" },
    { label: "Invoicing",            path: "/invoicing",       icon: Receipt,          description: "Create and send invoices" },
    { label: "Booking",              path: "/booking",         icon: CalendarDays,     description: "Manage appointment scheduling" },
    { label: "Client Portal",        path: "/portal",          icon: Globe,            description: "Client-facing portal" },
    { label: "Team & Permissions",   path: "/team",            icon: Shield,           description: "Manage team access" },
    { label: "Contracts",            path: "/contracts",       icon: FileSignature,    description: "Create and sign contracts" },
    { label: "Reputation",           path: "/reputation",      icon: Star,             description: "Monitor reviews and reputation" },
    { label: "Integrations Hub",     path: "/integrations",    icon: Plug,             description: "Connect third-party services" },
    { label: "Analytics",            path: "/analytics",       icon: BarChart3,        description: "Business performance metrics" },
    { label: "About & Features",     path: "/about",           icon: Info,             description: "Feature overview" },
    { label: "Pricing",              path: "/pricing",         icon: CreditCard,       description: "Plans and billing" },
    { label: "Settings",             path: "/settings",        icon: Settings,         description: "Account and preferences" },
    { label: "Book Specter Audit",  path: "/audit",           icon: CalendarDays,     description: "Schedule a free 15-min strategy call" },
  ];
  return pages.map((p) => ({
    id: `nav:${p.path}`,
    label: p.label,
    description: p.description,
    icon: p.icon,
    category: "Navigate",
    action: () => navigate(p.path),
  }));
}

// ── Fuzzy match helper ────────────────────────────────────────────────────────
function matches(query: string, action: PaletteAction): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    action.label.toLowerCase().includes(q) ||
    (action.description?.toLowerCase().includes(q) ?? false) ||
    (action.keywords?.some((k) => k.toLowerCase().includes(q)) ?? false) ||
    action.category.toLowerCase().includes(q)
  );
}

// ── Context for global open/close ─────────────────────────────────────────────
import { createContext, useContext } from "react";
interface CommandPaletteContextValue {
  open: () => void;
  close: () => void;
}
export const CommandPaletteContext = createContext<CommandPaletteContextValue>({
  open: () => {},
  close: () => {},
});
export function useCommandPalette() {
  return useContext(CommandPaletteContext);
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const openPalette = useCallback(() => setIsOpen(true), []);
  const closePalette = useCallback(() => setIsOpen(false), []);

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <CommandPaletteContext.Provider value={{ open: openPalette, close: closePalette }}>
      {children}
      {isOpen && <CommandPaletteModal onClose={closePalette} />}
    </CommandPaletteContext.Provider>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function CommandPaletteModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [filteredActions, setFilteredActions] = useState<PaletteAction[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  // Build all actions
  const allActions = useCallback((): PaletteAction[] => {
    const navActions = buildNavActions((path) => {
      navigate(path);
      onClose();
    });
    // Special actions
    const specials: PaletteAction[] = [
      {
        id: "action:specter",
        label: "Open Specter AI Chat",
        description: "Ask your AI operator anything",
        icon: MessageCircle,
        category: "Actions",
        keywords: ["ai", "chat", "specter", "assistant", "ask"],
        action: () => {
          // Dispatch a custom event that AppLayout listens to
          window.dispatchEvent(new CustomEvent("oh:open-specter"));
          onClose();
        },
      },
      {
        id: "action:new-lead",
        label: "Analyze New Lead",
        description: "Run Lead Intelligence on a new contact",
        icon: Search,
        category: "Actions",
        keywords: ["lead", "analyze", "new", "intel"],
        action: () => { navigate("/leads"); onClose(); },
      },
      {
        id: "action:new-task",
        label: "Create New Task",
        description: "Add a task to your list",
        icon: CheckSquare,
        category: "Actions",
        keywords: ["task", "todo", "create", "new"],
        action: () => { navigate("/tasks"); onClose(); },
      },
      {
        id: "action:new-deal",
        label: "Add Pipeline Deal",
        description: "Create a new deal in the pipeline",
        icon: GitBranch,
        category: "Actions",
        keywords: ["deal", "pipeline", "new", "create"],
        action: () => { navigate("/pipeline"); onClose(); },
      },
      {
        id: "action:new-vault",
        label: "Add to Vault",
        description: "Save a framework, note, or template",
        icon: Archive,
        category: "Actions",
        keywords: ["vault", "save", "framework", "template", "note"],
        action: () => { navigate("/vault"); onClose(); },
      },
    ];
    return [...specials, ...navActions];
  }, [navigate, onClose]);

  // Filter with useTransition for non-blocking updates
  useEffect(() => {
    startTransition(() => {
      const actions = allActions();
      setFilteredActions(actions.filter((a) => matches(query, a)));
      setSelectedIndex(0);
    });
  }, [query, allActions]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filteredActions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filteredActions[selectedIndex]?.action();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // Group by category
  const grouped = filteredActions.reduce<Record<string, PaletteAction[]>>((acc, action) => {
    if (!acc[action.category]) acc[action.category] = [];
    acc[action.category].push(action);
    return acc;
  }, {});

  // Flat list for index tracking
  const flatList = filteredActions;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-xl mx-4 overflow-hidden"
        style={{
          background: "rgba(14,14,22,0.98)",
          border: "1px solid rgba(245,166,35,0.25)",
          borderRadius: "12px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(245,166,35,0.08)",
          maxHeight: "60vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Search size={16} style={{ color: "rgba(245,166,35,0.7)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, actions, or type a command…"
            className="flex-1 bg-transparent outline-none"
            style={{
              fontSize: "14px",
              color: "var(--text-primary, #E8E6E0)",
              fontFamily: "DM Sans, sans-serif",
            }}
          />
          <div
            className="flex items-center gap-1 flex-shrink-0"
            style={{ fontSize: "10px", color: "rgba(148,163,184,0.5)", fontFamily: "Fira Code, monospace" }}
          >
            <Command size={10} />
            <span>K</span>
          </div>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ overflowY: "auto", flex: 1 }}>
          {isPending && (
            <div style={{ padding: "8px 16px", fontSize: "11px", color: "rgba(148,163,184,0.4)", fontFamily: "DM Sans, sans-serif" }}>
              Searching…
            </div>
          )}
          {!isPending && flatList.length === 0 && (
            <div
              className="flex flex-col items-center justify-center py-10 gap-2"
              style={{ color: "rgba(148,163,184,0.5)" }}
            >
              <Search size={20} strokeWidth={1.5} />
              <span style={{ fontSize: "13px", fontFamily: "DM Sans, sans-serif" }}>No results for "{query}"</span>
            </div>
          )}
          {!isPending && Object.entries(grouped).map(([category, actions]) => (
            <div key={category}>
              <div
                style={{
                  padding: "8px 16px 4px",
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(148,163,184,0.4)",
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                {category}
              </div>
              {actions.map((action) => {
                const globalIdx = flatList.indexOf(action);
                const isSelected = globalIdx === selectedIndex;
                const Icon = action.icon;
                return (
                  <div
                    key={action.id}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                    onClick={action.action}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "9px 16px",
                      cursor: "pointer",
                      background: isSelected ? "rgba(245,166,35,0.08)" : "transparent",
                      borderLeft: isSelected ? "2px solid rgba(245,166,35,0.6)" : "2px solid transparent",
                      transition: "background 100ms, border-color 100ms",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        background: isSelected ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${isSelected ? "rgba(245,166,35,0.3)" : "rgba(255,255,255,0.06)"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: isSelected ? "rgba(245,166,35,0.9)" : "rgba(148,163,184,0.7)",
                        flexShrink: 0,
                        transition: "background 100ms, border-color 100ms, color 100ms",
                      }}
                    >
                      <Icon size={13} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: "13px",
                        fontFamily: "DM Sans, sans-serif",
                        fontWeight: isSelected ? 500 : 400,
                        color: isSelected ? "rgba(232,230,224,0.95)" : "rgba(232,230,224,0.75)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {action.label}
                      </div>
                      {action.description && (
                        <div style={{
                          fontSize: "11px",
                          fontFamily: "DM Sans, sans-serif",
                          color: "rgba(148,163,184,0.5)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                          {action.description}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <ArrowRight size={12} style={{ color: "rgba(245,166,35,0.5)", flexShrink: 0 }} />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div
          className="flex items-center gap-4 px-4 py-2"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            fontSize: "10px",
            color: "rgba(148,163,184,0.35)",
            fontFamily: "Fira Code, monospace",
          }}
        >
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
