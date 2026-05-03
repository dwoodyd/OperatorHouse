/* =============================================================================
   Operator House — AppLayout (Phase 3 Premium + Mobile Responsive)
   Glassmorphism sidebar + frosted topbar + gradient logo
   Mobile: hamburger overlay drawer; Desktop: collapsible sidebar
   Accessibility: ARIA landmarks, anchor-based nav, labeled buttons
   ============================================================================= */
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Search, GitBranch, FileText, Archive,
  BarChart3, Settings, ChevronLeft, ChevronRight, Zap, CheckSquare, Terminal, Menu, X, Info, PlayCircle, LogOut, CreditCard,
  MessageSquare, Phone, Mic, Mail, Activity, Lock,
  Users, Share2, Workflow, Telescope, Receipt, CalendarDays, Globe, Shield, FileSignature, Star, Plug, Layers,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import CommandLine from "./CommandLine";
import NotificationBell from "./NotificationBell";
import { useCommandPalette } from "@/components/CommandPalette";
import { useIntroReplay } from "@/contexts/IntroReplayContext";
import { trpc } from "@/lib/trpc";

interface NavItem { icon: React.ElementType; label: string; path: string; pro?: boolean; business?: boolean; enterprise?: boolean; }
interface NavSection { title: string; items: NavItem[]; }

const NAV_SECTIONS: NavSection[] = [
  {
    title: "COMMAND",
    items: [
      { icon: LayoutDashboard, label: "Command Center",     path: "/dashboard" },
      { icon: Search,          label: "Lead Intelligence",  path: "/leads" },
      { icon: GitBranch,       label: "Client Pipeline",    path: "/pipeline" },
      { icon: FileText,        label: "Strategy Generator", path: "/strategy" },
      { icon: Archive,         label: "The Vault",          path: "/vault" },
      { icon: CheckSquare,     label: "Tasks",              path: "/tasks" },
    ],
  },
  {
    title: "OUTREACH",
    items: [
      { icon: Activity,      label: "Client Pulse",     path: "/pulse",        pro: true },
      { icon: MessageSquare, label: "SMS Outreach",     path: "/sms",          pro: true },
      { icon: Phone,         label: "Call Center",      path: "/call-center",     pro: true },
      { icon: Mail,          label: "Email Sequences",  path: "/email-sequences", pro: true },
      { icon: Mic,           label: "Voice Agents",     path: "/voice-agents", pro: true },
    ],
  },
  {
    title: "GROWTH",
    items: [
      { icon: Users,        label: "CRM Suite",           path: "/crm",         business: true },
      { icon: Layers,       label: "Funnel Builder",        path: "/funnels",     business: true },
      { icon: Share2,       label: "Social Media Agents",  path: "/social",      business: true },
      { icon: Workflow,     label: "Automations",          path: "/automations", business: true },
      { icon: Telescope,    label: "Prospecting Engine",   path: "/prospecting", business: true },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { icon: Receipt,      label: "Invoicing",      path: "/invoicing",   business: true },
      { icon: CalendarDays, label: "Booking",         path: "/booking",     business: true },
      { icon: Globe,        label: "Client Portal",  path: "/portal",      business: true },
    ],
  },
  {
    title: "ENTERPRISE",
    items: [
      { icon: Shield,        label: "Team & Permissions", path: "/team",         business: true },
      { icon: FileSignature, label: "Contracts",           path: "/contracts",    business: true },
      { icon: Star,          label: "Reputation",          path: "/reputation",   business: true },
      { icon: Plug,          label: "Integrations Hub",    path: "/integrations", business: true },
    ],
  },
  {
    title: "INTEL",
    items: [
      { icon: BarChart3, label: "Analytics",       path: "/analytics" },
      { icon: Info,      label: "About & Features", path: "/about" },
      { icon: CreditCard,label: "Pricing",          path: "/pricing" },
    ],
  },
];

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

function PaletteButton() {
  const { open } = useCommandPalette();
  return (
    <button
      onClick={open}
      title="Command Palette (⌘K)"
      aria-label="Open command palette (Cmd+K)"
      className="flex items-center gap-1.5"
      style={{
        height: "36px",
        padding: "0 10px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "6px",
        color: "var(--text-secondary)",
        transition: "background 180ms ease, border-color 180ms ease, color 180ms ease",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,166,35,0.08)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,166,35,0.3)";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--amber)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
      }}
    >
      <Search size={13} />
      <span
        className="hidden sm:inline"
        style={{ fontFamily: "Fira Code, monospace", fontSize: "10px", letterSpacing: "0.06em", opacity: 0.7 }}
      >
        ⌘K
      </span>
    </button>
  );
}


function ReplayIntroSidebarButton() {
  const { replayIntro } = useIntroReplay();
  return (
    <button
      onClick={replayIntro}
      aria-label="Replay intro"
      className="sidebar-item w-full"
      style={{
        justifyContent: "flex-start",
        gap: "10px",
        color: "var(--text-muted)",
        fontSize: "12px",
        fontFamily: "DM Sans, sans-serif",
      }}
      title="Replay Intro"
    >
      <PlayCircle size={13} style={{ flexShrink: 0, color: "var(--text-muted)" }} />
      <span>Replay Intro</span>
    </button>
  );
}

export default function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandLineOpen, setCommandLineOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  // bellOpen state is now managed inside NotificationBell component
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch subscription tier for Pro gating
  const { data: subData } = trpc.subscription.getMyTier.useQuery(undefined, {
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
  const isPro = subData?.tier === "operator_pro";

  // Listen for oh:open-specter custom event dispatched by the Command Palette
  useEffect(() => {
    const handler = () => setCommandLineOpen(true);
    window.addEventListener('oh:open-specter', handler);
    return () => window.removeEventListener('oh:open-specter', handler);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Auto-collapse sidebar on tablet (768–1024px)
  useEffect(() => {
    const checkTablet = () => {
      if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setCollapsed(true);
      } else if (window.innerWidth >= 1024) {
        setCollapsed(false);
      }
    };
    checkTablet();
    window.addEventListener("resize", checkTablet);
    return () => window.removeEventListener("resize", checkTablet);
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "OH";

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-3 flex-shrink-0"
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          height: "64px",
          overflow: "hidden",
        }}
      >
        <div
          className="flex-shrink-0 flex items-center justify-center relative"
          style={{ width: "48px", height: "48px", flexShrink: 0 }}
        >
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663270045694/UYrVyz2BYHYzFAx4PneEpK/oh-symbol-gold_7639fe83.webp"
            alt="Operator House"
            style={{ width: "48px", height: "48px", objectFit: "contain", display: "block" }}
          />
        </div>
        {(!collapsed || isMobile) && (
          <div style={{ overflow: "hidden", minWidth: 0, flex: 1 }}>
            <div
              className="text-amber-gradient"
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "16px",
                fontWeight: 700,
                lineHeight: 1.2,
                whiteSpace: "nowrap",
              }}
            >
              Operator House
            </div>
            <div
              style={{
                fontFamily: "Fira Code, monospace",
                fontSize: "9px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginTop: "2px",
              }}
            >
              YOUR OPERATOR HQ
            </div>
          </div>
        )}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
            style={{
              marginLeft: "auto",
              color: "var(--text-muted)",
              padding: "4px",
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav — sectioned: COMMAND / OUTREACH / INTEL */}
      <nav
        role="navigation"
        aria-label="Main navigation"
        className="flex-1 px-2 py-3 overflow-y-auto"
        style={{ display: "flex", flexDirection: "column", gap: "2px" }}
      >
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} style={{ marginBottom: 6 }}>
            {(!collapsed || isMobile) && (
              <p style={{
                fontFamily: "Fira Code, monospace",
                fontSize: 8,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(212,168,83,0.35)",
                padding: "6px 12px 3px",
                marginBottom: 1,
              }}>
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const isActive =
                location === item.path ||
                (item.path === "/dashboard" && location === "/");
              const isLocked = (item.pro && !isPro) || (item.business && !isPro) || item.enterprise;
              if (isLocked) {
                return (
                  <button
                    key={item.path}
                    onClick={() => setLocation("/pricing")}
                    title={!isMobile && collapsed ? `${item.label} — Operator Pro` : undefined}
                    className="sidebar-item w-full text-left"
                    style={{
                      justifyContent: !isMobile && collapsed ? "center" : "flex-start",
                      padding: !isMobile && collapsed ? "10px" : "9px 12px",
                      display: "flex", alignItems: "center", gap: "10px",
                      opacity: 0.45, cursor: "pointer", background: "none", border: "none", width: "100%",
                    }}
                  >
                    <item.icon size={15} style={{ flexShrink: 0, color: "var(--text-muted)" }} />
                    {(!collapsed || isMobile) && (
                      <>
                        <span style={{ fontSize: "13px", color: "var(--text-muted)", flex: 1, textAlign: "left" }}>
                          {item.label}
                        </span>
                        <Lock size={10} style={{ color: "rgba(212,168,83,0.5)", flexShrink: 0 }} />
                      </>
                    )}
                  </button>
                );
              }
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  className={`sidebar-item w-full text-left ${isActive ? "active" : ""}`}
                  style={{
                    justifyContent: !isMobile && collapsed ? "center" : "flex-start",
                    padding: !isMobile && collapsed ? "10px" : "9px 12px",
                    display: "flex", alignItems: "center", gap: "10px", textDecoration: "none",
                  }}
                  title={!isMobile && collapsed ? item.label : undefined}
                >
                  <item.icon
                    size={15}
                    style={{
                      flexShrink: 0,
                      color: isActive ? "var(--amber)" : "var(--text-secondary)",
                      filter: isActive ? "drop-shadow(0 0 5px rgba(245,166,35,0.55))" : "none",
                      transition: "color 180ms ease, filter 180ms ease",
                    }}
                  />
                  {(!collapsed || isMobile) && (
                    <span style={{
                      fontSize: "13px",
                      fontWeight: isActive ? 500 : 400,
                      color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                      transition: "color 180ms ease",
                    }}>
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "10px 8px 14px" }}>
        {(!collapsed || isMobile) && user && (
          <div
            className="flex items-center gap-2 px-2 py-2 mb-2"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "6px",
            }}
          >
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--amber) 0%, #E8940F 100%)",
                fontSize: "10px",
                fontWeight: 700,
                color: "#0A0A0B",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.name ?? "Operator"}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  fontFamily: "Fira Code, monospace",
                }}
              >
                {user.role === "admin" ? "ADMIN" : "OPERATOR"}
              </div>
            </div>
          </div>
        )}

        <Link
          href="/settings"
          aria-label="Settings"
          aria-current={location === "/settings" ? "page" : undefined}
          className={`sidebar-item w-full ${location === "/settings" ? "active" : ""}`}
          style={{
            justifyContent: !isMobile && collapsed ? "center" : "flex-start",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
            padding: !isMobile && collapsed ? "10px" : "9px 12px",
          }}
          title={!isMobile && collapsed ? "Settings" : undefined}
        >
          <Settings
            size={14}
            style={{
              flexShrink: 0,
              color: location === "/settings" ? "var(--amber)" : "var(--text-secondary)",
            }}
          />
          {(!collapsed || isMobile) && (
            <span style={{ fontSize: "13px", color: location === "/settings" ? "var(--text-primary)" : "var(--text-secondary)" }}>Settings</span>
          )}
        </Link>

        {/* Sign Out button */}
        <button
          onClick={() => setConfirmSignOut(true)}
          aria-label="Sign out"
          className="sidebar-item w-full"
          style={{
            justifyContent: !isMobile && collapsed ? "center" : "flex-start",
            gap: "10px",
            color: "var(--text-muted)",
            fontSize: "12px",
            fontFamily: "DM Sans, sans-serif",
            padding: !isMobile && collapsed ? "10px" : "9px 12px",
          }}
          title={!isMobile && collapsed ? "Sign Out" : undefined}
        >
          <LogOut size={13} style={{ flexShrink: 0, color: "var(--text-muted)" }} />
          {(!collapsed || isMobile) && <span>Sign Out</span>}
        </button>

         {/* Replay Intro — hidden when collapsed on desktop */}
        {(!collapsed || isMobile) && (
          <ReplayIntroSidebarButton />
        )}
        {/* Collapse toggle — desktop only */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="sidebar-item w-full mt-0.5"
            style={{ justifyContent: collapsed ? "center" : "flex-start" }}
          >
            {collapsed ? (
              <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
            ) : (
              <>
                <ChevronLeft size={14} style={{ color: "var(--text-muted)" }} />
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Collapse
                </span>
              </>
            )}
          </button>
        )}
      </div>
    </>
  );

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--obsidian-deep)" }}
    >
      {/* Global ambient glow */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background:
            "radial-gradient(ellipse 70% 50% at 15% -10%, rgba(245,166,35,0.05) 0%, transparent 65%)",
        }}
      />

      {/* ── Desktop Sidebar ───────────────────────────────────────────────── */}
      <aside
        role="complementary"
        aria-label="Sidebar"
        className="hidden md:flex flex-col flex-shrink-0 relative z-20"
        style={{
          width: collapsed ? "60px" : "224px",
          background:
            "linear-gradient(180deg, rgba(14,14,22,0.97) 0%, rgba(8,8,13,0.98) 100%)",
          borderRight: "1px solid var(--border-subtle)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          transition: "width 220ms cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "4px 0 32px rgba(0,0,0,0.35)",
        }}
      >
        <SidebarContent isMobile={false} />
      </aside>

      {/* ── Mobile Overlay Drawer ─────────────────────────────────────────── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside
            role="navigation"
            aria-label="Mobile navigation"
            className="fixed top-0 left-0 h-full z-50 flex flex-col md:hidden"
            style={{
              width: "260px",
              background:
                "linear-gradient(180deg, rgba(14,14,22,0.99) 0%, rgba(8,8,13,0.99) 100%)",
              borderRight: "1px solid var(--border-subtle)",
              boxShadow: "8px 0 40px rgba(0,0,0,0.6)",
              animation: "slideInLeft 200ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <SidebarContent isMobile={true} />
          </aside>
        </>
      )}

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden relative z-10 min-w-0">
        {/* Frosted topbar */}
        <header
          role="banner"
          className="flex items-center justify-between flex-shrink-0"
          style={{
            height: "64px",
            padding: "0 16px",
            background: "rgba(8,8,13,0.82)",
            backdropFilter: "blur(24px) saturate(1.6)",
            WebkitBackdropFilter: "blur(24px) saturate(1.6)",
            borderBottom: "1px solid var(--border-subtle)",
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.25)",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile hamburger */}
            <button
              className="flex md:hidden items-center justify-center flex-shrink-0"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              style={{
                width: "36px",
                height: "36px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "6px",
                color: "var(--text-secondary)",
              }}
            >
              <Menu size={16} />
            </button>

            <div className="min-w-0">
              {title && (
                <h1
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {title}
                </h1>
              )}
              {subtitle && (
                <p
                  className="data-label"
                  style={{
                    marginTop: "2px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5"
              aria-hidden="true"
              style={{
                background: "rgba(245,166,35,0.06)",
                border: "1px solid rgba(245,166,35,0.18)",
                borderRadius: "4px",
              }}
            >
              <Zap size={11} style={{ color: "var(--amber)" }} />
              <span
                style={{
                  fontFamily: "Fira Code, monospace",
                  fontSize: "10px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--amber)",
                }}
              >
                Operator HQ
              </span>
            </div>

            {/* Command Line toggle */}
            <button
              onClick={() => setCommandLineOpen(prev => !prev)}
              className="flex items-center gap-2"
              title="Open Command Line (⌘K)"
              aria-label="Open Command Line (Cmd+K)"
              aria-expanded={commandLineOpen}
              style={{
                height: "36px",
                padding: "0 12px",
                background: commandLineOpen
                  ? "rgba(245,166,35,0.12)"
                  : "rgba(255,255,255,0.04)",
                border: `1px solid ${
                  commandLineOpen ? "var(--border-amber)" : "var(--border-subtle)"
                }`,
                borderRadius: "6px",
                color: commandLineOpen ? "var(--amber)" : "var(--text-secondary)",
                transition: "background 180ms ease, border-color 180ms ease, color 180ms ease",
                boxShadow: commandLineOpen
                  ? "0 0 14px rgba(245,166,35,0.15)"
                  : "none",
              }}
            >
              <Terminal size={13} />
              <span
                className="hidden sm:inline"
                style={{
                  fontFamily: "Fira Code, monospace",
                  fontSize: "11px",
                  letterSpacing: "0.06em",
                }}
              >
                CMD
              </span>
              <span
                className="hidden md:inline"
                style={{
                  fontFamily: "Fira Code, monospace",
                  fontSize: "9px",
                  letterSpacing: "0.04em",
                  opacity: 0.5,
                  marginLeft: "2px",
                }}
               >
                AI
              </span>
            </button>
            {/* Global Command Palette trigger */}
            <PaletteButton />
            {/* Notifications bell */}
            <NotificationBell iconSize={14} />
          </div>
        </header>

        {/* Page Content */}
        <main
          role="main"
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ background: "var(--obsidian-deep)" }}
        >
          {children}
        </main>
      </div>

      {/* Command Line AI Chat Sidebar */}
      <CommandLine open={commandLineOpen} onClose={() => setCommandLineOpen(false)} />

      {/* Sign-out confirmation dialog */}
      {confirmSignOut && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-sm p-6 space-y-4"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
            }}
          >
            <div className="flex items-center gap-3">
              <LogOut size={18} style={{ color: "var(--amber)" }} />
              <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                Sign Out
              </h3>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              Are you sure you want to sign out of Operator House?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmSignOut(false)}
                className="flex-1 py-2 text-sm font-medium"
                style={{
                  background: "var(--surface-raised)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "6px",
                  fontFamily: "DM Sans, sans-serif",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setConfirmSignOut(false); logout(); }}
                className="flex-1 py-2 text-sm font-semibold"
                style={{
                  background: "rgba(245,166,35,0.12)",
                  color: "var(--amber)",
                  border: "1px solid rgba(245,166,35,0.35)",
                  borderRadius: "6px",
                  fontFamily: "DM Sans, sans-serif",
                  cursor: "pointer",
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile slide-in animation */}
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
