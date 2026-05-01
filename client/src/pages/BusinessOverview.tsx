import React from "react";
import { trpc } from "@/lib/trpc";
import { DollarSign, FileText, Calendar, Users, Filter, Star, Activity, Mail, Phone, MessageSquare, Share2 } from "lucide-react";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const CUSTOM_TOOLTIP_STYLE = {
  background: '#1A1A2E',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '6px',
  fontFamily: 'Fira Code, monospace',
  fontSize: '12px',
  color: '#E0E0E0',
};

function fmt$(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

function ChangeChip({ change }: { change: number }) {
  const up = change > 0;
  return (
    <span style={{ fontFamily: 'Fira Code, monospace', fontSize: '11px', color: up ? '#4ADE80' : '#F87171' }}>
      {up ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
    </span>
  );
}

export default function BusinessOverview() {
  const { data: overview } = trpc.analytics.overview.useQuery();
  const { data: revenueTrend } = trpc.analytics.revenueTrend.useQuery();
  const { data: crmPipeline } = trpc.analytics.crmPipeline.useQuery();
  const { data: healthDist } = trpc.analytics.healthDistribution.useQuery();
  const { data: outreach } = trpc.analytics.outreachActivity.useQuery();
  const { data: recentActivity } = trpc.analytics.recentActivity.useQuery();

  if (!overview) return null;

  const outreachItems = [
    { label: 'Emails', value: outreach?.emails ?? 0, Icon: Mail },
    { label: 'Calls', value: outreach?.calls ?? 0, Icon: Phone },
    { label: 'SMS', value: outreach?.sms ?? 0, Icon: MessageSquare },
    { label: 'Posts', value: outreach?.socialPosts ?? 0, Icon: Share2 },
  ];

  const overviewCards = [
    { label: "Revenue (MTD)", value: fmt$(overview.revenue.thisMonth), change: overview.revenue.change },
    { label: "Outstanding", value: fmt$(overview.outstanding.total) },
    { label: "Bookings (MTD)", value: String(overview.bookings.thisMonth), change: overview.bookings.change },
    { label: "CRM Contacts", value: String(overview.contacts.total) },
    { label: "Active Funnels", value: String(overview.funnels.active) },
    { label: "Signed Contracts", value: String(overview.contracts.signed) },
    { label: "Avg Rating", value: `${overview.reviews.avg}★` },
    { label: "Outreach (30d)", value: String((outreach?.emails ?? 0) + (outreach?.calls ?? 0) + (outreach?.sms ?? 0) + (outreach?.socialPosts ?? 0)) },
  ];

  return (
    <div className="space-y-4" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '24px', marginTop: '8px' }}>
      {/* Header */}
      <div>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Business Overview</div>
        <div className="data-label">Revenue, bookings, CRM, funnels — this month</div>
      </div>

      {/* 8-metric grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {overviewCards.map((item) => (
          <div key={item.label} style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', padding: '14px' }}>
            <div className="data-label mb-2">{item.label}</div>
            <div style={{ fontFamily: 'Fira Code, monospace', fontSize: '18px', fontWeight: 500, color: 'var(--amber)', lineHeight: 1 }}>{item.value}</div>
            {item.change !== undefined && <div className="mt-1"><ChangeChip change={item.change} /></div>}
          </div>
        ))}
      </div>

      {/* Revenue 12-month trend */}
      {revenueTrend && revenueTrend.some(r => r.revenue > 0) && (
        <div className="glass-panel">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Invoice Revenue — 12 Months</div>
            <div className="data-label mt-0.5">Paid invoices by month</div>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueTrend.map(r => ({ month: r.month.slice(5), revenue: r.revenue }))}>
                <defs>
                  <linearGradient id="rev12Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fontFamily: 'Fira Code, monospace', fontSize: 11, fill: '#4A4A5A' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: 'Fira Code, monospace', fontSize: 11, fill: '#4A4A5A' }} axisLine={false} tickLine={false} tickFormatter={fmt$} />
                <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} formatter={(v: number) => [fmt$(v), 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#rev12Grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* CRM Pipeline + Health + Outreach */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* CRM Pipeline */}
        <div className="glass-panel">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>CRM Pipeline</div>
          </div>
          <div className="p-5 space-y-2">
            {(crmPipeline ?? []).length === 0
              ? <div className="data-label py-6 text-center">No contacts yet</div>
              : crmPipeline!.map(s => {
                  const total = crmPipeline!.reduce((a, b) => a + b.count, 0) || 1;
                  return (
                    <div key={s.stage} className="flex items-center gap-3">
                      <span className="data-label capitalize w-20 flex-shrink-0">{s.stage.replace('_', ' ')}</span>
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div className="h-full rounded-full" style={{ width: `${(s.count / total) * 100}%`, backgroundColor: s.color }} />
                      </div>
                      <span className="data-label w-5 text-right">{s.count}</span>
                    </div>
                  );
                })
            }
          </div>
        </div>

        {/* Client Health */}
        <div className="glass-panel">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Client Health</div>
          </div>
          <div className="p-5 space-y-3">
            {(healthDist ?? []).map(h => (
              <div key={h.status} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: h.color }} />
                <span className="data-label capitalize flex-1">{h.status.replace('_', ' ')}</span>
                <span style={{ fontFamily: 'Fira Code, monospace', fontSize: '14px', color: h.color }}>{h.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Outreach 30d */}
        <div className="glass-panel">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Outreach (30d)</div>
          </div>
          <div className="p-5 space-y-3">
            {outreachItems.map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <item.Icon className="w-4 h-4 opacity-50 flex-shrink-0" />
                <span className="data-label flex-1">{item.label}</span>
                <span style={{ fontFamily: 'Fira Code, monospace', fontSize: '14px', color: 'var(--amber)' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      {recentActivity && recentActivity.length > 0 && (
        <div className="glass-panel">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Recent Activity</div>
          </div>
          <div className="p-5 space-y-2">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="data-label w-16 flex-shrink-0 capitalize">{item.type}</div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</p>
                  <p className="data-label">{item.meta}</p>
                </div>
                <span className="data-label flex-shrink-0">
                  {item.at ? new Date(item.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
