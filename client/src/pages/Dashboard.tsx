/* =============================================================================
   Operator House — Dashboard (Command Center) — Phase 3 Premium
   Glassmorphism + Operator Briefing + Next-Best-Action + Stale Deal Alerts
   ============================================================================= */
import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import FirstMission from "@/components/FirstMission";
import { SpectreCornerWidget, SpectreWidget } from "@/components/SpectreWidget";
import {
  TrendingUp, Clock, ArrowRight, Zap, Target, Brain,
  ChevronRight, AlertTriangle, Sparkles, RefreshCw,
  Ghost, Loader2, CheckCircle2, ArrowUpRight,
} from "lucide-react";

/* ── Animated counter ─────────────────────────────────────────────────────── */
function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (target === prev.current) return;
    prev.current = target;
    let cur = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      cur += step;
      if (cur >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.floor(cur));
    }, 16);
    return () => clearInterval(t);
  }, [target, duration]);
  return count;
}

/* ── Color maps ───────────────────────────────────────────────────────────── */
const STAGE_COLORS: Record<string, string> = {
  Discovery: "#6B7280", Analysis: "#F5A623",
  Strategy: "#F59E0B", Proposal: "#4ADE80", Closed: "#22C55E",
};
const ACTIVITY_LABELS: Record<string, string> = {
  lead_created: "Lead added", lead_analyzed: "Lead analyzed",
  deal_created: "Deal created", deal_stage_changed: "Stage updated",
  client_created: "Client added", vault_item_created: "Vault item saved",
  strategy_generated: "Strategy generated",
};

/* ── Metric Card ──────────────────────────────────────────────────────────── */
function MetricCard({ label, value, suffix, icon: Icon, trend, color = "var(--amber)", delay = 0 }: {
  label: string; value: number; suffix: string; icon: React.ElementType;
  trend: string; color?: string; delay?: number;
}) {
  const count = useCountUp(value);
  return (
    <div className="metric-card p-5 fade-in-scale" style={{ animationDelay: `${delay}ms`, opacity: 0, position: 'relative', overflow: 'hidden' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="data-label">{label}</div>
        <div style={{ width: 30, height: 30, borderRadius: 6, background: `${color}14`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={13} style={{ color }} />
        </div>
      </div>
      <div style={{ fontFamily: 'Fira Code, monospace', fontSize: 34, fontWeight: 700, color, lineHeight: 1, textShadow: `0 0 20px ${color}40` }}>
        {count}{suffix}
      </div>
      <div className="data-label mt-2" style={{ color: 'var(--text-muted)' }}>{trend}</div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}70 0%, transparent 80%)` }} />
    </div>
  );
}

/* ── Operator Briefing Panel ─────────────────────────────────────────────────── */
/* ── Ghost Terminal Widget ─────────────────────────────────────────────────── */
function GhostTerminalWidget({ deals, leads, staleCount }: {
  deals: number; leads: number; staleCount: number;
}) {
  const lines = [
    { label: "PIPELINE", value: `${deals} active deal${deals !== 1 ? 's' : ''}`, color: 'var(--amber)' },
    { label: "LEADS",    value: `${leads} audited`,                              color: 'var(--text-secondary)' },
    { label: "ALERTS",   value: staleCount > 0 ? `${staleCount} stale deal${staleCount !== 1 ? 's' : ''}` : 'All deals active', color: staleCount > 0 ? '#F59E0B' : '#4ADE80' },
  ];
  const line =
    staleCount > 0
      ? `${staleCount} deal${staleCount !== 1 ? 's' : ''} going cold. I'd move on ${staleCount === 1 ? 'it' : 'them'} today.`
      : deals === 0
        ? "No active deals yet. The pipeline is quiet — too quiet."
        : leads === 0
          ? "Pipeline is live. Feed me some leads and I'll find the angles."
          : `${deals} deal${deals !== 1 ? 's' : ''} in motion. ${leads} lead${leads !== 1 ? 's' : ''} on file. You're running clean.`;
  return (
    <div
      className="glass-panel p-5 fade-in-up"
      style={{
        borderLeft: '2px solid rgba(212,175,55,0.4)',
        background: 'linear-gradient(135deg, rgba(212,175,55,0.04) 0%, rgba(14,14,22,0.85) 60%)',
        animationDelay: '0.3s', opacity: 0,
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Ghost size={13} style={{ color: 'var(--amber)' }} />
        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Ghost Terminal</span>
        <span
          title="Ghost Efficiency: the % of your operator workflow handled by the Ghost AI — lead audits, strategy docs, briefings, and follow-up prep. Target is 90%."
          style={{
            marginLeft: 'auto',
            fontFamily: 'Fira Code, monospace',
            fontSize: 9,
            letterSpacing: '0.12em',
            color: 'var(--amber)',
            opacity: 0.7,
            cursor: 'help',
            borderBottom: '1px dashed rgba(212,175,55,0.4)',
          }}
        >
          GHOST EFF: 90%
        </span>
      </div>
      <div className="space-y-2 mb-4">
        {lines.map(({ label, value, color }) => (
          <div key={label} className="flex items-center justify-between">
            <span style={{ fontFamily: 'Fira Code, monospace', fontSize: 10, letterSpacing: '0.15em', color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ fontFamily: 'Fira Code, monospace', fontSize: 12, color, fontWeight: 500 }}>{value}</span>
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 12px',
          background: 'rgba(212,175,55,0.04)',
          border: '1px solid rgba(212,175,55,0.12)',
          borderRadius: 8,
        }}
      >
        <SpectreWidget size="icon" message={line} showMessage={false} />
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, fontStyle: 'italic', flex: 1 }}>
          &ldquo;{line}&rdquo;
        </p>
      </div>
    </div>
  );
}
function GhostBriefingPanel() {
  const utils = trpc.useUtils();
  const { data: latest } = trpc.briefings.latest.useQuery();
  const generate = trpc.briefings.generate.useMutation({
    onSuccess: () => utils.briefings.latest.invalidate(),
    onError: () => toast.error("Briefing generation failed"),
  });
  const briefing = latest?.payload as { situation?: string; priority?: string; ghostNote?: string } | null ?? null;

  return (
    <div className="glass-panel p-5 fade-in-up" style={{ borderLeft: '2px solid var(--amber)', background: 'linear-gradient(135deg, rgba(245,166,35,0.05) 0%, rgba(14,14,22,0.8) 60%)', animationDelay: '0.1s', opacity: 0 }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Ghost size={13} style={{ color: 'var(--amber)' }} />
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Operator Briefing</span>
          {latest && (
            <span className="ghost-badge" style={{ fontSize: 9 }}>
              {new Date(latest.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        <button
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5"
          style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 4, color: 'var(--amber)', fontSize: 11, opacity: generate.isPending ? 0.6 : 1, transition: 'opacity 180ms ease, transform 180ms ease' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,166,35,0.15)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,166,35,0.08)')}
        >
          {generate.isPending ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
          {generate.isPending ? 'Generating…' : 'Refresh'}
        </button>
      </div>

      {generate.isPending ? (
        <div className="space-y-2">
          {[80, 60, 70].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: 13, borderRadius: 4, width: `${w}%` }} />
          ))}
        </div>
      ) : briefing ? (
        <div className="space-y-3">
          {([
            { label: "SITUATION", value: briefing.situation, color: 'var(--text-secondary)', italic: false },
            { label: "PRIORITY", value: briefing.priority, color: 'var(--amber)', italic: false },
            { label: "GHOST NOTE", value: briefing.ghostNote, color: 'var(--text-primary)', italic: true },
          ] as const).map(({ label, value, color, italic }) => value ? (
            <div key={label}>
              <div className="data-label mb-1">{label}</div>
              <p style={{ fontSize: 13, color, lineHeight: 1.6, fontStyle: italic ? 'italic' : 'normal' }}>{value}</p>
            </div>
          ) : null)}
        </div>
      ) : (
        <div className="text-center py-4">
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>No briefing yet. Generate your first Operator Briefing.</p>
          <button
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
            className="flex items-center gap-2 px-4 py-2 mx-auto"
            style={{ background: 'var(--amber)', color: 'var(--obsidian)', fontWeight: 600, fontSize: 12, borderRadius: 4 }}
          >
            <Sparkles size={12} />
            Generate Briefing
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Stale Deal Alerts ────────────────────────────────────────────────────── */
function StaleDealAlerts() {
  const [, setLocation] = useLocation();
  const { data: stale } = trpc.briefings.staleDeals.useQuery();
  if (!stale?.length) return null;
  return (
    <div className="glass-panel p-4 fade-in-up" style={{ borderLeft: '2px solid #F59E0B', background: 'rgba(245,158,11,0.04)', animationDelay: '0.2s', opacity: 0 }}>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={12} style={{ color: '#F59E0B' }} />
        <span style={{ fontFamily: 'Fira Code, monospace', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#F59E0B' }}>
          {stale.length} Stale Deal{stale.length > 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-2">
        {stale.slice(0, 3).map((deal) => (
          <div
            key={deal.id}
            className="flex items-center justify-between cursor-pointer"
            style={{ padding: '8px 10px', background: 'rgba(245,158,11,0.05)', borderRadius: 4, border: '1px solid rgba(245,158,11,0.12)' }}
            onClick={() => setLocation('/pipeline')}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{deal.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{deal.stage} · {deal.daysSince}d no activity</div>
            </div>
            <ArrowUpRight size={12} style={{ color: '#F59E0B', flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Next Best Action ─────────────────────────────────────────────────────── */
function NextBestAction() {
  const [, setLocation] = useLocation();
  const { data: metrics } = trpc.dashboard.metrics.useQuery();
  const { data: deals } = trpc.pipeline.list.useQuery();

  const actions: { label: string; desc: string; path: string; icon: React.ElementType; color: string }[] = [];
  if ((metrics?.totalLeads ?? 0) === 0)
    actions.push({ label: "Add your first lead", desc: "Start the Ghost analysis engine", path: "/leads", icon: Target, color: "var(--amber)" });
  if ((metrics?.activeDeals ?? 0) === 0)
    actions.push({ label: "Create a pipeline deal", desc: "Track your first opportunity", path: "/pipeline", icon: TrendingUp, color: "#4ADE80" });
  if ((metrics?.strategiesGenerated ?? 0) === 0)
    actions.push({ label: "Generate a strategy", desc: "Let the Ghost write your first doc", path: "/strategy", icon: Brain, color: "#60A5FA" });
  const proposals = deals?.filter(d => d.stage === 'Proposal') ?? [];
  if (proposals.length > 0)
    actions.push({ label: `Follow up on ${proposals.length} proposal${proposals.length > 1 ? 's' : ''}`, desc: "Deals waiting for a response", path: "/pipeline", icon: CheckCircle2, color: "#A78BFA" });
  if (actions.length === 0)
    actions.push({ label: "Analyze a new lead", desc: "Keep the Ghost engine running", path: "/leads", icon: Zap, color: "var(--amber)" });

  return (
    <div className="glass-panel p-5 fade-in-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={13} style={{ color: 'var(--amber)' }} />
        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Next Best Action</span>
      </div>
      <div className="space-y-2">
        {actions.slice(0, 3).map((action, i) => (
          <button
            key={i}
            onClick={() => setLocation(action.path)}
            className="w-full flex items-center gap-3 text-left"
            style={{ padding: '10px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', transition: 'border-color 180ms ease, background 180ms ease' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = `${action.color}40`; (e.currentTarget as HTMLButtonElement).style.background = `${action.color}08`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.02)'; }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 6, background: `${action.color}15`, border: `1px solid ${action.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <action.icon size={13} style={{ color: action.color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{action.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{action.desc}</div>
            </div>
            <ChevronRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Main Dashboard ───────────────────────────────────────────────────────── */
export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [missionDone, setMissionDone] = useState(false);
  const { user } = useAuth();
  const { data: metrics, isLoading: metricsLoading } = trpc.dashboard.metrics.useQuery();
  const { data: pipelineDeals } = trpc.pipeline.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: staleDeals } = trpc.briefings.staleDeals.useQuery();

  // Show First Mission when user has no data at all
  const isNewUser =
    !missionDone &&
    !metricsLoading &&
    (metrics?.totalLeads ?? 0) === 0 &&
    (metrics?.activeDeals ?? 0) === 0 &&
    (clients?.length ?? 0) === 0;

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const totalDeals = pipelineDeals?.length ?? 0;
  const staleCount = staleDeals?.length ?? 0;
  const hoverMessage =
    staleCount > 0
      ? `${staleCount} deal${staleCount !== 1 ? 's' : ''} going cold.\nMove on ${staleCount === 1 ? 'it' : 'them'} today.`
      : totalDeals === 0
        ? "No active deals yet.\nThe pipeline is quiet."
        : `${totalDeals} deal${totalDeals !== 1 ? 's' : ''} in motion.\nI'm watching everything.`;
  const pipelineStageCounts = ["Discovery", "Analysis", "Strategy", "Proposal", "Closed"].map((stage) => ({
    stage, count: pipelineDeals?.filter((d) => d.stage === stage).length ?? 0, color: STAGE_COLORS[stage],
  }));

  const greeting = () => {
    const h = currentTime.getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  };

  return (
    <AppLayout
      title="Command Center"
      subtitle={`${greeting()}, ${user?.name?.split(' ')[0] ?? 'Operator'} — ${currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
    >
      <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
        {isNewUser ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <FirstMission onComplete={() => setMissionDone(true)} />
          </div>
        ) : (<>

        {/* Hero Banner */}
        <div
          className="relative overflow-hidden fade-in-scale"
          style={{
            background: 'linear-gradient(135deg, rgba(14,14,22,0.97) 0%, rgba(20,20,32,0.92) 100%)',
            border: '1px solid var(--border-subtle)', borderRadius: 8,
            padding: '28px 32px',
            boxShadow: 'var(--shadow-card), var(--shadow-inset-top)',
            opacity: 0,
          }}
        >
          {/* Decorative amber glow */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, background: 'radial-gradient(circle, rgba(245,166,35,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
          {/* Top accent line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, var(--amber) 0%, rgba(245,166,35,0.15) 40%, transparent 100%)' }} />

          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 8px rgba(74,222,128,0.7)', animation: 'statusPulse 2s ease-in-out infinite' }} />
                <span style={{ fontFamily: 'Fira Code, monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Operator Active — Operator House
                </span>
              </div>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                Your Operator is working.<br />
                <span className="text-amber-gradient">90% done before you start.</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 10, maxWidth: 420, lineHeight: 1.6 }}>
                Lead discovery, strategy generation, and client briefings handled autonomously.
              </p>
              <div className="flex items-center gap-3 mt-5 flex-wrap">
                <button
                  onClick={() => setLocation('/leads')}
                  className="flex items-center gap-2 px-4 py-2.5"
                  style={{ background: 'var(--amber)', color: 'var(--obsidian)', fontWeight: 600, fontSize: 13, borderRadius: 5, boxShadow: '0 0 20px rgba(245,166,35,0.3)', transition: 'opacity 180ms ease, transform 180ms ease' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 30px rgba(245,166,35,0.5)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 20px rgba(245,166,35,0.3)')}
                >
                  <Zap size={13} /> Analyze New Lead
                </button>
                <button
                  onClick={() => setLocation('/strategy')}
                  className="flex items-center gap-2 px-4 py-2.5"
                  style={{ background: 'transparent', border: '1px solid var(--border-amber)', color: 'var(--amber)', fontSize: 13, borderRadius: 5, transition: 'opacity 180ms ease, transform 180ms ease' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,166,35,0.08)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
                >
                  Generate Strategy <ArrowRight size={13} />
                </button>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div style={{ fontFamily: 'Fira Code, monospace', fontSize: 30, fontWeight: 300, color: 'var(--amber)', letterSpacing: '0.05em', lineHeight: 1 }}>
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </div>
              <div style={{ fontFamily: 'Fira Code, monospace', fontSize: 11, color: 'var(--text-muted)' }}>
                {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metricsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="metric-card p-5" style={{ minHeight: 110 }}>
                <div className="skeleton" style={{ height: 12, width: '60%', borderRadius: 4, marginBottom: 16 }} />
                <div className="skeleton" style={{ height: 34, width: '40%', borderRadius: 4 }} />
              </div>
            ))
          ) : (
            [
              { label: "Active Leads",   value: metrics?.totalLeads ?? 0,                                    suffix: "", icon: Target,    trend: "Total leads",    color: "var(--amber)", delay: 0   },
              { label: "Strategies",     value: metrics?.strategiesGenerated ?? 0,                           suffix: "", icon: Brain,     trend: "All time",       color: "#60A5FA",      delay: 60  },
              { label: "Pipeline Value", value: Math.round((metrics?.pipelineValue ?? 0) / 1000),            suffix: "K", icon: TrendingUp, trend: "Total pipeline", color: "#4ADE80",   delay: 120 },
              { label: "Active Deals",   value: metrics?.activeDeals ?? 0,                                   suffix: "", icon: Clock,     trend: "In pipeline",    color: "#A78BFA",      delay: 180 },
            ].map((m) => <MetricCard key={m.label} {...m} />)
          )}
        </div>

        {/* Ghost Terminal row */}
        <GhostTerminalWidget
          deals={totalDeals}
          leads={metrics?.totalLeads ?? 0}
          staleCount={staleDeals?.length ?? 0}
        />
        {/* Three-column middle row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <GhostBriefingPanel />
          <NextBestAction />
          <div className="space-y-4">
            <StaleDealAlerts />
            <div className="glass-panel fade-in-up" style={{ animationDelay: '0.25s', opacity: 0 }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Pipeline</div>
                  <div className="data-label mt-0.5">{totalDeals} active deals</div>
                </div>
                <button onClick={() => setLocation('/pipeline')} className="flex items-center gap-1" style={{ color: 'var(--amber)', fontSize: 12 }}>
                  View <ChevronRight size={12} />
                </button>
              </div>
              <div className="p-4 space-y-3">
                {pipelineStageCounts.map((stage) => (
                  <div key={stage.stage}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="data-label">{stage.stage}</span>
                      <span style={{ fontFamily: 'Fira Code, monospace', fontSize: 12, color: stage.color }}>{stage.count}</span>
                    </div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: totalDeals > 0 ? `${(stage.count / totalDeals) * 100}%` : '0%', background: stage.color, borderRadius: 2, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)', boxShadow: `0 0 6px ${stage.color}60` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="glass-panel fade-in-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Ghost Activity Log</div>
              <div className="data-label mt-0.5">Recent autonomous actions</div>
            </div>
            <button onClick={() => setLocation('/analytics')} className="flex items-center gap-1" style={{ color: 'var(--amber)', fontSize: 12 }}>
              Analytics <ChevronRight size={12} />
            </button>
          </div>
          <div>
            {!metrics?.recentActivities?.length ? (
              <div className="px-5 py-10 text-center">
                <Ghost size={22} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No activity yet. Start by adding a lead or creating a deal.</p>
              </div>
            ) : (
              metrics.recentActivities.slice(0, 8).map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 px-5 py-3"
                  style={{ borderBottom: i < (metrics.recentActivities?.length ?? 0) - 1 ? '1px solid var(--border-subtle)' : 'none', transition: 'background 150ms' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)', boxShadow: '0 0 6px rgba(245,166,35,0.5)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{ACTIVITY_LABELS[item.activityType] ?? item.activityType}</span>
                    {item.summary && <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 6 }}>— {item.summary}</span>}
                  </div>
                  <div style={{ fontFamily: 'Fira Code, monospace', fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Operator Framework Pillars */}
        <div className="glass-panel fade-in-up" style={{ animationDelay: '0.35s', opacity: 0 }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Operator Framework — Active Pillars</div>
            <div className="data-label mt-0.5">The Operator works through these three lenses</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3">
            {[
              { number: "01", title: "Internal Structure", desc: "Every AI solution must simplify, not add noise. Cognitive offloading is the primary metric.", color: "var(--amber)" },
              { number: "02", title: "Creative Flow", desc: "Protect the Artist's Space. Automation ensures maximum time in the Zone of Genius.", color: "#4ADE80" },
              { number: "03", title: "The Vault (Legacy)", desc: "Every business move builds a living archive. The work compounds over time.", color: "#60A5FA" },
            ].map((pillar, i) => (
              <div key={pillar.number} className="p-6" style={{ borderRight: i < 2 ? '1px solid var(--border-subtle)' : 'none', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 12, right: 16, fontFamily: 'Fira Code, monospace', fontSize: 52, fontWeight: 700, color: `${pillar.color}06`, lineHeight: 1, pointerEvents: 'none' }}>{pillar.number}</div>
                <div style={{ fontFamily: 'Fira Code, monospace', fontSize: 22, fontWeight: 500, color: pillar.color, opacity: 0.45, lineHeight: 1, marginBottom: 12 }}>{pillar.number}</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{pillar.title}</div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{pillar.desc}</p>
                <div className="ghost-badge mt-4" style={{ borderColor: `${pillar.color}40`, color: pillar.color, background: `${pillar.color}0A` }}>ACTIVE</div>
              </div>
            ))}
          </div>
        </div>

      </>)}
      </div>
      <SpectreCornerWidget message={hoverMessage} />
    </AppLayout>
  );
}
