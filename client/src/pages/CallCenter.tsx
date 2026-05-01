import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { SpectreEmptyState } from "@/components/StateUI";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Phone,
  PhoneOff,
  PhoneCall,
  PhoneMissed,
  Voicemail,
  CheckCircle2,
  Clock,
  Trash2,
  Sparkles,
  Plus,
  ChevronDown,
  ChevronRight,
  FileText,
  AlertTriangle,
  Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Disposition =
  | "connected"
  | "voicemail"
  | "no_answer"
  | "callback_requested"
  | "not_interested"
  | "converted";

const DISPOSITION_LABELS: Record<Disposition, { label: string; icon: React.ReactNode; color: string }> = {
  connected: { label: "Connected", icon: <PhoneCall className="w-3.5 h-3.5" />, color: "text-emerald-400" },
  voicemail: { label: "Voicemail", icon: <Voicemail className="w-3.5 h-3.5" />, color: "text-amber-400" },
  no_answer: { label: "No Answer", icon: <PhoneMissed className="w-3.5 h-3.5" />, color: "text-red-400" },
  callback_requested: { label: "Callback Requested", icon: <Clock className="w-3.5 h-3.5" />, color: "text-blue-400" },
  not_interested: { label: "Not Interested", icon: <PhoneOff className="w-3.5 h-3.5" />, color: "text-muted-foreground" },
  converted: { label: "Converted", icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-emerald-400" },
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-500/20 text-red-400 border-red-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low: "bg-muted/40 text-muted-foreground border-border",
};

const STAGE_OPTIONS = ["Discovery", "Analysis", "Strategy", "Proposal", "Closed", "nurture"] as const;

// ─── Queue Tab ────────────────────────────────────────────────────────────────
function QueueTab() {
  const utils = trpc.useUtils();
  const { data: queue, isLoading } = trpc.callCenter.getQueue.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const [dispositionItem, setDispositionItem] = useState<number | null>(null);
  const [disposition, setDisposition] = useState<Disposition>("connected");
  const [notes, setNotes] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addClientId, setAddClientId] = useState("");
  const [addPriority, setAddPriority] = useState<"high" | "medium" | "low">("medium");
  const [addReason, setAddReason] = useState<"new_lead" | "follow_up" | "stale_deal" | "scheduled">("follow_up");

  const completeCall = trpc.callCenter.completeCall.useMutation({
    onSuccess: () => {
      utils.callCenter.getQueue.invalidate();
      utils.callCenter.getLog.invalidate();
      setDispositionItem(null);
      setNotes("");
      toast.success("Call logged.");
    },
    onError: (e) => toast.error(e.message),
  });

  const removeItem = trpc.callCenter.removeFromQueue.useMutation({
    onSuccess: () => { utils.callCenter.getQueue.invalidate(); toast.success("Removed from queue."); },
    onError: (e) => toast.error(e.message),
  });

  const addToQueue = trpc.callCenter.addToQueue.useMutation({
    onSuccess: () => { utils.callCenter.getQueue.invalidate(); setAddOpen(false); toast.success("Added to queue."); },
    onError: (e) => toast.error(e.message),
  });

  const clientMap = new Map(clients?.map((c) => [c.id, c]) ?? []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {queue?.length ?? 0} call{queue?.length !== 1 ? "s" : ""} queued
        </p>
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add to Queue
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && (!queue || queue.length === 0) && (
        <SpectreEmptyState
          title="Queue is clear."
          spectreQuote="No calls pending. Either you're ahead of the game, or behind it."
          body="Add clients to the queue and work through them with a script ready."
          action={
            <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add to Queue
            </Button>
          }
        />
      )}

      {queue?.map((item) => {
        const client = clientMap.get(item.clientId);
        return (
          <div
            key={item.id}
            className="glass-panel rounded-xl p-4 flex items-center gap-4 group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm truncate">
                  {client?.name ?? `Client #${item.clientId}`}
                </span>
                {client?.company && (
                  <span className="text-xs text-muted-foreground truncate">{client.company}</span>
                )}
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${PRIORITY_COLORS[item.priority]}`}
                >
                  {item.priority}
                </Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                  {item.reason.replace("_", " ")}
                </Badge>
              </div>
              {client?.email && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{client.email}</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* tel: click-to-call */}
              {client?.email && (
                <a
                  href={`mailto:${client.email}`}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  title="Send email"
                >
                  ✉
                </a>
              )}
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                onClick={() => setDispositionItem(item.id)}
              >
                <Phone className="w-3.5 h-3.5" /> Log Call
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 h-7 w-7"
                onClick={() => removeItem.mutate({ id: item.id })}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        );
      })}

      {/* Disposition Dialog */}
      <Dialog open={dispositionItem !== null} onOpenChange={() => setDispositionItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Call Outcome</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Disposition</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(DISPOSITION_LABELS) as Disposition[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDisposition(d)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                      disposition === d
                        ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                        : "border-border bg-muted/20 text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <span className={DISPOSITION_LABELS[d].color}>{DISPOSITION_LABELS[d].icon}</span>
                    {DISPOSITION_LABELS[d].label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Notes (optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key takeaways, next steps..."
                rows={3}
                className="resize-none"
              />
            </div>
            <Button
              onClick={() =>
                completeCall.mutate({
                  queueItemId: dispositionItem!,
                  disposition,
                  notes,
                })
              }
              disabled={completeCall.isPending}
              className="w-full"
            >
              {completeCall.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save & Remove from Queue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add to Queue Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Call Queue</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Client</label>
              <Select value={addClientId} onValueChange={setAddClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}{c.company ? ` — ${c.company}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Priority</label>
                <Select value={addPriority} onValueChange={(v) => setAddPriority(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Reason</label>
                <Select value={addReason} onValueChange={(v) => setAddReason(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new_lead">New Lead</SelectItem>
                    <SelectItem value="follow_up">Follow-Up</SelectItem>
                    <SelectItem value="stale_deal">Stale Deal</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={() => {
                if (!addClientId) { toast.error("Select a client first."); return; }
                addToQueue.mutate({ clientId: Number(addClientId), priority: addPriority, reason: addReason });
              }}
              disabled={addToQueue.isPending}
              className="w-full"
            >
              {addToQueue.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Add to Queue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Log Tab ──────────────────────────────────────────────────────────────────
function LogTab() {
  const { data: log, isLoading } = trpc.callCenter.getLog.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const clientMap = new Map(clients?.map((c) => [c.id, c]) ?? []);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  if (!log || log.length === 0) {
    return (
      <SpectreEmptyState
        title="No calls logged yet."
        spectreQuote="Every call is data. Start logging and I'll show you the patterns."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {log.map((item) => {
        const client = clientMap.get(item.clientId);
        return (
          <div key={item.id} className="glass-panel rounded-xl p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm truncate">
                  {client?.name ?? `Client #${item.clientId}`}
                </span>
                {client?.company && (
                  <span className="text-xs text-muted-foreground">{client.company}</span>
                )}
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${PRIORITY_COLORS[item.priority]}`}>
                  {item.priority}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.completedAt ? new Date(item.completedAt).toLocaleString() : "—"}
              </p>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
        );
      })}
    </div>
  );
}

// ─── Scripts Tab ──────────────────────────────────────────────────────────────
function ScriptsTab() {
  const utils = trpc.useUtils();
  const { data: scripts, isLoading } = trpc.callCenter.getScripts.useQuery();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [genClientName, setGenClientName] = useState("");
  const [genCompany, setGenCompany] = useState("");
  const [genStage, setGenStage] = useState<typeof STAGE_OPTIONS[number]>("Discovery");
  const [genContext, setGenContext] = useState("");

  const deleteScript = trpc.callCenter.deleteScript.useMutation({
    onSuccess: () => { utils.callCenter.getScripts.invalidate(); toast.success("Script deleted."); },
    onError: (e) => toast.error(e.message),
  });

  const generateScript = trpc.callCenter.generateScript.useMutation({
    onSuccess: (data) => {
      utils.callCenter.getScripts.invalidate();
      setGenerateOpen(false);
      setGenClientName(""); setGenCompany(""); setGenContext("");
      toast.success(`Ghost generated: "${data.name}"`);
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{scripts?.length ?? 0} script{scripts?.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => setGenerateOpen(true)} className="gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20">
          <Sparkles className="w-3.5 h-3.5" /> Generate with Ghost
        </Button>
      </div>

      {!isLoading && (!scripts || scripts.length === 0) && (
        <SpectreEmptyState
          title="No scripts yet."
          spectreQuote="A script is a weapon. Let me build one for you."
          action={
            <Button size="sm" onClick={() => setGenerateOpen(true)} className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Generate with Ghost
            </Button>
          }
        />
      )}

      {scripts?.map((script) => (
        <div key={script.id} className="glass-panel rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
            onClick={() => setExpanded(expanded === script.id ? null : script.id)}
          >
            <FileText className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm truncate">{script.name}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                  {script.pipelineStage}
                </Badge>
                {script.isAiGenerated && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-400 border-amber-500/30">
                    Ghost
                  </Badge>
                )}
                {script.isBuiltIn && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-blue-400 border-blue-500/30">
                    Built-in
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!script.isBuiltIn && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteScript.mutate({ id: script.id }); }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 p-1 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              {expanded === script.id ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </div>
          </button>

          {expanded === script.id && (
            <div className="px-4 pb-4 border-t border-border/40 pt-4 flex flex-col gap-4">
              {script.openingLines && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-amber-400/70 mb-1.5">Opening</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{script.openingLines}</p>
                </div>
              )}
              {Array.isArray(script.talkingPoints) && (script.talkingPoints as string[]).length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-amber-400/70 mb-1.5">Talking Points</p>
                  <ul className="flex flex-col gap-1.5">
                    {(script.talkingPoints as string[]).map((pt, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                        <span className="text-amber-400 mt-0.5 shrink-0">›</span> {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(script.objectionHandlers) && (script.objectionHandlers as any[]).length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-amber-400/70 mb-1.5">Objection Handlers</p>
                  <div className="flex flex-col gap-2">
                    {(script.objectionHandlers as { objection: string; response: string }[]).map((oh, i) => (
                      <div key={i} className="rounded-lg bg-muted/20 border border-border/40 p-3">
                        <p className="text-xs font-semibold text-red-400 mb-1 flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3" /> {oh.objection}
                        </p>
                        <p className="text-sm text-foreground/80">{oh.response}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {script.closingLines && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-amber-400/70 mb-1.5">Closing</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{script.closingLines}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Generate Script Dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Generate Script with Ghost
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Client Name *</label>
                <Input value={genClientName} onChange={(e) => setGenClientName(e.target.value)} placeholder="Alex Rivera" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Company</label>
                <Input value={genCompany} onChange={(e) => setGenCompany(e.target.value)} placeholder="Acme Corp" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Pipeline Stage</label>
              <Select value={genStage} onValueChange={(v) => setGenStage(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Context (optional)</label>
              <Textarea
                value={genContext}
                onChange={(e) => setGenContext(e.target.value)}
                placeholder="What's the deal about? Any pain points or prior conversations?"
                rows={3}
                className="resize-none"
              />
            </div>
            <Button
              onClick={() => {
                if (!genClientName.trim()) { toast.error("Client name is required."); return; }
                generateScript.mutate({
                  clientName: genClientName.trim(),
                  companyName: genCompany.trim() || undefined,
                  pipelineStage: genStage,
                  context: genContext.trim() || undefined,
                });
              }}
              disabled={generateScript.isPending}
              className="w-full"
            >
              {generateScript.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Ghost is writing...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Generate Script</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CallCenter() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Call Center</h1>
            <p className="text-sm text-muted-foreground">Queue, log, and script every conversation.</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="queue" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="queue" className="gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Queue
            </TabsTrigger>
            <TabsTrigger value="log" className="gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Log
            </TabsTrigger>
            <TabsTrigger value="scripts" className="gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Scripts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queue">
            <QueueTab />
          </TabsContent>
          <TabsContent value="log">
            <LogTab />
          </TabsContent>
          <TabsContent value="scripts">
            <ScriptsTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
