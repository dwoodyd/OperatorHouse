/* =============================================================================
   GhostDesk — Dashboard (Command Center)
   Obsidian Intelligence: Overview of all key metrics and recent activity
   ============================================================================= */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import {
  TrendingUp,
  Users,
  FileText,
  Clock,
  ArrowRight,
  Zap,
  Target,
  Brain,
  ChevronRight,
} from "lucide-react";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663270045694/UYrVyz2BYHYzFAx4PneEpK/ghostdesk-hero-bg-mqpyUjmJvCjMV2mgm48ReJ.webp";

// Animated counter hook
function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

const METRICS = [
  { label: "Active Leads", value: 12, suffix: "", icon: Target, trend: "+3 this week" },
  { label: "Strategies Generated", value: 47, suffix: "", icon: Brain, trend: "+8 this month" },
  { label: "Pipeline Value", value: 94, suffix: "K", icon: TrendingUp, trend: "+$12K this week" },
  { label: "Hours Saved", value: 156, suffix: "h", icon: Clock, trend: "This month" },
];

const RECENT_ACTIVITY = [
  { time: "2h ago", action: "Strategy generated", client: "TechFlow Solutions", status: "ready", score: 8.4 },
  { time: "5h ago", action: "Lead analyzed", client: "Marcus Chen — Founder", status: "review", score: 7.1 },
  { time: "1d ago", action: "Voice briefing sent", client: "Apex Creative Agency", status: "sent", score: 9.2 },
  { time: "1d ago", action: "Deep dive completed", client: "SoulBrand Collective", status: "closed", score: 8.8 },
  { time: "2d ago", action: "Lead discovered", client: "NextGen Ventures", status: "new", score: 6.5 },
];

const PIPELINE_PREVIEW = [
  { stage: "Discovery", count: 4, color: "#6B6B7A" },
  { stage: "Analysis", count: 3, color: "#F5A623" },
  { stage: "Strategy", count: 2, color: "#F5A623" },
  { stage: "Proposal", count: 2, color: "#4ADE80" },
  { stage: "Closed", count: 1, color: "#4ADE80" },
];

const STATUS_COLORS: Record<string, string> = {
  ready: "#4ADE80",
  review: "#F5A623",
  sent: "#60A5FA",
  closed: "#A78BFA",
  new: "#6B6B7A",
};

function MetricCard({ label, value, suffix, icon: Icon, trend }: typeof METRICS[0]) {
  const count = useCountUp(value);
  return (
    <div className="ghost-card p-5 fade-in-up">
      <div className="flex items-start justify-between mb-4">
        <div className="data-label">{label}</div>
        <div style={{ color: 'var(--amber)', opacity: 0.6 }}>
          <Icon size={16} />
        </div>
      </div>
      <div
        className="count-up"
        style={{ fontSize: '32px', fontWeight: 700, color: 'var(--amber)', lineHeight: 1 }}
      >
        {count}{suffix}
      </div>
      <div className="data-label mt-2" style={{ color: 'var(--text-muted)' }}>{trend}</div>
    </div>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <AppLayout title="Command Center" subtitle="Soul Engineer OS — Active">
      <div className="p-6 space-y-6">

        {/* Hero Banner */}
        <div
          className="relative overflow-hidden"
          style={{
            background: `url(${HERO_BG}) center/cover no-repeat`,
            minHeight: '200px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(10,10,11,0.92) 0%, rgba(10,10,11,0.6) 60%, rgba(10,10,11,0.3) 100%)' }}
          />
          <div className="relative z-10 p-8">
            <div className="ghost-badge mb-3">Ghost Protocol — Active</div>
            <h2
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                maxWidth: '500px',
                lineHeight: 1.3,
              }}
            >
              Your Ghost is working.<br />
              <span style={{ color: 'var(--amber)' }}>90% done before you start.</span>
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '14px',
                marginTop: '12px',
                maxWidth: '400px',
              }}
            >
              The Soul Engineer framework is running. Lead discovery, strategy generation, and client briefings are being handled autonomously.
            </p>
            <div className="flex items-center gap-4 mt-5">
              <button
                onClick={() => setLocation('/leads')}
                className="flex items-center gap-2 px-4 py-2 transition-all duration-150"
                style={{
                  background: 'var(--amber)',
                  color: 'var(--obsidian)',
                  fontWeight: 600,
                  fontSize: '13px',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                <Zap size={14} />
                Analyze New Lead
              </button>
              <button
                onClick={() => setLocation('/strategy')}
                className="flex items-center gap-2 px-4 py-2 transition-all duration-150"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-amber)',
                  color: 'var(--amber)',
                  fontSize: '13px',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Generate Strategy
                <ArrowRight size={14} />
              </button>
              <div className="ml-auto flex items-center gap-2">
                <span className="status-dot active" />
                <span
                  style={{
                    fontFamily: 'Fira Code, monospace',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                  }}
                >
                  {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {METRICS.map((m) => (
            <MetricCard key={m.label} {...m} />
          ))}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Recent Activity */}
          <div
            className="lg:col-span-2"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Ghost Activity Log
                </div>
                <div className="data-label mt-0.5">Recent autonomous actions</div>
              </div>
              <button
                onClick={() => setLocation('/pipeline')}
                className="flex items-center gap-1 text-xs"
                style={{ color: 'var(--amber)', fontFamily: 'DM Sans, sans-serif' }}
              >
                View all <ChevronRight size={12} />
              </button>
            </div>
            <div>
              {RECENT_ACTIVITY.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-5 py-3 transition-all duration-150 cursor-pointer"
                  style={{
                    borderBottom: i < RECENT_ACTIVITY.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-raised)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: STATUS_COLORS[item.status], flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {item.client}
                    </div>
                    <div className="data-label mt-0.5">{item.action}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        fontFamily: 'Fira Code, monospace',
                        fontSize: '12px',
                        color: item.score >= 8 ? '#4ADE80' : item.score >= 7 ? 'var(--amber)' : 'var(--text-muted)',
                      }}
                    >
                      {item.score.toFixed(1)}
                    </div>
                    <div className="data-label">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline Preview */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              className="px-5 py-4"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Pipeline Overview
              </div>
              <div className="data-label mt-0.5">12 active clients</div>
            </div>
            <div className="p-5 space-y-4">
              {PIPELINE_PREVIEW.map((stage) => (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="data-label">{stage.stage}</span>
                    <span
                      style={{
                        fontFamily: 'Fira Code, monospace',
                        fontSize: '12px',
                        color: stage.color,
                      }}
                    >
                      {stage.count}
                    </span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--surface-raised)', borderRadius: '2px' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${(stage.count / 12) * 100}%`,
                        background: stage.color,
                        borderRadius: '2px',
                        transition: 'width 1s ease',
                      }}
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={() => setLocation('/pipeline')}
                className="w-full flex items-center justify-center gap-2 py-2.5 mt-2 transition-all duration-150"
                style={{
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  fontFamily: 'DM Sans, sans-serif',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-amber)';
                  e.currentTarget.style.color = 'var(--amber)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <Users size={14} />
                Manage Pipeline
              </button>
            </div>
          </div>
        </div>

        {/* Soul Engineer Framework Pillars */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div
            className="px-5 py-4"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Soul Engineer Framework — Active Pillars
            </div>
            <div className="data-label mt-0.5">The Ghost operates through these three lenses</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-x" style={{ borderColor: 'var(--border-subtle)' }}>
            {[
              {
                number: "01",
                title: "Internal Structure",
                desc: "Every AI solution must simplify, not add noise. Cognitive offloading is the primary metric.",
                status: "ACTIVE",
              },
              {
                number: "02",
                title: "Creative Flow",
                desc: "Protect the Artist's Space. Automation ensures maximum time in the Zone of Genius.",
                status: "ACTIVE",
              },
              {
                number: "03",
                title: "The Vault (Legacy)",
                desc: "Every business move builds a living archive. The work compounds over time.",
                status: "ACTIVE",
              },
            ].map((pillar) => (
              <div key={pillar.number} className="p-5">
                <div
                  style={{
                    fontFamily: 'Fira Code, monospace',
                    fontSize: '24px',
                    fontWeight: 500,
                    color: 'var(--amber)',
                    opacity: 0.3,
                    lineHeight: 1,
                    marginBottom: '12px',
                  }}
                >
                  {pillar.number}
                </div>
                <div
                  style={{
                    fontFamily: 'Playfair Display, serif',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '8px',
                  }}
                >
                  {pillar.title}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {pillar.desc}
                </p>
                <div className="ghost-badge mt-4">{pillar.status}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
