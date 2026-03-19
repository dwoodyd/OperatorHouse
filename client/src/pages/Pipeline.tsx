/* =============================================================================
   GhostDesk — Client Pipeline (CRM)
   Obsidian Intelligence: Kanban-style client deal pipeline
   ============================================================================= */

import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Plus, DollarSign, Calendar, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

type Stage = "Discovery" | "Analysis" | "Strategy" | "Proposal" | "Closed";

interface Deal {
  id: string;
  name: string;
  company: string;
  value: number;
  score: number;
  date: string;
  tags: string[];
}

const STAGES: Stage[] = ["Discovery", "Analysis", "Strategy", "Proposal", "Closed"];

const STAGE_COLORS: Record<Stage, string> = {
  Discovery: "#6B6B7A",
  Analysis: "#F5A623",
  Strategy: "#60A5FA",
  Proposal: "#A78BFA",
  Closed: "#4ADE80",
};

const INITIAL_DEALS: Record<Stage, Deal[]> = {
  Discovery: [
    { id: "d1", name: "Jordan Rivera", company: "NextGen Ventures", value: 4500, score: 6.5, date: "Mar 18", tags: ["AI Consulting"] },
    { id: "d2", name: "Priya Patel", company: "Bloom Digital", value: 7200, score: 7.2, date: "Mar 17", tags: ["Content AI"] },
    { id: "d3", name: "Derek Thompson", company: "Ironclad Media", value: 3800, score: 5.9, date: "Mar 16", tags: ["Automation"] },
    { id: "d4", name: "Sofia Reyes", company: "Elevate Brands", value: 9500, score: 8.1, date: "Mar 15", tags: ["Brand AI", "Strategy"] },
  ],
  Analysis: [
    { id: "a1", name: "Marcus Chen", company: "TechFlow Solutions", value: 12000, score: 8.4, date: "Mar 19", tags: ["Full Stack AI"] },
    { id: "a2", name: "Keisha Brown", company: "Momentum Agency", value: 8500, score: 7.8, date: "Mar 18", tags: ["Lead Gen"] },
    { id: "a3", name: "Ryan Walsh", company: "Vertex Capital", value: 22000, score: 9.0, date: "Mar 17", tags: ["Enterprise"] },
  ],
  Strategy: [
    { id: "s1", name: "Aisha Williams", company: "Apex Creative", value: 15000, score: 9.2, date: "Mar 16", tags: ["Content AI"] },
    { id: "s2", name: "James Liu", company: "Frontier Labs", value: 18500, score: 8.7, date: "Mar 15", tags: ["AI Implementation"] },
  ],
  Proposal: [
    { id: "p1", name: "Natalie Osei", company: "SoulBrand Co.", value: 24000, score: 9.5, date: "Mar 14", tags: ["Full Package"] },
    { id: "p2", name: "Carlos Mendez", company: "Pinnacle Group", value: 31000, score: 8.9, date: "Mar 13", tags: ["Enterprise"] },
  ],
  Closed: [
    { id: "c1", name: "Tanya Morrison", company: "Clarity Media", value: 19500, score: 9.1, date: "Mar 10", tags: ["Won"] },
  ],
};

const SCORE_COLOR = (score: number) => {
  if (score >= 8.5) return "#4ADE80";
  if (score >= 7) return "#F5A623";
  return "#6B6B7A";
};

export default function Pipeline() {
  const [deals, setDeals] = useState(INITIAL_DEALS);

  const totalValue = Object.values(deals).flat().reduce((sum, d) => sum + d.value, 0);
  const closedValue = deals.Closed.reduce((sum, d) => sum + d.value, 0);
  const proposalValue = deals.Proposal.reduce((sum, d) => sum + d.value, 0);

  const moveCard = (deal: Deal, fromStage: Stage, toStage: Stage) => {
    setDeals((prev) => ({
      ...prev,
      [fromStage]: prev[fromStage].filter((d) => d.id !== deal.id),
      [toStage]: [...prev[toStage], deal],
    }));
    toast.success(`${deal.name} moved to ${toStage}`);
  };

  return (
    <AppLayout title="Client Pipeline" subtitle="Deal flow management">
      <div className="p-6">

        {/* Summary Bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Pipeline", value: `$${(totalValue / 1000).toFixed(0)}K`, sub: `${Object.values(deals).flat().length} deals` },
            { label: "In Proposal", value: `$${(proposalValue / 1000).toFixed(0)}K`, sub: `${deals.Proposal.length} deals` },
            { label: "Closed Won", value: `$${(closedValue / 1000).toFixed(0)}K`, sub: `${deals.Closed.length} deals` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="ghost-card p-4"
              style={{ borderLeft: '2px solid var(--amber)' }}
            >
              <div className="data-label mb-1">{stat.label}</div>
              <div
                style={{
                  fontFamily: 'Fira Code, monospace',
                  fontSize: '24px',
                  fontWeight: 500,
                  color: 'var(--amber)',
                }}
              >
                {stat.value}
              </div>
              <div className="data-label mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <div
              key={stage}
              className="flex-shrink-0"
              style={{ width: '260px' }}
            >
              {/* Column Header */}
              <div
                className="flex items-center justify-between px-3 py-2.5 mb-3"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                  borderTop: `2px solid ${STAGE_COLORS[stage]}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: STAGE_COLORS[stage],
                    }}
                  >
                    {stage}
                  </span>
                  <span
                    style={{
                      fontFamily: 'Fira Code, monospace',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      background: 'var(--surface-raised)',
                      padding: '1px 6px',
                    }}
                  >
                    {deals[stage].length}
                  </span>
                </div>
                <button
                  onClick={() => toast.info("Add deal coming soon")}
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {deals[stage].map((deal) => (
                  <div
                    key={deal.id}
                    className="pipeline-card fade-in-up"
                    style={{ borderLeft: `2px solid ${SCORE_COLOR(deal.score)}` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {deal.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                          {deal.company}
                        </div>
                      </div>
                      <button
                        onClick={() => toast.info("Deal options coming soon")}
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1" style={{ color: '#4ADE80' }}>
                        <DollarSign size={11} />
                        <span style={{ fontFamily: 'Fira Code, monospace', fontSize: '13px' }}>
                          {(deal.value / 1000).toFixed(1)}K
                        </span>
                      </div>
                      <div
                        style={{
                          fontFamily: 'Fira Code, monospace',
                          fontSize: '12px',
                          color: SCORE_COLOR(deal.score),
                        }}
                      >
                        {deal.score}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-wrap mb-2">
                      {deal.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontFamily: 'Fira Code, monospace',
                            fontSize: '10px',
                            padding: '1px 5px',
                            background: 'var(--surface-raised)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                        <Calendar size={10} />
                        <span style={{ fontFamily: 'Fira Code, monospace', fontSize: '10px' }}>{deal.date}</span>
                      </div>
                      {/* Move buttons */}
                      <div className="flex gap-1">
                        {STAGES.indexOf(stage) > 0 && (
                          <button
                            onClick={() => moveCard(deal, stage, STAGES[STAGES.indexOf(stage) - 1])}
                            style={{
                              fontSize: '10px',
                              padding: '1px 5px',
                              background: 'var(--surface-raised)',
                              color: 'var(--text-muted)',
                              border: '1px solid var(--border-subtle)',
                              fontFamily: 'DM Sans, sans-serif',
                            }}
                          >
                            ←
                          </button>
                        )}
                        {STAGES.indexOf(stage) < STAGES.length - 1 && (
                          <button
                            onClick={() => moveCard(deal, stage, STAGES[STAGES.indexOf(stage) + 1])}
                            style={{
                              fontSize: '10px',
                              padding: '1px 5px',
                              background: 'var(--amber-dim)',
                              color: 'var(--amber)',
                              border: '1px solid var(--border-amber)',
                              fontFamily: 'DM Sans, sans-serif',
                            }}
                          >
                            →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </AppLayout>
  );
}
