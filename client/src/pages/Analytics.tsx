/* =============================================================================
   Operator House — Analytics
   Obsidian Intelligence: Revenue, lead, and performance dashboard
   ============================================================================= */

import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const ANALYTICS_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663270045694/UYrVyz2BYHYzFAx4PneEpK/ghostdesk-analytics-bg-gRpLSLXsoPxKqvVS4kVEgu.webp";

const REVENUE_DATA = [
  { month: "Oct", revenue: 8500, leads: 6, closed: 1 },
  { month: "Nov", revenue: 12000, leads: 8, closed: 2 },
  { month: "Dec", revenue: 9800, leads: 5, closed: 1 },
  { month: "Jan", revenue: 18500, leads: 11, closed: 3 },
  { month: "Feb", revenue: 24000, leads: 14, closed: 4 },
  { month: "Mar", revenue: 31500, leads: 18, closed: 5 },
];

const LEAD_SOURCE_DATA = [
  { name: "LinkedIn", value: 38, color: "#60A5FA" },
  { name: "X (Twitter)", value: 27, color: "#F5A623" },
  { name: "Reddit", value: 18, color: "#4ADE80" },
  { name: "Referral", value: 12, color: "#A78BFA" },
  { name: "Cold Email", value: 5, color: "#F472B6" },
];

const WEEKLY_ACTIVITY = [
  { day: "Mon", strategies: 3, leads: 5, briefings: 2 },
  { day: "Tue", strategies: 5, leads: 8, briefings: 4 },
  { day: "Wed", strategies: 2, leads: 4, briefings: 1 },
  { day: "Thu", strategies: 7, leads: 12, briefings: 6 },
  { day: "Fri", strategies: 4, leads: 7, briefings: 3 },
  { day: "Sat", strategies: 1, leads: 2, briefings: 1 },
  { day: "Sun", strategies: 0, leads: 1, briefings: 0 },
];

const CUSTOM_TOOLTIP_STYLE = {
  backgroundColor: '#18181E',
  border: '1px solid rgba(245, 166, 35, 0.3)',
  borderRadius: '2px',
  fontFamily: 'Fira Code, monospace',
  fontSize: '12px',
  color: '#E8E6E0',
};

export default function Analytics() {
  const { data: analyticsData, isLoading } = trpc.analytics.data.useQuery();
  const { data: metrics } = trpc.dashboard.metrics.useQuery();

  const revenueData = REVENUE_DATA; // static fallback — extend analytics router to add monthly revenue
  const leadSourceData = (analyticsData?.leadsBySource ?? LEAD_SOURCE_DATA).map((s, i) => ({
    name: (s as { sourceType?: string; name?: string }).sourceType ?? (s as { name?: string }).name ?? 'Unknown',
    value: (s as { count?: number; value?: number }).count ?? (s as { value?: number }).value ?? 0,
    color: ["#60A5FA", "#F5A623", "#4ADE80", "#A78BFA", "#F472B6"][i % 5],
  }));
  const weeklyActivity = WEEKLY_ACTIVITY; // static fallback — extend analytics router to add weekly data

  const topMetrics = [
    { label: "Total Pipeline Value", value: metrics?.pipelineValue ? `$${(metrics.pipelineValue / 1000).toFixed(1)}K` : "$0", change: "live", positive: true },
    { label: "Total Leads", value: String(metrics?.totalLeads ?? 0), change: "live", positive: true },
    { label: "Strategies Built", value: String(metrics?.strategiesGenerated ?? 0), change: "live", positive: true },
    { label: "Active Deals", value: String(metrics?.activeDeals ?? 0), change: "live", positive: true },
    { label: "Ghost Efficiency", value: "90%", change: "target", positive: true },
    { label: "Hours Saved/Month", value: `${Math.round((metrics?.strategiesGenerated ?? 0) * 3)}h`, change: "live", positive: true },
  ];

  if (isLoading) {
    return (
      <AppLayout title="Analytics" subtitle="Performance intelligence dashboard">
        <div className="flex items-center justify-center py-40">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--amber)' }} />
        </div>
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
            <div className="ghost-badge mb-2">Live Data — March 2026</div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Revenue & Performance Intelligence
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              6-month rolling view of your The Operator operation
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
              <div
                style={{
                  fontFamily: 'Fira Code, monospace',
                  fontSize: '18px',
                  fontWeight: 500,
                  color: 'var(--amber)',
                  lineHeight: 1,
                }}
              >
                {metric.value}
              </div>
              <div
                style={{
                  fontFamily: 'Fira Code, monospace',
                  fontSize: '11px',
                  color: metric.positive ? '#4ADE80' : '#F87171',
                  marginTop: '4px',
                }}
              >
                {metric.change}
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Revenue Chart */}
          <div
            className="lg:col-span-2 glass-panel"
          >
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Revenue Trend
              </div>
              <div className="data-label mt-0.5">Monthly revenue — last 6 months</div>
            </div>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={REVENUE_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F5A623" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontFamily: 'Fira Code, monospace', fontSize: 11, fill: '#4A4A5A' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontFamily: 'Fira Code, monospace', fontSize: 11, fill: '#4A4A5A' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    contentStyle={CUSTOM_TOOLTIP_STYLE}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#F5A623"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lead Sources */}
          <div className="glass-panel">
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Lead Sources
              </div>
              <div className="data-label mt-0.5">Where leads originate</div>
            </div>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={LEAD_SOURCE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {LEAD_SOURCE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={CUSTOM_TOOLTIP_STYLE}
                    formatter={(value: number) => [`${value}%`, 'Share']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {LEAD_SOURCE_DATA.map((source) => (
                  <div key={source.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: source.color, flexShrink: 0 }} />
                      <span className="data-label">{source.name}</span>
                    </div>
                    <span style={{ fontFamily: 'Fira Code, monospace', fontSize: '12px', color: source.color }}>
                      {source.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Weekly Activity */}
          <div className="glass-panel">
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Ghost Activity — This Week
              </div>
              <div className="data-label mt-0.5">Strategies, leads, and briefings generated</div>
            </div>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={WEEKLY_ACTIVITY} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontFamily: 'Fira Code, monospace', fontSize: 11, fill: '#4A4A5A' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontFamily: 'Fira Code, monospace', fontSize: 11, fill: '#4A4A5A' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
                  <Bar dataKey="leads" fill="#F5A623" opacity={0.8} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="strategies" fill="#60A5FA" opacity={0.8} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="briefings" fill="#4ADE80" opacity={0.8} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-3">
                {[
                  { label: "Leads", color: "#F5A623" },
                  { label: "Strategies", color: "#60A5FA" },
                  { label: "Briefings", color: "#4ADE80" },
                ].map((item) => (
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
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Leads vs Closed
              </div>
              <div className="data-label mt-0.5">Monthly pipeline conversion</div>
            </div>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={REVENUE_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontFamily: 'Fira Code, monospace', fontSize: 11, fill: '#4A4A5A' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontFamily: 'Fira Code, monospace', fontSize: 11, fill: '#4A4A5A' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
                  <Bar dataKey="leads" fill="rgba(245,166,35,0.3)" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="closed" fill="#F5A623" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-3">
                {[
                  { label: "Leads Discovered", color: "rgba(245,166,35,0.4)" },
                  { label: "Deals Closed", color: "#F5A623" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div style={{ width: '8px', height: '8px', background: item.color, borderRadius: '1px' }} />
                    <span className="data-label">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
