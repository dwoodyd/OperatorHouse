/* =============================================================================
   GhostDesk — The Vault
   Obsidian Intelligence: Personal knowledge base / framework storage
   ============================================================================= */

import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Archive, Plus, Search, Tag, Clock, FileText, Mic, BookOpen, Zap } from "lucide-react";
import { toast } from "sonner";

const VAULT_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663270045694/UYrVyz2BYHYzFAx4PneEpK/ghostdesk-vault-bg-mRkhFPFtM7jXHLyASwTSvS.webp";

const CATEGORIES = ["All", "Framework", "Case Study", "Voice Note", "Template", "Research"];

const VAULT_ITEMS = [
  {
    id: "v1",
    title: "Soul Engineer Framework — Core System Prompt",
    category: "Framework",
    tags: ["Core", "AI Consulting", "Identity"],
    excerpt: "You are the Ghost Consultant, the digital twin and autonomous strategist. Every business problem is a structural or purpose-based problem. Apply the three pillars: Internal Structure, Creative Flow, The Vault.",
    wordCount: 847,
    lastUpdated: "2 days ago",
    type: "text",
  },
  {
    id: "v2",
    title: "TechFlow Solutions — Implementation Case Study",
    category: "Case Study",
    tags: ["AI Implementation", "B2B", "Won"],
    excerpt: "90-day AI implementation sprint for a B2B consulting firm. Deployed lead intelligence pipeline, onboarding assistant, and content engine. Result: 4 hours/week saved, 8x content output, $12K closed.",
    wordCount: 1240,
    lastUpdated: "1 week ago",
    type: "text",
  },
  {
    id: "v3",
    title: "Voice Note — AI Consulting Positioning Strategy",
    category: "Voice Note",
    tags: ["Positioning", "Pricing", "Strategy"],
    excerpt: "Recorded during a morning session. Key insight: the premium positioning isn't about the tools — it's about the framework. Clients pay for the Soul Engineer lens, not the AI implementation.",
    wordCount: 320,
    lastUpdated: "3 days ago",
    type: "audio",
    duration: "4:32",
  },
  {
    id: "v4",
    title: "Ghost Consultant — Outreach Email Template",
    category: "Template",
    tags: ["Email", "Outreach", "Template"],
    excerpt: "Subject: Your AI architecture has a structural problem. Opening: I've been watching [Company] for the past few weeks, and I noticed something that most consultants would miss...",
    wordCount: 280,
    lastUpdated: "5 days ago",
    type: "text",
  },
  {
    id: "v5",
    title: "2026 AI Consulting Market Research",
    category: "Research",
    tags: ["Market", "Trends", "Opportunity"],
    excerpt: "The AI consulting market is projected to reach $48B by 2027. Key insight: 73% of SMBs want AI implementation but lack internal expertise. The gap between demand and supply is the opportunity.",
    wordCount: 2100,
    lastUpdated: "1 week ago",
    type: "text",
  },
  {
    id: "v6",
    title: "90/10 Rule — The Ghost Consultant Principle",
    category: "Framework",
    tags: ["Core", "Workflow", "Automation"],
    excerpt: "The Ghost completes 90% of the strategy, research, and drafting. The final 10% — the Soul Signature — is reserved for DeWayne. This is the core value proposition: you only do the work that requires you.",
    wordCount: 560,
    lastUpdated: "4 days ago",
    type: "text",
  },
];

const TYPE_ICONS: Record<string, React.ElementType> = {
  text: FileText,
  audio: Mic,
};

const CATEGORY_COLORS: Record<string, string> = {
  Framework: "#F5A623",
  "Case Study": "#4ADE80",
  "Voice Note": "#60A5FA",
  Template: "#A78BFA",
  Research: "#F472B6",
};

export default function Vault() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const filtered = VAULT_ITEMS.filter((item) => {
    const matchCategory = activeCategory === "All" || item.category === activeCategory;
    const matchSearch = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <AppLayout title="The Vault" subtitle="Your living knowledge archive">
      <div className="p-6 space-y-6">

        {/* Hero */}
        <div
          className="relative overflow-hidden"
          style={{
            background: `url(${VAULT_BG}) center/cover no-repeat`,
            minHeight: '140px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(10,10,11,0.95) 0%, rgba(10,10,11,0.7) 100%)' }}
          />
          <div className="relative z-10 p-6 flex items-center justify-between">
            <div>
              <div className="ghost-badge mb-2">Knowledge Archive — Active</div>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
                The Vault
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '400px' }}>
                Your frameworks, case studies, voice notes, and templates. The Ghost draws from this archive to ensure every strategy sounds like you.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div style={{ fontFamily: 'Fira Code, monospace', fontSize: '28px', fontWeight: 500, color: 'var(--amber)' }}>
                  {VAULT_ITEMS.length}
                </div>
                <div className="data-label">Items</div>
              </div>
              <div className="text-center ml-4">
                <div style={{ fontFamily: 'Fira Code, monospace', fontSize: '28px', fontWeight: 500, color: 'var(--amber)' }}>
                  {VAULT_ITEMS.reduce((sum, i) => sum + i.wordCount, 0).toLocaleString()}
                </div>
                <div className="data-label">Words</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search the vault..."
              className="ghost-input w-full pl-9 pr-4 py-2.5 text-sm"
              style={{ borderRadius: '2px' }}
            />
          </div>
          <div className="flex gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-3 py-2 text-xs transition-all duration-150"
                style={{
                  background: activeCategory === cat ? 'var(--amber-glow)' : 'var(--surface)',
                  border: `1px solid ${activeCategory === cat ? 'var(--border-amber)' : 'var(--border-subtle)'}`,
                  color: activeCategory === cat ? 'var(--amber)' : 'var(--text-secondary)',
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: activeCategory === cat ? 600 : 400,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          <button
            onClick={() => toast.info("Add to Vault coming soon")}
            className="flex items-center gap-2 px-4 py-2.5 text-sm transition-all duration-150"
            style={{
              background: 'var(--amber)',
              color: 'var(--obsidian)',
              fontWeight: 600,
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <Plus size={14} />
            Add to Vault
          </button>
        </div>

        {/* Vault Items */}
        <div className="space-y-3">
          {filtered.map((item) => {
            const TypeIcon = TYPE_ICONS[item.type] || FileText;
            const isExpanded = expandedItem === item.id;
            return (
              <div
                key={item.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                  borderLeft: `2px solid ${CATEGORY_COLORS[item.category] || 'var(--amber)'}`,
                }}
              >
                <div
                  className="flex items-start gap-4 px-5 py-4 cursor-pointer"
                  onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-raised)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    className="flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{
                      width: '32px',
                      height: '32px',
                      background: `${CATEGORY_COLORS[item.category]}15`,
                      border: `1px solid ${CATEGORY_COLORS[item.category]}30`,
                    }}
                  >
                    <TypeIcon size={14} style={{ color: CATEGORY_COLORS[item.category] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {item.title}
                      </span>
                      <span
                        className="ghost-badge"
                        style={{
                          color: CATEGORY_COLORS[item.category],
                          borderColor: `${CATEGORY_COLORS[item.category]}40`,
                          background: `${CATEGORY_COLORS[item.category]}10`,
                        }}
                      >
                        {item.category}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {item.excerpt}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                        <Clock size={10} />
                        <span style={{ fontFamily: 'Fira Code, monospace', fontSize: '10px' }}>{item.lastUpdated}</span>
                      </div>
                      <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                        <BookOpen size={10} />
                        <span style={{ fontFamily: 'Fira Code, monospace', fontSize: '10px' }}>
                          {item.type === 'audio' ? item.duration : `${item.wordCount.toLocaleString()} words`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {item.tags.map((tag) => (
                          <div key={tag} className="flex items-center gap-0.5" style={{ color: 'var(--text-muted)' }}>
                            <Tag size={9} />
                            <span style={{ fontFamily: 'Fira Code, monospace', fontSize: '10px' }}>{tag}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div
                    className="px-5 pb-4 fade-in-up"
                    style={{ borderTop: '1px solid var(--border-subtle)' }}
                  >
                    <div className="pt-4">
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                        {item.excerpt} [Full content would be displayed here in the production version, loaded from your knowledge base.]
                      </p>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => toast.success("Item injected into Ghost framework")}
                          className="flex items-center gap-2 px-3 py-2 text-xs"
                          style={{
                            background: 'var(--amber)',
                            color: 'var(--obsidian)',
                            fontWeight: 600,
                            fontFamily: 'DM Sans, sans-serif',
                          }}
                        >
                          <Zap size={11} />
                          Use in Strategy
                        </button>
                        <button
                          onClick={() => toast.info("Edit coming soon")}
                          className="flex items-center gap-2 px-3 py-2 text-xs"
                          style={{
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)',
                            fontFamily: 'DM Sans, sans-serif',
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </AppLayout>
  );
}
