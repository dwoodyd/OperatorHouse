/* =============================================================================
   Operator House — Analytics
   Obsidian Intelligence: Revenue, lead, and performance dashboard
   ============================================================================= */

import AppLayout from "@/components/AppLayout";
import BusinessOverview from "./BusinessOverview";
import { trpc } from "@/lib/trpc";
import { PageLoader, SpectreEmptyState } from "@/components/StateUI";
import React from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, Users, Filter, Star, FileText, Mail, Phone, MessageSquare, Share2, Activity, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { format, parseISO } from "date-fns";

const ANALYTICS_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663270045694/UYrVyz2BYHYzFAx4PneEpK/ghostdesk-analytics-bg-gRpLSLXsoPxKqvVS4kVEgu.webp";
const SOURCE_COLORS = ["#60A5FA", "#F5A623", "#4ADE80", "#A78BFA", "#F472B6"];

const CUSTOM_TOOLTIP_STYLE = {
  backgroundColor: '#18181E',
  border: '1px solid rgba(245, 166, 35, 0.3)',
  borderRadius: '2px',
  fontFamily: 'Fira Code, monospace',
  fontSize: '12px',
  color: '#E8E6E0',
};

function fmt$(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

function ChangeChip({ change }: { change: number }) {
  if (Math.abs(change) < 0.5) return <span className="flex items-center gap-0.5 text-xs opacity-40"><Minus className="w-3 h-3" /> 0%</span>;
  const up = change > 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs ${up ? "text-green-400" : "text-red-400"}`}>
      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(change).toFixed(1)}%
    </span>
  );
}

export default function Analytics() {
  const { data: analyticsData, isLoading } = trpc.analytics.data.useQuery();
  const { data: metrics } = trpc.dashboard.metrics.useQuery();
  const { data: overview } = trpc.analytics.overview.useQuery();
  const { data: revenueTrend } = trpc.analytics.revenueTrend.useQuery();
  const { data: bookingTrend } = trpc.analytics.bookingTrend.useQuery();
  const { data: funnelConversions } = trpc.analytics.funnelConversions.useQuery();
  const { data: crmPipeline } = trpc.analytics.crmPipeline.useQuery();
  const { data: outreach } = trpc.analytics.outreachActivity.useQuery();
  const { data: healthDist } = trpc.analytics.healthDistribution.useQuery();
  const { data: recentActivity } = trpc.analytics.recentActivity.useQuery();

  // Dynamic current month label
  const currentMonthLabel = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Real data from server — fallback to empty arrays so charts render cleanly
  const monthlyData = analyticsData?.monthlyData ?? [];
  const weeklyActivity = analyticsData?.weeklyActivity ?? [];
  const leadSourceData = (analyticsData?.leadsBySource ?? []).map((s, i) => ({
    name: (s as { sourceType?: string }).sourceType ?? 'Unknown',
    value: Number((s as { count?: number }).count ?? 0),
    color: SOURCE_COLORS[i % SOURCE_COLORS.length],
  }));

  const topMetrics = [
    { label: "Total Pipeline Value", value: metrics?.pipelineValue ? `$${(metrics.pipelineValue / 1000).toFixed(1)}K` : "$0", change: "live", positive: true },
    { label: "Total Leads", value: String(metrics?.totalLeads ?? 0), change: "live", positive: true },
    { label: "Strategies Built", value: String(metrics?.strategiesGenerated ?? 0), change: "live", positive: true },
    { label: "Active Deals", value: String(metrics?.activeDeals ?? 0), change: "live", positive: true },
    { label: "Specter Efficiency", value: "90%", change: "target", positive: true },
    { label: "Hours Saved/Month", value: `${Math.round((metrics?.strategiesGenerated ?? 0) * 3)}h`, change: "live", positive: true },
  ];

  const hasData = monthlyData.some(m => m.leads > 0 || m.revenue > 0 || m.closed > 0);

  if (isLoading) {
    return (
      <AppLayout title="Analytics" subtitle="Performance intelligence dashboard">
        <PageLoader />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Analytics" subtitle="Performance intelligence dashboard">
      <div className="p-6 space-y-6">

        {/* Hero Banner */}
        <div
          className="relative overflow-hidden"
          style={{
            background: `url(${ANALYTICS_BG}) center/cover no-repeat`,
            minHeight: '120px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(10,10,11,0.95) 0%, rgba(10,10,11,0.6) 100%)' }} />
          <div className="relative z-10 p-6">
            <div className="ghost-badge mb-2">Live Data — {currentMonthLabel}</div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Revenue & Performance Intelligence
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              6-month rolling view of your Operator House operation
            </p>
          </div>
        </div>

        {/* Top Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {topMetrics.map((metric) => (
            <div
              key={metric.label}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
                padding: '14px',
              }}
            >
              <div className="data-label mb-2">{metric.label}</div>
              <div style={{ fontFamily: 'Fira Code, monospace', fontSize: '18px', fontWeight: 500, color: 'var(--amber)', lineHeight: 1 }}>
                {metric.value}
              </div>
              <div style={{ fontFamily: 'Fira Code, monospace', fontSize: '11px', color: metric.positive ? '#4ADE80' : '#F87171', marginTop: '4px' }}>
                {metric.change}
              </div>
            </div>
          ))}
        </div>

        {!hasData ? (
          <SpectreEmptyState
            title="No activity data yet."
            spectreQuote="The numbers don't lie. There just aren't any yet. Start moving deals."
            body="Add leads, close deals, and generate strategies — your charts will populate automatically."
          />
        ) : (
          <>
            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Revenue Chart */}
              <div className="lg:col-span-2 glass-panel">
                <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Revenue Trend</div>
                  <div className="data-label mt-0.5">Monthly closed deal value — last 6 months</div>
                </div>
                <div className="p-5">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F5A623" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="month" tick={{ fontFamily: 'Fira Code, monospace', fontSize: 11, fill: '#4A4A5A' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontFamily: 'Fira Code, monospace', fontSize: 11, fill: '#4A4A5A' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                      <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']} />
                      <Area type="monotone" dataKey="revenue" stroke="#F5A623" strokeWidth={2} fill="url(#revenueGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Lead Sources */}
              <div className="glass-panel">
                <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Lead Sources</div>
                  <div className="data-label mt-0.5">Where leads originate</div>
                </div>
                <div className="p-5">
                  {leadSourceData.length === 0 ? (
                    <div className="flex items-center justify-center h-32 data-label">No lead source data yet</div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={140}>
                        <PieChart>
                          <Pie data={leadSourceData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                            {leadSourceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} formatter={(value: number) => [`${value}`, 'Leads']} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2 mt-2">
                        {leadSourceData.map((source) => (
                          <div key={source.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: source.color, flexShrink: 0 }} />
                              <span className="data-label">{source.name}</span>
                            </div>
                            <span style={{ fontFamily: 'Fira Code, monospace', fontSize: '12px', color: source.color }}>{source.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Weekly Activity */}
              <div className="glass-panel">
                <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>AI Operator Activity — This Week</div>
                  <div className="data-label mt-0.5">Strategies, leads, and briefings generated</div>
                </div>
                <div className="p-5">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={weeklyActivity} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="day" tick={{ fontFamily: 'Fira Code, monospace', fontSize: 11, fill: '#4A4A5A' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontFamily: 'Fira Code, monospace', fontSize: 11, fill: '#4A4A5A' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
                      <Bar dataKey="leads" fill="#F5A623" opacity={0.8} radius={[2, 2, 0, 0]} />
                      <Bar dataKey="strategies" fill="#60A5FA" opacity={0.8} radius={[2, 2, 0, 0]} />
                      <Bar dataKey="briefings" fill="#4ADE80" opacity={0.8} radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-4 mt-3">
                    {[{ label: "Leads", color: "#F5A623" }, { label: "Strategies", color: "#60A5FA" }, { label: "Briefings", color: "#4ADE80" }].map((item) => (
                      <div key={item.label} className="flex items-center gap-1.5">
                        <div style={{ width: '8px', height: '8px', background: item.color, borderRadius: '1px' }} />
                        <span className="data-label">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Monthly Leads vs Closed */}
              <div className="glass-panel">
                <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Leads vs Closed</div>
                  <div className="data-label mt-0.5">Monthly pipeline conversion</div>
                </div>
                <div className="p-5">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="month" tick={{ fontFamily: 'Fira Code, monospace', fontSize: 11, fill: '#4A4A5A' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontFamily: 'Fira Code, monospace', fontSize: 11, fill: '#4A4A5A' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
                      <Bar dataKey="leads" fill="rgba(245,166,35,0.3)" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="closed" fill="#F5A623" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-4 mt-3">
                    {[{ label: "Leads Discovered", color: "rgba(245,166,35,0.4)" }, { label: "Deals Closed", color: "#F5A623" }].map((item) => (
                      <div key={item.label} className="flex items-center gap-1.5">
                        <div style={{ width: '8px', height: '8px', background: item.color, borderRadius: '1px' }} />
                        <span className="data-label">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        <BusinessOverview />
      </div>
    </AppLayout>
  );
}
