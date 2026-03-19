/* =============================================================================
   GhostDesk — Lead Intelligence
   Obsidian Intelligence: Paste URL/email → get Soul Engineer audit of prospect
   ============================================================================= */

import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Search, Zap, ExternalLink, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const SAMPLE_LEADS = [
  {
    id: "L-001",
    name: "Marcus Chen",
    company: "TechFlow Solutions",
    source: "LinkedIn",
    intentScore: 8.4,
    stage: "Analysis",
    vibeCheck: "Founder in scaling phase. Internal structure is fragmented — 3 different tools for lead management, no unified system. High intent to implement AI but unclear on where to start.",
    painPoints: ["Manual lead qualification taking 4+ hours/week", "No consistent client onboarding process", "Brand voice inconsistent across platforms"],
    engineeringMap: [
      "Deploy GhostDesk pipeline to automate lead scoring and outreach",
      "Build a RAG-based onboarding assistant trained on their service docs",
      "Implement content repurposing workflow: 1 video → 8 platform assets"
    ],
    legacyPlay: "Position TechFlow as the first AI-native consulting firm in their niche by building a public 'AI Implementation Playbook' — a living document that becomes a lead magnet and establishes thought leadership.",
    nextBeat: "Schedule a 30-minute 'AI Audit' call. Come prepared with their current tech stack mapped against the Soul Engineer framework.",
    addedDate: "2 hours ago",
  },
  {
    id: "L-002",
    name: "Aisha Williams",
    company: "Apex Creative Agency",
    source: "Reddit",
    intentScore: 9.2,
    stage: "Proposal",
    vibeCheck: "Agency owner frustrated with content production bottlenecks. High creative output but low distribution efficiency. Ready to invest in AI solutions immediately.",
    painPoints: ["Content production takes 3x longer than it should", "Client reporting is manual and inconsistent", "Team communication scattered across 5 platforms"],
    engineeringMap: [
      "Implement ClipOS-style content repurposing pipeline for their client deliverables",
      "Build automated client reporting dashboard pulling from their project management tools",
      "Deploy unified team inbox with AI-suggested responses"
    ],
    legacyPlay: "Create an 'Agency AI Transformation' case study documenting their journey. License this as a template to other agencies — recurring revenue stream.",
    nextBeat: "Send the preliminary strategy doc and request a voice note response. High close probability — move to proposal stage.",
    addedDate: "5 hours ago",
  },
  {
    id: "L-003",
    name: "Jordan Rivera",
    company: "NextGen Ventures",
    source: "X (Twitter)",
    intentScore: 6.5,
    stage: "Discovery",
    vibeCheck: "Early-stage founder exploring AI options. Not yet clear on specific pain points. Needs education before solution. Lower immediate priority but worth nurturing.",
    painPoints: ["General 'AI FOMO' — wants to implement but doesn't know where", "Limited budget for initial implementation", "No technical co-founder"],
    engineeringMap: [
      "Start with a low-cost AI audit to identify the highest-leverage automation",
      "Recommend starting with one workflow automation (email responses or content)",
      "Provide a 30-day implementation roadmap with clear milestones"
    ],
    legacyPlay: "Offer a 'Founder AI Sprint' — a 2-week intensive that gets them from zero to one working automation. Document the process as a case study.",
    nextBeat: "Add to nurture sequence. Send the 'AI Readiness Assessment' as a free resource. Follow up in 2 weeks.",
    addedDate: "1 day ago",
  },
];

const SCORE_COLOR = (score: number) => {
  if (score >= 8.5) return "#4ADE80";
  if (score >= 7) return "#F5A623";
  return "#6B6B7A";
};

const STAGE_COLORS: Record<string, string> = {
  Discovery: "#6B6B7A",
  Analysis: "#F5A623",
  Proposal: "#4ADE80",
  Closed: "#A78BFA",
};

export default function LeadIntel() {
  const [inputValue, setInputValue] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedLead, setExpandedLead] = useState<string | null>("L-001");
  const [analysisStep, setAnalysisStep] = useState(0);

  const ANALYSIS_STEPS = [
    "Scanning public presence...",
    "Identifying pain points of purpose...",
    "Applying Soul Engineer framework...",
    "Generating Engineering Map...",
    "Drafting Legacy Play...",
    "Analysis complete.",
  ];

  const handleAnalyze = () => {
    if (!inputValue.trim()) {
      toast.error("Please enter a URL, LinkedIn profile, or email to analyze.");
      return;
    }
    setIsAnalyzing(true);
    setAnalysisStep(0);
    const interval = setInterval(() => {
      setAnalysisStep((prev) => {
        if (prev >= ANALYSIS_STEPS.length - 1) {
          clearInterval(interval);
          setIsAnalyzing(false);
          toast.success("Lead analysis complete! Review the Soul Engineer audit below.");
          return prev;
        }
        return prev + 1;
      });
    }, 700);
  };

  return (
    <AppLayout title="Lead Intelligence" subtitle="Soul Engineer Audit Engine">
      <div className="p-6 space-y-6">

        {/* Input Section */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}>
          <div className="p-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Analyze a Lead
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Paste a URL, LinkedIn profile, email, or any lead context. The Ghost will run a full Soul Engineer audit.
            </p>
          </div>
          <div className="p-5">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  placeholder="https://linkedin.com/in/... or paste email or company name"
                  className="ghost-input w-full pl-9 pr-4 py-3 text-sm"
                  style={{ borderRadius: '2px' }}
                />
              </div>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-5 py-3 transition-all duration-150"
                style={{
                  background: isAnalyzing ? 'var(--amber-dim)' : 'var(--amber)',
                  color: 'var(--obsidian)',
                  fontWeight: 600,
                  fontSize: '13px',
                  fontFamily: 'DM Sans, sans-serif',
                  opacity: isAnalyzing ? 0.7 : 1,
                  minWidth: '140px',
                }}
              >
                {isAnalyzing ? (
                  <>
                    <span className="status-dot processing" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    Run Audit
                  </>
                )}
              </button>
            </div>

            {/* Analysis Progress */}
            {isAnalyzing && (
              <div className="mt-4 p-4 fade-in-up" style={{ background: 'var(--amber-glow)', border: '1px solid var(--border-amber)' }}>
                <div className="space-y-1.5">
                  {ANALYSIS_STEPS.map((step, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2"
                      style={{ opacity: i <= analysisStep ? 1 : 0.2, transition: 'opacity 300ms ease' }}
                    >
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: i < analysisStep ? '#4ADE80' : i === analysisStep ? 'var(--amber)' : 'var(--text-muted)',
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: 'Fira Code, monospace',
                          fontSize: '12px',
                          color: i === analysisStep ? 'var(--amber)' : i < analysisStep ? '#4ADE80' : 'var(--text-muted)',
                        }}
                      >
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lead List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Recent Audits
              </span>
              <span className="data-label ml-3">{SAMPLE_LEADS.length} leads analyzed</span>
            </div>
          </div>

          <div className="space-y-3">
            {SAMPLE_LEADS.map((lead) => (
              <div
                key={lead.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                  borderLeft: `2px solid ${SCORE_COLOR(lead.intentScore)}`,
                }}
              >
                {/* Lead Header */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                  onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                  style={{ transition: 'background 150ms ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-raised)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {lead.name}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        — {lead.company}
                      </span>
                      <span
                        className="ghost-badge"
                        style={{
                          color: STAGE_COLORS[lead.stage],
                          borderColor: `${STAGE_COLORS[lead.stage]}50`,
                          background: `${STAGE_COLORS[lead.stage]}10`,
                        }}
                      >
                        {lead.stage}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="data-label">Source: {lead.source}</span>
                      <span className="data-label">{lead.addedDate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="data-label mb-0.5">Intent Score</div>
                      <div
                        style={{
                          fontFamily: 'Fira Code, monospace',
                          fontSize: '20px',
                          fontWeight: 500,
                          color: SCORE_COLOR(lead.intentScore),
                          lineHeight: 1,
                        }}
                      >
                        {lead.intentScore}
                      </div>
                    </div>
                    {expandedLead === lead.id ? (
                      <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} />
                    ) : (
                      <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
                    )}
                  </div>
                </div>

                {/* Expanded Audit */}
                {expandedLead === lead.id && (
                  <div
                    className="fade-in-up"
                    style={{ borderTop: '1px solid var(--border-subtle)' }}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                      {/* Left: Vibe Check + Pain Points */}
                      <div className="p-5" style={{ borderRight: '1px solid var(--border-subtle)' }}>
                        <div className="mb-4">
                          <div className="data-label mb-2" style={{ color: 'var(--amber)' }}>01 — The Vibe Check</div>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            {lead.vibeCheck}
                          </p>
                        </div>
                        <div>
                          <div className="data-label mb-2">Pain Points of Purpose</div>
                          <div className="space-y-1.5">
                            {lead.painPoints.map((pain, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <div
                                  style={{
                                    width: '4px',
                                    height: '4px',
                                    borderRadius: '50%',
                                    background: 'var(--amber)',
                                    marginTop: '6px',
                                    flexShrink: 0,
                                  }}
                                />
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{pain}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Engineering Map + Legacy Play */}
                      <div className="p-5">
                        <div className="mb-4">
                          <div className="data-label mb-2" style={{ color: 'var(--amber)' }}>02 — The Engineering Map</div>
                          <div className="space-y-2">
                            {lead.engineeringMap.map((item, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <span
                                  style={{
                                    fontFamily: 'Fira Code, monospace',
                                    fontSize: '11px',
                                    color: 'var(--amber)',
                                    opacity: 0.6,
                                    flexShrink: 0,
                                    marginTop: '2px',
                                  }}
                                >
                                  {String(i + 1).padStart(2, '0')}
                                </span>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="mb-4">
                          <div className="data-label mb-2" style={{ color: 'var(--amber)' }}>03 — The Legacy Play</div>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            {lead.legacyPlay}
                          </p>
                        </div>
                        <div
                          className="p-3"
                          style={{ background: 'var(--amber-glow)', border: '1px solid var(--border-amber)' }}
                        >
                          <div className="data-label mb-1" style={{ color: 'var(--amber)' }}>04 — The Next Beat</div>
                          <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                            {lead.nextBeat}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div
                      className="flex items-center gap-3 px-5 py-3"
                      style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--surface-raised)' }}
                    >
                      <button
                        onClick={() => toast.success("Strategy doc generation started")}
                        className="flex items-center gap-2 px-4 py-2 text-xs transition-all duration-150"
                        style={{
                          background: 'var(--amber)',
                          color: 'var(--obsidian)',
                          fontWeight: 600,
                          fontFamily: 'DM Sans, sans-serif',
                        }}
                      >
                        <Zap size={12} />
                        Generate Strategy Doc
                      </button>
                      <button
                        onClick={() => toast.success("Voice briefing generated")}
                        className="flex items-center gap-2 px-4 py-2 text-xs transition-all duration-150"
                        style={{
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                          fontFamily: 'DM Sans, sans-serif',
                        }}
                      >
                        Voice Briefing
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(lead, null, 2));
                          toast.success("Audit copied to clipboard");
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-xs transition-all duration-150"
                        style={{
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                          fontFamily: 'DM Sans, sans-serif',
                        }}
                      >
                        <Copy size={12} />
                        Copy Audit
                      </button>
                      <button
                        onClick={() => toast.info("Opening in new tab")}
                        className="flex items-center gap-2 px-4 py-2 text-xs ml-auto transition-all duration-150"
                        style={{
                          color: 'var(--text-muted)',
                          fontFamily: 'DM Sans, sans-serif',
                        }}
                      >
                        <ExternalLink size={12} />
                        View Full Profile
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
