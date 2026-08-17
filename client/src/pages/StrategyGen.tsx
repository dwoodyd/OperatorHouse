/* =============================================================================
   Operator House — Strategy Generator (Phase 2: Real AI)
   Calls strategies.generate, renders structured output, saves to DB.
   No mock data. No simulated typewriter.
   ============================================================================= */
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { generateStrategySchema } from "@/lib/schemas";
import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { FileText, Zap, Copy, Download, RefreshCw, BookOpen, AlertCircle, CheckCircle2, Mail, ArrowRight, Share2, X, Link2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { SpectreEmptyState } from "@/components/StateUI";
import { SpectreVideoPlayer } from "@/components/SpectreVideoPlayer";
import { useSpectre } from "@/contexts/SpectreContext";
import { consumeHeroWorkflowHandoff, saveHeroWorkflowHandoff } from "@/lib/heroWorkflow";

const TEMPLATES = [
  { id: "full" as const, label: "Full Strategy Doc", desc: "Vibe Check + Engineering Map + Legacy Play + Next Beat" },
  { id: "quick" as const, label: "Quick Audit", desc: "Pain points + 3 AI solutions + immediate next step" },
  { id: "deck" as const, label: "Slide Deck Shell", desc: "5-slide structure ready for your brand colors" },
  { id: "email" as const, label: "Outreach Email", desc: "Personalized first-touch email in your voice" },
];

const INDUSTRIES = [
  "Creative Agency", "Tech Startup", "Solo Founder", "Real Estate", "Healthcare",
  "E-commerce", "Coaching / Consulting", "Media / Publishing", "Finance", "Other",
];

type OutputType = "full" | "quick" | "deck" | "email";

interface StrategyResult {
  title: string;
  outputType: OutputType;
  content: string;
  citations: Array<{ type: string; id: number; title: string }>;
  missingContext: string | null;
}

type ShareTarget = {
  id: number;
  title: string;
  content: string;
  citations: Array<{ type: string; id: number; title: string }>;
  clientName: string;
};

export default function StrategyGen() {
  const { spectreHidden } = useSpectre();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: strategies, isLoading: strategiesLoading } = trpc.strategies.list.useQuery();
  const { data: vaultItems } = trpc.vault.list.useQuery();
  const { data: sharedDeliverables } = trpc.sharedDeliverables.list.useQuery();

  const [selectedTemplate, setSelectedTemplate] = useState<OutputType>("full");
  const [clientName, setClientName] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [context, setContext] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>(undefined);
  const [result, setResult] = useState<StrategyResult | null>(null);
  const [activeTab, setActiveTab] = useState<"generate" | "history">("generate");
  const [showTriumph, setShowTriumph] = useState(false);
  const [loadedFromAudit, setLoadedFromAudit] = useState(false);
  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null);
  const [selectedSourceIds, setSelectedSourceIds] = useState<number[]>([]);
  const [shareClientName, setShareClientName] = useState("");
  const [consultantName, setConsultantName] = useState("Operator House");
  const [consultantLogoUrl, setConsultantLogoUrl] = useState("");
  const [shareAccentColor, setShareAccentColor] = useState("#F5A623");
  const [shareExpiryDays, setShareExpiryDays] = useState("30");
  const [shareLink, setShareLink] = useState<string | null>(null);

  const createDeliverable = trpc.sharedDeliverables.create.useMutation({
    onSuccess: (data) => {
      const link = `${window.location.origin}/shared/${data.token}`;
      setShareLink(link);
      navigator.clipboard.writeText(link).catch(() => undefined);
      toast.success("Private client link created and copied");
    },
    onError: (error) => toast.error(error.message),
  });
  const revokeDeliverable = trpc.sharedDeliverables.revoke.useMutation({
    onSuccess: () => {
      utils.sharedDeliverables.list.invalidate();
      toast.success("Client link revoked");
    },
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    const handoff = consumeHeroWorkflowHandoff();
    if (!handoff || handoff.source !== "lead-audit") return;
    setClientName(handoff.clientName);
    setCompany(handoff.company);
    setIndustry(handoff.industry || "");
    setContext(handoff.context);
    setLoadedFromAudit(true);
  }, []);

  const generateStrategy = trpc.strategies.generate.useMutation({
    onSuccess: (data) => {
      setResult(data.strategy as StrategyResult);
      utils.strategies.list.invalidate();
      utils.dashboard.metrics.invalidate();
      toast.success("Strategy generated and saved");
      // Specter triumph moment — show for 4 seconds then return to idle
      setShowTriumph(true);
      setTimeout(() => setShowTriumph(false), 4000);
    },
    onError: (err) => {
      toast.error(err.message || "Generation failed. Please retry.");
    },
  });

  const handleGenerate = () => {
    const result = generateStrategySchema.safeParse({ clientName: clientName.trim(), company: company.trim(), outputType: selectedTemplate });
    if (!result.success) return toast.error(result.error.issues[0]?.message ?? "Invalid input");
    if (!context.trim()) return toast.error("Add context about this client to ground the strategy");
    setResult(null);
    generateStrategy.mutate({
      outputType: selectedTemplate,
      clientName: clientName.trim(),
      company: company.trim(),
      industry: industry || undefined,
      context: context.trim(),
      clientId: selectedClientId,
    });
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.content);
    toast.success("Copied to clipboard");
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const prepareOutreach = () => {
    if (!result) return;
    saveHeroWorkflowHandoff({
      source: "strategy",
      clientName,
      company,
      industry,
      context: result.content.slice(0, 6000),
    });
    setLocation("/email-sequences");
  };

  const openShare = (target: ShareTarget) => {
    setShareTarget(target);
    setSelectedSourceIds(target.citations.filter((citation) => citation.type === "vault").map((citation) => citation.id));
    setShareClientName(target.clientName);
    setConsultantLogoUrl("");
    setShareAccentColor("#F5A623");
    setShareLink(null);
  };

  const selectedSources = useMemo(() => (vaultItems ?? []).filter((item) => selectedSourceIds.includes(item.id)), [selectedSourceIds, vaultItems]);
  const targetShares = useMemo(() => (sharedDeliverables ?? []).filter((deliverable) => deliverable.strategyId === shareTarget?.id), [shareTarget?.id, sharedDeliverables]);

  const submitShare = () => {
    if (!shareTarget) return;
    if (!selectedSourceIds.length) return toast.error("Select at least one Vault source to make the strategy inspectable.");
    createDeliverable.mutate({
      strategyId: shareTarget.id,
      title: shareTarget.title,
      clientName: shareClientName.trim() || undefined,
      consultantName: consultantName.trim() || "Operator House",
      consultantLogoUrl: consultantLogoUrl.trim() || undefined,
      accentColor: shareAccentColor,
      expiresInDays: Number(shareExpiryDays),
      sources: selectedSourceIds.map((vaultItemId) => ({ vaultItemId })),
    });
  };

  const handleClientSelect = (clientId: string) => {
    if (!clientId) { setSelectedClientId(undefined); return; }
    const id = parseInt(clientId);
    const client = clients?.find(c => c.id === id);
    if (client) {
      setSelectedClientId(id);
      setClientName(client.name);
      setCompany(client.company ?? "");
      setIndustry(client.industry ?? "");
    }
  };

  return (
    <AppLayout title="Strategy Generator" subtitle="Specter document engine — AI-grounded strategy">
      <div className="p-6">
        {/* Tab Bar */}
        <div className="flex gap-1 mb-6" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          {[
            { id: "generate", label: "Generate" },
            { id: "history", label: `History (${strategies?.length ?? 0})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "generate" | "history")}
              className="px-4 py-2 text-sm font-medium"
              style={{
                color: activeTab === tab.id ? 'var(--amber)' : 'var(--text-muted)',
                borderBottom: activeTab === tab.id ? '2px solid var(--amber)' : '2px solid transparent',
                fontFamily: 'DM Sans, sans-serif',
                marginBottom: '-1px',
                transition: 'color 150ms ease, border-color 150ms ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "generate" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: Config Panel */}
            <div className="lg:col-span-2 space-y-4">
              {/* Output Type */}
              <div className="glass-panel">
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Output Type
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className="w-full text-left p-3"
                      style={{
                        background: selectedTemplate === t.id ? 'var(--amber-glow)' : 'var(--surface-raised)',
                        border: `1px solid ${selectedTemplate === t.id ? 'var(--border-amber)' : 'var(--border-subtle)'}`,
                        borderLeft: `2px solid ${selectedTemplate === t.id ? 'var(--amber)' : 'transparent'}`,
                        transition: 'background 150ms ease, border-color 150ms ease',
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 500, color: selectedTemplate === t.id ? 'var(--amber)' : 'var(--text-primary)' }}>
                        {t.label}
                      </div>
                      <div className="data-label mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Client Details */}
              <div className="glass-panel">
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Client Details
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {loadedFromAudit && (
                    <div className="flex items-start gap-2 rounded-md p-3" style={{ background: "rgba(124,111,205,0.1)", border: "1px solid rgba(124,111,205,0.28)" }}>
                      <CheckCircle2 size={14} style={{ color: "#C4B5FD", flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ color: "#DDD6FE", fontSize: "12px", fontWeight: 600 }}>Lead audit loaded</div>
                        <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: "3px 0 0", lineHeight: 1.5 }}>Specter will combine this audit with your Vault before building the strategy.</p>
                      </div>
                    </div>
                  )}
                  {clients && clients.length > 0 && (
                    <div>
                      <label className="data-label block mb-1">Load from Client Record</label>
                      <select
                        onChange={(e) => handleClientSelect(e.target.value)}
                        className="w-full px-3 py-2 text-sm outline-none"
                        style={{ background: 'var(--obsidian)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', fontFamily: 'DM Sans, sans-serif' }}
                      >
                        <option value="">— Select client —</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="data-label block mb-1">Client Name *</label>
                    <input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Client name"
                      className="w-full px-3 py-2 text-sm outline-none"
                      style={{ background: 'var(--obsidian)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', fontFamily: 'DM Sans, sans-serif' }}
                    />
                  </div>
                  <div>
                    <label className="data-label block mb-1">Company *</label>
                    <input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Company name"
                      className="w-full px-3 py-2 text-sm outline-none"
                      style={{ background: 'var(--obsidian)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', fontFamily: 'DM Sans, sans-serif' }}
                    />
                  </div>
                  <div>
                    <label className="data-label block mb-1">Industry</label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-3 py-2 text-sm outline-none"
                      style={{ background: 'var(--obsidian)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', fontFamily: 'DM Sans, sans-serif' }}
                    >
                      <option value="">Select industry</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="data-label block mb-1">Context & Notes *</label>
                    <textarea
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="Describe the client situation, goals, challenges, recent conversations... More context = better strategy."
                      rows={5}
                      className="w-full px-3 py-2 text-sm outline-none resize-none"
                      style={{ background: 'var(--obsidian)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', fontFamily: 'DM Sans, sans-serif' }}
                    />
                    <p className="data-label mt-1">Vault frameworks and client records are automatically included as context.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generateStrategy.isPending}
                className="w-full py-3 font-semibold text-sm flex items-center justify-center gap-2"
                style={{
                  background: generateStrategy.isPending ? 'var(--surface-raised)' : 'var(--amber)',
                  color: generateStrategy.isPending ? 'var(--text-muted)' : '#0A0A0F',
                  fontFamily: 'DM Sans, sans-serif',
                  border: `1px solid ${generateStrategy.isPending ? 'var(--border-subtle)' : 'var(--amber)'}`,
                }}
              >
                {generateStrategy.isPending ? (
                  <><RefreshCw size={15} className="animate-spin" />Specter is generating...</>
                ) : (
                  <><Zap size={15} />Generate Strategy</>
                )}
              </button>

              {generateStrategy.isPending && (
                <div className="p-3 space-y-1.5" style={{ background: 'var(--surface)', border: '1px solid var(--border-amber)' }}>
                  {["Loading Specter framework...", "Pulling vault context...", "Analyzing client situation...", "Mapping engineering solutions...", "Crafting strategy document..."].map((step, i) => (
                    <div key={i} className="flex items-center gap-2" style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'Fira Code, monospace' }}>
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--amber)', animationDelay: `${i * 0.3}s` }} />
                      {step}
                    </div>
                  ))}
                </div>
              )}

              {generateStrategy.isError && (
                <div className="p-3 flex items-start gap-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <AlertCircle size={14} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p style={{ color: '#ef4444', fontSize: '12px', fontWeight: 500 }}>Generation failed</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>{generateStrategy.error?.message}</p>
                    <button onClick={handleGenerate} className="mt-2 text-xs font-medium" style={{ color: 'var(--amber)', fontFamily: 'DM Sans, sans-serif' }}>
                      Retry →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Output Panel */}
            <div className="lg:col-span-3">
              {!result && !generateStrategy.isPending && (
                <div className="glass-panel" style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SpectreEmptyState
                    title="No strategy generated yet."
                    spectreQuote="Give me a client, a deal, and a goal. I'll build the playbook."
                    body="Fill in the client details on the left and click Generate Strategy."
                    compact
                  />
                </div>
              )}

              {generateStrategy.isPending && (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border-amber)' }}>
                  {/* Specter thinking while strategy is being generated */}
                  {!spectreHidden && <SpectreVideoPlayer state="thinking" size="lg" glow />}
                  <p style={{ color: 'var(--amber)', fontSize: '13px', fontFamily: 'Fira Code, monospace' }}>Specter is building the playbook...</p>
                </div>
              )}
              {/* Specter triumph flash — shown briefly after successful generation */}
              {showTriumph && result && (
                <div
                  style={{
                    position: 'fixed',
                    bottom: '80px',
                    right: '24px',
                    zIndex: 50,
                    pointerEvents: 'none',
                    animation: 'fadeInUp 0.4s ease',
                  }}
                >
                  {!spectreHidden && <SpectreVideoPlayer state="celebration" size="md" glow />}
                </div>
              )}

              {result && (
                <div className="glass-panel">
                  <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} style={{ color: 'var(--amber)' }} />
                        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', color: 'var(--text-primary)' }}>{result.title}</span>
                      </div>
                      <div className="data-label mt-0.5">
                        {TEMPLATES.find(t => t.id === result.outputType)?.label} · Specter v2.0
                        {result.citations.length > 0 && ` · ${result.citations.length} source${result.citations.length > 1 ? "s" : ""}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={handleCopy} className="p-2 transition-colors" style={{ color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }} title="Copy markdown">
                        <Copy size={13} />
                      </button>
                      <button onClick={handleDownload} className="p-2 transition-colors" style={{ color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }} title="Download .md">
                        <Download size={13} />
                      </button>
                    </div>
                  </div>

                  {result.missingContext && (
                    <div className="mx-5 mt-4 p-3 flex items-start gap-2" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid var(--border-amber)' }}>
                      <AlertCircle size={13} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: '2px' }} />
                      <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        <span style={{ color: 'var(--amber)', fontWeight: 500 }}>Specter note: </span>
                        {result.missingContext}
                      </p>
                    </div>
                  )}

                  {result.citations.length > 0 && (
                    <div className="mx-5 mt-3 flex flex-wrap gap-2">
                      {result.citations.map((c, i) => (
                        <span key={i} className="flex items-center gap-1 px-2 py-0.5"
                          style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'Fira Code, monospace' }}>
                          <BookOpen size={10} />
                          {c.type}: {c.title}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="p-5 overflow-auto max-h-[600px]"
                    style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.7' }}>
                    <Streamdown>{result.content}</Streamdown>
                  </div>

                  <div className="px-5 py-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <div className="flex flex-wrap items-center gap-3">
                      <button onClick={handleGenerate} disabled={generateStrategy.isPending}
                        className="flex items-center gap-1.5 text-xs font-medium"
                        style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif' }}>
                        <RefreshCw size={12} />Regenerate
                      </button>
                      <button onClick={prepareOutreach}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded"
                        style={{ color: 'var(--amber)', background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.28)', fontFamily: 'DM Sans, sans-serif' }}>
                        <Mail size={12} />Prepare outreach from this strategy <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div>
            {strategiesLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--amber)', borderTopColor: 'transparent' }} />
              </div>
            ) : !strategies?.length ? (
              <SpectreEmptyState
                title="No strategies generated yet."
                spectreQuote="Every operator needs a playbook. Let's build yours."
                body="Generate your first strategy from the Build tab."
              />
            ) : (
              <div className="space-y-3">
                {strategies.map((s) => {
                  const ctx = s.inputContext as Record<string, string> | null;
                  return (
                    <div key={s.id} className="glass-panel">
                      <div className="px-5 py-4 flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 text-xs font-mono"
                              style={{ background: 'var(--amber-glow)', color: 'var(--amber)', border: '1px solid var(--border-amber)' }}>
                              {s.outputType}
                            </span>
                            <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>
                              {ctx?.clientName ?? "Unknown"}{ctx?.company ? ` — ${ctx.company}` : ""}
                            </span>
                          </div>
                          <p className="data-label">{new Date(s.createdAt).toLocaleDateString()} · {s.promptVersion ?? "v2.0"}</p>
                        </div>
                        <button
                          onClick={() => {
                            setResult({
                              title: `${ctx?.clientName ?? ""} — ${s.outputType}`,
                              outputType: s.outputType as OutputType,
                              content: s.content ?? "",
                              citations: (s.citations as Array<{ type: string; id: number; title: string }>) ?? [],
                              missingContext: null,
                            });
                            setActiveTab("generate");
                          }}
                          className="text-xs px-3 py-1.5 ml-4 flex-shrink-0"
                          style={{ color: 'var(--amber)', border: '1px solid var(--border-amber)', fontFamily: 'DM Sans, sans-serif' }}>
                          View
                        </button>
                        <button
                          onClick={() => openShare({ id: s.id, title: `${ctx?.clientName ?? "Client"} — ${s.outputType} strategy`, content: s.content ?? "", citations: (s.citations as Array<{ type: string; id: number; title: string }>) ?? [], clientName: ctx?.clientName ?? "" })}
                          disabled={!s.content}
                          className="text-xs px-3 py-1.5 ml-2 flex-shrink-0 flex items-center gap-1.5"
                          style={{ color: 'var(--amber)', border: '1px solid var(--border-amber)', fontFamily: 'DM Sans, sans-serif', opacity: s.content ? 1 : 0.5 }}>
                          <Share2 size={12} />Share
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      {shareTarget && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Share client strategy">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border-amber)', boxShadow: '0 24px 90px rgba(0,0,0,0.5)' }}>
            <div className="flex justify-between gap-4 mb-2"><div><p className="data-label">CLIENT-READY DELIVERY</p><h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: 'var(--text-primary)' }}>Share an inspectable strategy</h2></div><button onClick={() => setShareTarget(null)} aria-label="Close sharing dialog" style={{ color: 'var(--text-muted)' }}><X size={18} /></button></div>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>The client sees only this strategy and the Vault excerpts you select—never your private workspace.</p>
            {shareLink ? <div className="p-4" style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid var(--border-amber)' }}><div className="flex items-center gap-2 mb-2" style={{ color: 'var(--amber)' }}><Link2 size={15} />Private link ready</div><p className="text-xs break-all" style={{ color: 'var(--text-primary)' }}>{shareLink}</p><button onClick={() => navigator.clipboard.writeText(shareLink).then(() => toast.success("Link copied"))} className="mt-3 text-xs font-semibold" style={{ color: 'var(--amber)' }}>Copy link</button></div> : <>
              <div className="grid sm:grid-cols-2 gap-3 mb-3"><label className="text-xs" style={{ color: 'var(--text-muted)' }}>Client name<input value={shareClientName} onChange={(e) => setShareClientName(e.target.value)} className="mt-1.5 w-full p-2.5 bg-transparent" style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} placeholder="Client or company" /></label><label className="text-xs" style={{ color: 'var(--text-muted)' }}>Your brand name<input value={consultantName} onChange={(e) => setConsultantName(e.target.value)} className="mt-1.5 w-full p-2.5 bg-transparent" style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} /></label></div>
              <div className="grid sm:grid-cols-[1fr_auto] gap-3 mb-5"><label className="text-xs" style={{ color: 'var(--text-muted)' }}>Your logo URL <span style={{ color: 'var(--text-muted)' }}>(optional)</span><input value={consultantLogoUrl} onChange={(e) => setConsultantLogoUrl(e.target.value)} type="url" className="mt-1.5 w-full p-2.5 bg-transparent" style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} placeholder="https://…/your-logo.png" /></label><label className="text-xs" style={{ color: 'var(--text-muted)' }}>Accent color<input value={shareAccentColor} onChange={(e) => setShareAccentColor(e.target.value)} type="color" className="mt-1.5 block w-12 h-10 cursor-pointer bg-transparent" aria-label="Deliverable accent color" /></label></div>
              <label className="text-xs block mb-5" style={{ color: 'var(--text-muted)' }}>Link expires<select value={shareExpiryDays} onChange={(e) => setShareExpiryDays(e.target.value)} className="mt-1.5 w-full p-2.5 bg-transparent" style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}><option value="7">In 7 days</option><option value="30">In 30 days</option><option value="90">In 90 days</option></select></label>
              <div className="mb-5"><div className="flex items-center gap-2 mb-2"><BookOpen size={14} style={{ color: 'var(--amber)' }} /><span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Select client-visible source excerpts</span></div>{selectedSources.length ? selectedSources.map((source) => <label key={source.id} className="flex items-start gap-2 p-3 mb-2 cursor-pointer" style={{ border: '1px solid var(--border-subtle)' }}><input type="checkbox" checked={selectedSourceIds.includes(source.id)} onChange={(e) => setSelectedSourceIds((ids) => e.target.checked ? [...ids, source.id] : ids.filter((id) => id !== source.id))} /><span><span className="block text-sm" style={{ color: 'var(--text-primary)' }}>{source.title}</span><span className="block text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Excerpt only; private Vault access is not shared.</span></span></label>) : <p className="text-xs p-3" style={{ color: 'var(--text-muted)', border: '1px dashed var(--border-subtle)' }}>This strategy has no matching Vault sources. Generate a Vault-grounded strategy before sharing.</p>}</div>
              <button onClick={submitShare} disabled={createDeliverable.isPending || !selectedSources.length} className="w-full flex items-center justify-center gap-2 py-3 font-semibold" style={{ background: 'var(--amber)', color: '#120f0a', opacity: createDeliverable.isPending || !selectedSources.length ? 0.55 : 1 }}><ShieldCheck size={15} />{createDeliverable.isPending ? 'Creating private link…' : 'Create client-ready link'}</button>
            </>}
            {targetShares.length > 0 && <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}><p className="data-label mb-2">EXISTING CLIENT LINKS</p>{targetShares.map((deliverable) => <div key={deliverable.id} className="flex items-center justify-between gap-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}><span>{deliverable.status === 'active' ? `Active · ${deliverable.openCount} opens` : 'Revoked'}{deliverable.expiresAt ? ` · expires ${new Date(deliverable.expiresAt).toLocaleDateString()}` : ''}</span>{deliverable.status === 'active' && <button onClick={() => revokeDeliverable.mutate({ id: deliverable.id })} disabled={revokeDeliverable.isPending} style={{ color: '#f59e9e' }}>Revoke</button>}</div>)}</div>}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
