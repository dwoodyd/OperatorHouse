/* =============================================================================
   Operator House — AppLayout (Phase 3 Premium)
   Glassmorphism sidebar + frosted topbar + gradient logo
   ============================================================================= */
import { useState } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard, Search, GitBranch, FileText, Archive,
  BarChart3, Ghost, Settings, Bell, ChevronLeft, ChevronRight, Zap, CheckSquare, Terminal,
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
];

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [commandLineOpen, setCommandLineOpen] = useState(false);
  const { user } = useAuth();

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "OH";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--obsidian-deep)' }}>

      {/* Global ambient glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 70% 50% at 15% -10%, rgba(245,166,35,0.05) 0%, transparent 65%)',
      }} />

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className="flex flex-col flex-shrink-0 relative z-10"
        style={{
          width: collapsed ? '60px' : '224px',
          background: 'linear-gradient(180deg, rgba(14,14,22,0.97) 0%, rgba(8,8,13,0.98) 100%)',
          borderRight: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          transition: 'width 220ms cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '4px 0 32px rgba(0,0,0,0.35)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)', height: '64px', overflow: 'hidden' }}
        >
          <div
            className="flex-shrink-0 flex items-center justify-center relative"
            style={{
              width: '34px', height: '34px',
              background: 'linear-gradient(135deg, rgba(245,166,35,0.22) 0%, rgba(245,166,35,0.07) 100%)',
              border: '1px solid var(--border-amber)',
              borderRadius: '8px',
              boxShadow: '0 0 20px rgba(245,166,35,0.18), inset 0 1px 0 rgba(255,255,255,0.12)',
              flexShrink: 0,
            }}
          >
            <Ghost size={16} style={{ color: 'var(--amber)' }} />
            <div style={{
              position: 'absolute', top: '-3px', right: '-3px',
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#4ADE80',
              boxShadow: '0 0 8px rgba(74,222,128,0.8)',
              border: '1.5px solid var(--obsidian-deep)',
              animation: 'statusPulse 2.5s ease-in-out infinite',
            }} />
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <div
                className="text-amber-gradient"
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '16px', fontWeight: 700, lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}
              >
                Operator House
              </div>
              <div style={{
                fontFamily: 'Fira Code, monospace', fontSize: '9px',
                letterSpacing: '0.15em', textTransform: 'uppercase',
                color: 'var(--text-muted)', marginTop: '2px',
              }}>
                YOUR OPERATOR HQ
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.path || (item.path === '/dashboard' && location === '/');
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`sidebar-item w-full text-left ${isActive ? 'active' : ''}`}
                style={{
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '10px' : '9px 12px',
                }}
                title={collapsed ? item.label : undefined}
              >
                <item.icon
                  size={15}
                  style={{
                    flexShrink: 0,
                    color: isActive ? 'var(--amber)' : 'var(--text-secondary)',
                    filter: isActive ? 'drop-shadow(0 0 5px rgba(245,166,35,0.55))' : 'none',
                    transition: 'all 180ms ease',
                  }}
                />
                {!collapsed && (
                  <span style={{
                    fontSize: '13px',
                    fontWeight: isActive ? 500 : 400,
                    transition: 'all 180ms ease',
                  }}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '10px 8px 14px' }}>
          {/* User row */}
          {!collapsed && user && (
            <div
              className="flex items-center gap-2 px-2 py-2 mb-2"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
              }}
            >
              <div
                className="flex-shrink-0 flex items-center justify-center"
                style={{
                  width: '26px', height: '26px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--amber) 0%, #E8940F 100%)',
                  fontSize: '10px', fontWeight: 700, color: '#0A0A0B',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {user.name ?? "Operator"}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'Fira Code, monospace' }}>
                  {user.role === 'admin' ? 'ADMIN' : 'OPERATOR'}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setLocation('/settings')}
            className={`sidebar-item w-full ${location === '/settings' ? 'active' : ''}`}
            style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            <Settings
              size={14}
              style={{
                flexShrink: 0,
                color: location === '/settings' ? 'var(--amber)' : 'var(--text-secondary)',
              }}
            />
            {!collapsed && <span style={{ fontSize: '13px' }}>Settings</span>}
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="sidebar-item w-full mt-0.5"
            style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            {collapsed
              ? <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
              : (
                <>
                  <ChevronLeft size={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Collapse</span>
                </>
              )
            }
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden relative z-10">
        {/* Frosted topbar */}
        <header
          className="flex items-center justify-between px-6 flex-shrink-0"
          style={{
            height: '64px',
            background: 'rgba(8,8,13,0.82)',
            backdropFilter: 'blur(24px) saturate(1.6)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
            borderBottom: '1px solid var(--border-subtle)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          <div>
            {title && (
              <h1 style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '20px', fontWeight: 700,
                color: 'var(--text-primary)', lineHeight: 1.2,
              }}>
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="data-label" style={{ marginTop: '2px' }}>{subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5"
              style={{
                background: 'rgba(245,166,35,0.06)',
                border: '1px solid rgba(245,166,35,0.18)',
                borderRadius: '4px',
              }}
            >
              <Zap size={11} style={{ color: 'var(--amber)' }} />
              <span style={{
                fontFamily: 'Fira Code, monospace', fontSize: '10px',
                letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--amber)',
              }}>
                Operator HQ
              </span>
            </div>
            {/* Command Line toggle */}
            <button
              onClick={() => setCommandLineOpen(true)}
              className="flex items-center gap-2"
              title="Open Command Line"
              style={{
                height: '36px',
                padding: '0 12px',
                background: commandLineOpen ? 'rgba(245,166,35,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${commandLineOpen ? 'var(--border-amber)' : 'var(--border-subtle)'}`,
                borderRadius: '6px',
                color: commandLineOpen ? 'var(--amber)' : 'var(--text-secondary)',
                transition: 'all 180ms ease',
                boxShadow: commandLineOpen ? '0 0 14px rgba(245,166,35,0.15)' : 'none',
              }}
              onMouseEnter={e => {
                if (!commandLineOpen) {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.borderColor = 'var(--border-amber)';
                  el.style.color = 'var(--amber)';
                  el.style.boxShadow = '0 0 12px rgba(245,166,35,0.12)';
                }
              }}
              onMouseLeave={e => {
                if (!commandLineOpen) {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.borderColor = 'var(--border-subtle)';
                  el.style.color = 'var(--text-secondary)';
                  el.style.boxShadow = 'none';
                }
              }}
            >
              <Terminal size={13} />
              <span style={{ fontFamily: 'Fira Code, monospace', fontSize: '11px', letterSpacing: '0.06em' }}>CMD</span>
            </button>
            <button
              className="flex items-center justify-center"
              style={{
                width: '36px', height: '36px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                transition: 'all 180ms ease',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = 'var(--border-amber)';
                el.style.color = 'var(--amber)';
                el.style.boxShadow = '0 0 12px rgba(245,166,35,0.12)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = 'var(--border-subtle)';
                el.style.color = 'var(--text-secondary)';
                el.style.boxShadow = 'none';
              }}
            >
              <Bell size={14} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--obsidian-deep)' }}>
          {children}
        </main>
      </div>

      {/* Command Line AI Chat Sidebar */}
      <CommandLine open={commandLineOpen} onClose={() => setCommandLineOpen(false)} />
    </div>
  );
}
