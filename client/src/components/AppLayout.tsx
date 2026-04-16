/* =============================================================================
   Operator House — AppLayout (Phase 3 Premium + Mobile Responsive)
   Glassmorphism sidebar + frosted topbar + gradient logo
   Mobile: hamburger overlay drawer; Desktop: collapsible sidebar
   ============================================================================= */
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard, Search, GitBranch, FileText, Archive,
  BarChart3, Settings, Bell, ChevronLeft, ChevronRight, Zap, CheckSquare, Terminal, Menu, X, Info,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import CommandLine from "./CommandLine";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Command Center",    path: "/dashboard" },
  { icon: Search,          label: "Lead Intelligence", path: "/leads" },
  { icon: GitBranch,       label: "Client Pipeline",   path: "/pipeline" },
  { icon: FileText,        label: "Strategy Generator",path: "/strategy" },
  { icon: Archive,         label: "The Vault",         path: "/vault" },
  { icon: BarChart3,       label: "Analytics",         path: "/analytics" },
  { icon: CheckSquare,     label: "Tasks",              path: "/tasks" },
  { icon: Info,            label: "About & Features",   path: "/about" },
];

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandLineOpen, setCommandLineOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const { user } = useAuth();

  // Cmd+K / Ctrl+K shortcut for Command Line
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setCommandLineOpen(prev => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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

      {/* Nav */}
      <nav
        className="flex-1 px-2 py-3 overflow-y-auto"
        aria-label="Main navigation"
        style={{ display: "flex", flexDirection: "column", gap: "2px" }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive =
            location === item.path ||
            (item.path === "/dashboard" && location === "/");
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`sidebar-item w-full text-left ${isActive ? "active" : ""}`}
              style={{
                justifyContent: !isMobile && collapsed ? "center" : "flex-start",
                padding: !isMobile && collapsed ? "10px" : "9px 12px",
              }}
              title={!isMobile && collapsed ? item.label : undefined}
            >
              <item.icon
                size={15}
                style={{
                  flexShrink: 0,
                  color: isActive ? "var(--amber)" : "var(--text-secondary)",
                  filter: isActive
                    ? "drop-shadow(0 0 5px rgba(245,166,35,0.55))"
                    : "none",
                  transition: "all 180ms ease",
                }}
              />
              {(!collapsed || isMobile) && (
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: isActive ? 500 : 400,
                    transition: "all 180ms ease",
                  }}
                >
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
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

        <button
          onClick={() => setLocation("/settings")}
          className={`sidebar-item w-full ${location === "/settings" ? "active" : ""}`}
          style={{
            justifyContent: !isMobile && collapsed ? "center" : "flex-start",
          }}
        >
          <Settings
            size={14}
            style={{
              flexShrink: 0,
              color:
                location === "/settings" ? "var(--amber)" : "var(--text-secondary)",
            }}
          />
          {(!collapsed || isMobile) && (
            <span style={{ fontSize: "13px" }}>Settings</span>
          )}
        </button>

        {/* Collapse toggle — desktop only */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
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
        className="hidden md:flex flex-col flex-shrink-0 relative z-10"
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
          />
          {/* Drawer */}
          <aside
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
              onClick={() => setCommandLineOpen(true)}
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
                transition: "all 180ms ease",
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
            </button>

            <button
              className="flex items-center justify-center relative"
              aria-label="Notifications"
              onClick={() => setBellOpen(prev => !prev)}
              style={{
                width: "36px",
                height: "36px",
                background: bellOpen ? "rgba(245,166,35,0.08)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${bellOpen ? "var(--border-amber)" : "var(--border-subtle)"}`,
                borderRadius: "6px",
                color: bellOpen ? "var(--amber)" : "var(--text-secondary)",
                transition: "background 180ms ease, border-color 180ms ease, color 180ms ease",
              }}
            >
              <Bell size={14} />
              {bellOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: "260px",
                    background: "rgba(14,14,22,0.98)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    padding: "12px",
                    zIndex: 100,
                  }}
                >
                  <div style={{ fontFamily: "Playfair Display, serif", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>Notifications</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "DM Sans, sans-serif", textAlign: "center", padding: "16px 0" }}>No new notifications</div>
                </div>
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ background: "var(--obsidian-deep)" }}
        >
          {children}
        </main>
      </div>

      {/* Command Line AI Chat Sidebar */}
      <CommandLine open={commandLineOpen} onClose={() => setCommandLineOpen(false)} />

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
