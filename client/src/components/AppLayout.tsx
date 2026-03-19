/* =============================================================================
   GhostDesk — AppLayout
   Obsidian Intelligence: Persistent sidebar + content area
   ============================================================================= */

import { useState } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard,
  Search,
  GitBranch,
  FileText,
  Archive,
  BarChart3,
  Ghost,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Command Center", path: "/", shortcut: "D" },
  { icon: Search, label: "Lead Intelligence", path: "/leads", shortcut: "L" },
  { icon: GitBranch, label: "Client Pipeline", path: "/pipeline", shortcut: "P" },
  { icon: FileText, label: "Strategy Generator", path: "/strategy", shortcut: "S" },
  { icon: Archive, label: "The Vault", path: "/vault", shortcut: "V" },
  { icon: BarChart3, label: "Analytics", path: "/analytics", shortcut: "A" },
];

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [ghostActive, setGhostActive] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--obsidian)' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col flex-shrink-0 transition-all duration-200 ease-in-out"
        style={{
          width: collapsed ? '60px' : '220px',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 py-5"
          style={{ borderBottom: '1px solid var(--border-subtle)', minHeight: '64px' }}
        >
          <div
            className="flex-shrink-0 flex items-center justify-center"
            style={{
              width: '32px',
              height: '32px',
              background: 'var(--amber-dim)',
              border: '1px solid var(--border-amber)',
            }}
          >
            <Ghost size={16} style={{ color: 'var(--amber)' }} />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}
              >
                GhostDesk
              </div>
              <div className="data-label" style={{ marginTop: '1px' }}>Soul Engineer OS</div>
            </div>
          )}
        </div>

        {/* Ghost Status */}
        {!collapsed && (
          <div
            className="mx-3 my-3 p-3"
            style={{
              background: ghostActive ? 'var(--amber-glow)' : 'var(--surface-raised)',
              border: `1px solid ${ghostActive ? 'var(--border-amber)' : 'var(--border-subtle)'}`,
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="data-label">Ghost Status</span>
              <span
                className="status-dot"
                style={{
                  background: ghostActive ? 'var(--amber)' : 'var(--text-muted)',
                  boxShadow: ghostActive ? '0 0 6px var(--amber-dim)' : 'none',
                  animation: ghostActive ? 'statusPulse 2s ease-in-out infinite' : 'none',
                }}
              />
            </div>
            <div
              style={{
                fontFamily: 'Fira Code, monospace',
                fontSize: '12px',
                color: ghostActive ? 'var(--amber)' : 'var(--text-muted)',
              }}
            >
              {ghostActive ? 'ACTIVE — Monitoring' : 'STANDBY'}
            </div>
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 px-2 py-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.path;
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className="sidebar-item w-full text-left mb-1"
                style={{
                  background: isActive ? 'var(--amber-glow)' : 'transparent',
                  color: isActive ? 'var(--amber)' : 'var(--text-secondary)',
                  borderLeftColor: isActive ? 'var(--amber)' : 'transparent',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '10px' : '8px 12px',
                }}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={16} style={{ flexShrink: 0 }} />
                {!collapsed && (
                  <span style={{ fontSize: '13px', fontWeight: isActive ? 500 : 400 }}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '12px 8px' }}>
          <button
            onClick={() => toast.info("Settings coming soon")}
            className="sidebar-item w-full"
            style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            <Settings size={15} />
            {!collapsed && <span style={{ fontSize: '13px' }}>Settings</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="sidebar-item w-full mt-1"
            style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            {!collapsed && <span style={{ fontSize: '13px' }}>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <header
          className="flex items-center justify-between px-6 flex-shrink-0"
          style={{
            height: '64px',
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            {title && (
              <h1
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1.2,
                }}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="data-label" style={{ marginTop: '2px' }}>{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: 'var(--amber-glow)', border: '1px solid var(--border-amber)' }}>
              <Zap size={12} style={{ color: 'var(--amber)' }} />
              <span className="data-label" style={{ color: 'var(--amber)' }}>Soul Engineer Framework</span>
            </div>
            <button
              onClick={() => toast.info("Notifications coming soon")}
              className="flex items-center justify-center"
              style={{
                width: '36px',
                height: '36px',
                background: 'var(--surface-raised)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                transition: 'all 150ms ease',
              }}
            >
              <Bell size={15} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--obsidian)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
