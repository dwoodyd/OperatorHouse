/**
 * Client Pulse — health score dashboard, unified timeline, at-risk alerts
 * Phase 2 of the Operator House Outreach Suite
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { SpectreEmptyState } from "@/components/StateUI";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Activity, TrendingUp, TrendingDown, Minus, AlertTriangle,
  RefreshCw, Clock, Phone, Mail, MessageSquare, GitBranch,
  FileText, Mic, StickyNote, Plus, Users, Heart,
} from "lucide-react";

// ── Health score colour helpers ───────────────────────────────────────────────
function scoreColor(score: number) {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}
function scoreLabel(score: number) {
  if (score >= 70) return "Healthy";
  if (score >= 40) return "At Risk";
  return "Critical";
}
function TrendIcon({ trend }: { trend: string }) {
  if (trend === "improving") return <TrendingUp size={12} className="text-green-400" />;
  if (trend === "declining") return <TrendingDown size={12} className="text-red-400" />;
  return <Minus size={12} className="text-muted-foreground" />;
}

// ── Timeline event icon ───────────────────────────────────────────────────────
function TimelineIcon({ type }: { type: string }) {
  const cls = "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0";
  switch (type) {
    case "sms":           return <div className={cls} style={{ background: "rgba(34,197,94,0.15)" }}><MessageSquare size={13} className="text-green-400" /></div>;
    case "call":          return <div className={cls} style={{ background: "rgba(59,130,246,0.15)" }}><Phone size={13} className="text-blue-400" /></div>;
    case "email":         return <div className={cls} style={{ background: "rgba(168,85,247,0.15)" }}><Mail size={13} className="text-purple-400" /></div>;
    case "voice_agent":   return <div className={cls} style={{ background: "rgba(251,146,60,0.15)" }}><Mic size={13} className="text-orange-400" /></div>;
    case "pipeline_change": return <div className={cls} style={{ background: "rgba(212,168,83,0.15)" }}><GitBranch size={13} className="text-amber-400" /></div>;
    case "strategy_delivered": return <div className={cls} style={{ background: "rgba(212,168,83,0.15)" }}><FileText size={13} className="text-amber-400" /></div>;
    default:              return <div className={cls} style={{ background: "rgba(148,163,184,0.1)" }}><StickyNote size={13} className="text-muted-foreground" /></div>;
  }
}

// ── Health score ring ─────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 20, circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="flex-shrink-0">
      <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
      <circle
        cx="26" cy="26" r={r} fill="none"
        stroke={scoreColor(score)} strokeWidth="4"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text x="26" y="31" textAnchor="middle" fontSize="11" fontWeight="700" fill={scoreColor(score)}>
        {score}
      </text>
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Pulse() {
  const utils = trpc.useUtils();

  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [eventType, setEventType] = useState<"sms" | "call" | "email" | "voice_agent" | "pipeline_change" | "strategy_delivered" | "note">("note");
  const [eventSummary, setEventSummary] = useState("");
  const [eventSentiment, setEventSentiment] = useState<"positive" | "neutral" | "negative">("neutral");

  const { data: summary } = trpc.pulse.getSummary.useQuery();
  const { data: clients = [], isLoading } = trpc.pulse.getClientScores.useQuery();
  const { data: timeline = [], isLoading: timelineLoading } = trpc.pulse.getClientTimeline.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );
  const { data: atRisk = [] } = trpc.pulse.getAtRiskClients.useQuery();

  const calculateScores = trpc.pulse.calculateScores.useMutation({
    onSuccess: () => {
      utils.pulse.getClientScores.invalidate();
      utils.pulse.getSummary.invalidate();
      utils.pulse.getAtRiskClients.invalidate();
      toast.success("Health scores updated");
    },
  });

  const addEvent = trpc.pulse.addTimelineEvent.useMutation({
    onSuccess: () => {
      utils.pulse.getClientTimeline.invalidate({ clientId: selectedClientId! });
      setAddEventOpen(false);
      setEventSummary("");
      toast.success("Timeline event added");
    },
  });

  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <AppLayout title="Client Pulse" subtitle="Health scores · Unified timeline · At-risk alerts">
      <div className="p-6 space-y-6">

        {/* ── Summary bar ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Avg Health", value: summary?.avgScore ?? 0, icon: Heart, color: scoreColor(summary?.avgScore ?? 0) },
            { label: "Total Clients", value: summary?.totalClients ?? 0, icon: Users, color: "var(--text-muted)" },
            { label: "At Risk", value: summary?.atRiskCount ?? 0, icon: AlertTriangle, color: "#ef4444" },
            { label: "Improving", value: summary?.improvingCount ?? 0, icon: TrendingUp, color: "#22c55e" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="glass-panel border-0">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                  <Icon size={15} style={{ color }} />
                </div>
                <div>
                  <div className="text-xl font-bold" style={{ color }}>{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── At-risk alert strip ──────────────────────────────────────────── */}
        {atRisk.length > 0 && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 flex items-center gap-3">
            <AlertTriangle size={15} className="text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-300">
              <strong>{atRisk.length} client{atRisk.length > 1 ? "s" : ""}</strong> need immediate attention:&nbsp;
              {atRisk.slice(0, 3).map(c => c.name).join(", ")}
              {atRisk.length > 3 ? ` +${atRisk.length - 3} more` : ""}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Client list ─────────────────────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Clients</h3>
              <Button
                variant="ghost" size="sm"
                onClick={() => calculateScores.mutate()}
                disabled={calculateScores.isPending}
                className="h-7 px-2 text-xs"
              >
                <RefreshCw size={11} className={calculateScores.isPending ? "animate-spin mr-1" : "mr-1"} />
                Refresh
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />)}
              </div>
            ) : clients.length === 0 ? (
              <SpectreEmptyState
                title="No clients yet"
                spectreQuote="Add clients to the pipeline and I'll start watching their health."
                body="Add clients to the pipeline and Specter will start tracking their health."
              />
            ) : (
              <div className="space-y-2">
                {clients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className={`w-full text-left rounded-lg p-3 transition-all border ${
                      selectedClientId === client.id
                        ? "border-amber-500/40 bg-amber-500/5"
                        : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ScoreRing score={client.healthScore} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium truncate">{client.name}</span>
                          <TrendIcon trend={client.healthTrend} />
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{client.company ?? "—"}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 border-0"
                            style={{ background: `${scoreColor(client.healthScore)}18`, color: scoreColor(client.healthScore) }}
                          >
                            {scoreLabel(client.healthScore)}
                          </Badge>
                          {client.activeDeals > 0 && (
                            <span className="text-[10px] text-muted-foreground">{client.activeDeals} active deal{client.activeDeals > 1 ? "s" : ""}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Timeline panel ───────────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            {!selectedClientId ? (
              <div className="h-full flex items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] p-8">
              <SpectreEmptyState
                title="Select a client"
                spectreQuote="Choose a client and I'll show you everything."
                body="Choose a client on the left to view their unified interaction timeline."
              />
              </div>
            ) : (
              <Card className="glass-panel border-0 h-full">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{selectedClient?.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedClient?.company ?? "—"} · Unified Timeline</p>
                  </div>
                  <Button
                    size="sm" variant="outline"
                    onClick={() => setAddEventOpen(true)}
                    className="h-7 px-2 text-xs"
                  >
                    <Plus size={11} className="mr-1" /> Log Interaction
                  </Button>
                </CardHeader>
                <CardContent className="overflow-y-auto max-h-[520px] space-y-3 pr-2">
                  {timelineLoading ? (
                    <div className="space-y-3">
                      {[1,2,3].map(i => <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />)}
                    </div>
                  ) : timeline.length === 0 ? (
                    <SpectreEmptyState
                      title="No interactions yet"
                      spectreQuote="Log a call, email, or note. Every touchpoint matters."
                      body="Log a call, email, or note to start building this client's timeline."
                    />
                  ) : (
                    <div className="relative">
                      <div className="absolute left-3.5 top-0 bottom-0 w-px bg-white/5" />
                      <div className="space-y-3">
                        {timeline.map((event, i) => (
                          <div key={i} className="flex gap-3 relative">
                            <TimelineIcon type={event.eventType} />
                            <div className="flex-1 min-w-0 pb-3">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm leading-snug">{event.summary ?? event.eventType}</p>
                                {event.sentiment && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 border-0 flex-shrink-0"
                                    style={{
                                      background: event.sentiment === "positive" ? "rgba(34,197,94,0.1)" : event.sentiment === "negative" ? "rgba(239,68,68,0.1)" : "rgba(148,163,184,0.1)",
                                      color: event.sentiment === "positive" ? "#22c55e" : event.sentiment === "negative" ? "#ef4444" : "var(--text-muted)",
                                    }}
                                  >
                                    {event.sentiment}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5 text-[11px] text-muted-foreground">
                                <Clock size={9} />
                                <span>{new Date(event.occurredAt).toLocaleString()}</span>
                                <span className="opacity-50">·</span>
                                <span className="capitalize">{event.eventType.replace("_", " ")}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* ── Add event dialog ─────────────────────────────────────────────────── */}
      <Dialog open={addEventOpen} onOpenChange={setAddEventOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Interaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Type</label>
              <Select value={eventType} onValueChange={(v) => setEventType(v as typeof eventType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["call", "email", "sms", "note", "pipeline_change", "strategy_delivered", "voice_agent"].map(t => (
                    <SelectItem key={t} value={t}>{t.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Summary</label>
              <Textarea
                value={eventSummary}
                onChange={e => setEventSummary(e.target.value)}
                placeholder="What happened in this interaction?"
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Sentiment</label>
              <Select value={eventSentiment} onValueChange={(v) => setEventSentiment(v as typeof eventSentiment)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setAddEventOpen(false)}>Cancel</Button>
              <Button
                onClick={() => addEvent.mutate({ clientId: selectedClientId!, eventType, summary: eventSummary, sentiment: eventSentiment })}
                disabled={!eventSummary.trim() || addEvent.isPending}
              >
                {addEvent.isPending ? "Saving…" : "Log Interaction"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
