import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SpectreEmptyState } from "@/components/StateUI";
import { toast } from "sonner";
import {
  Mail, Plus, Trash2, Play, Pause, ChevronRight, Users, Send,
  Clock, Zap, BookOpen, Settings2, CheckCircle2, XCircle, Loader2,
  TestTube, Sparkles,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type TriggerType = "manual" | "pipeline_stage_change" | "deal_closed" | "deal_stale" | "scheduled";
type SequenceStatus = "active" | "paused" | "draft";

const TRIGGER_LABELS: Record<TriggerType, string> = {
  manual: "Manual",
  pipeline_stage_change: "Pipeline Stage Change",
  deal_closed: "Deal Closed",
  deal_stale: "Deal Stale",
  scheduled: "Scheduled",
};

const STATUS_COLORS: Record<SequenceStatus, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  paused: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  draft: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

// ── Step Editor ───────────────────────────────────────────────────────────────
function StepEditor({
  step,
  index,
  onUpdate,
  onDelete,
}: {
  step: { id: number; stepOrder: number; delayDays: number; subjectTemplate: string; bodyTemplate: string; sendTimePreference: string };
  index: number;
  onUpdate: (id: number, fields: Partial<typeof step>) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="border border-border rounded-lg p-4 space-y-3 bg-card/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-bold border border-amber-500/30">
            {index + 1}
          </div>
          <span className="text-sm font-medium text-muted-foreground">Step {index + 1}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Delay:</span>
            <Input
              type="number"
              min={0}
              value={step.delayDays}
              onChange={(e) => onUpdate(step.id, { delayDays: parseInt(e.target.value) || 0 })}
              className="w-16 h-7 text-xs"
            />
            <span className="text-xs text-muted-foreground">days</span>
          </div>
          <Select
            value={step.sendTimePreference}
            onValueChange={(v) => onUpdate(step.id, { sendTimePreference: v as any })}
          >
            <SelectTrigger className="h-7 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="morning">Morning</SelectItem>
              <SelectItem value="afternoon">Afternoon</SelectItem>
              <SelectItem value="best_time">Best Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(step.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <Input
        placeholder="Subject line — use {{clientName}}, {{senderName}}"
        value={step.subjectTemplate}
        onChange={(e) => onUpdate(step.id, { subjectTemplate: e.target.value })}
        className="text-sm"
      />
      <Textarea
        placeholder="Email body — use {{clientName}}, {{senderName}}, {{clientEmail}}"
        value={step.bodyTemplate}
        onChange={(e) => onUpdate(step.id, { bodyTemplate: e.target.value })}
        rows={5}
        className="text-sm font-mono resize-none"
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EmailSequences() {
  const utils = trpc.useUtils();

  // Sequence list
  const { data: sequences, isLoading } = trpc.emailSequences.list.useQuery();
  const { data: templates } = trpc.emailSequences.getTemplates.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();

  // Selected sequence
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data: selected } = trpc.emailSequences.getWithSteps.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId }
  );
  const { data: enrollments } = trpc.emailSequences.listEnrollments.useQuery(
    { sequenceId: selectedId! },
    { enabled: !!selectedId }
  );

  // Dialogs
  const [showCreate, setShowCreate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showEnroll, setShowEnroll] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTrigger, setNewTrigger] = useState<TriggerType>("manual");
  const [enrollClientId, setEnrollClientId] = useState<string>("");
  const [testEmail, setTestEmail] = useState("");
  const [testType, setTestType] = useState<"text" | "html" | "template">("text");

  // Mutations
  const createSeq = trpc.emailSequences.create.useMutation({
    onSuccess: (data) => {
      utils.emailSequences.list.invalidate();
      setSelectedId(data.id);
      setShowCreate(false);
      setNewName("");
      toast.success("Sequence created");
    },
  });

  const seedTemplate = trpc.emailSequences.seedTemplate.useMutation({
    onSuccess: (data) => {
      utils.emailSequences.list.invalidate();
      setSelectedId(data.id);
      setShowTemplates(false);
      toast.success("Template loaded — customize the steps and activate when ready");
    },
  });

  const updateSeq = trpc.emailSequences.update.useMutation({
    onSuccess: () => {
      utils.emailSequences.list.invalidate();
      utils.emailSequences.getWithSteps.invalidate({ id: selectedId! });
    },
  });

  const deleteSeq = trpc.emailSequences.delete.useMutation({
    onSuccess: () => {
      utils.emailSequences.list.invalidate();
      setSelectedId(null);
      toast.success("Sequence deleted");
    },
  });

  const addStep = trpc.emailSequences.addStep.useMutation({
    onSuccess: () => utils.emailSequences.getWithSteps.invalidate({ id: selectedId! }),
  });

  const updateStep = trpc.emailSequences.updateStep.useMutation({
    onSuccess: () => utils.emailSequences.getWithSteps.invalidate({ id: selectedId! }),
  });

  const deleteStep = trpc.emailSequences.deleteStep.useMutation({
    onSuccess: () => utils.emailSequences.getWithSteps.invalidate({ id: selectedId! }),
  });

  const enroll = trpc.emailSequences.enroll.useMutation({
    onSuccess: () => {
      utils.emailSequences.listEnrollments.invalidate({ sequenceId: selectedId! });
      setShowEnroll(false);
      setEnrollClientId("");
      toast.success("Client enrolled in sequence");
    },
    onError: (e) => toast.error(e.message),
  });

  const unenroll = trpc.emailSequences.unenroll.useMutation({
    onSuccess: () => utils.emailSequences.listEnrollments.invalidate({ sequenceId: selectedId! }),
  });

  const sendNext = trpc.emailSequences.sendNextStep.useMutation({
    onSuccess: (data) => {
      utils.emailSequences.listEnrollments.invalidate({ sequenceId: selectedId! });
      if (data.done) toast.success("Sequence completed for this client");
      else if (data.status === "sent") toast.success(`Email sent to ${data.toEmail}`);
      else toast.error("Email failed to send — check Resend logs");
    },
  });

  const testSend = trpc.emailSequences.testSend.useMutation({
    onSuccess: (data) => {
      toast.success(`Test email sent! Message ID: ${data.messageId}`);
      setShowTest(false);
      setTestEmail("");
    },
    onError: (e) => toast.error(`Test failed: ${e.message}`),
  });

  const handleAddStep = () => {
    if (!selectedId || !selected) return;
    addStep.mutate({
      sequenceId: selectedId,
      stepOrder: (selected.steps?.length ?? 0) + 1,
      delayDays: 3,
      subjectTemplate: "Following up — {{clientName}}",
      bodyTemplate: "Hi {{clientName}},\n\n[Your message here]\n\n— {{senderName}}",
      sendTimePreference: "morning",
    });
  };

  const handleUpdateStep = (id: number, fields: any) => {
    updateStep.mutate({ id, ...fields });
  };

  const handleToggleStatus = () => {
    if (!selected) return;
    const next = selected.status === "active" ? "paused" : "active";
    updateSeq.mutate({ id: selected.id, status: next });
    toast.success(`Sequence ${next === "active" ? "activated" : "paused"}`);
  };

  return (
    <TooltipProvider>
      <div className="flex h-full min-h-0">
        {/* ── Left Panel: Sequence List ── */}
        <div className="w-72 border-r border-border flex flex-col bg-card/30 shrink-0">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-sm">Email Sequences</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{sequences?.length ?? 0} sequences</p>
            </div>
            <div className="flex gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowTest(true)}>
                    <TestTube className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Test Resend email</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowTemplates(true)}>
                    <BookOpen className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Load a pre-built template</TooltipContent>
              </Tooltip>
              <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setShowCreate(true)}>
                <Plus className="w-3.5 h-3.5" /> New
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isLoading && (!sequences || sequences.length === 0) && (
              <SpectreEmptyState
                title="No sequences yet"
                body="Build your first sequence or load a pre-built template."
                spectreQuote="Every deal needs a follow-up. Build the machine."
                action={
                  <Button size="sm" onClick={() => setShowTemplates(true)} className="gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Load Template
                  </Button>
                }
              />
            )}
            {sequences?.map((seq) => (
              <button
                key={seq.id}
                onClick={() => setSelectedId(seq.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedId === seq.id
                    ? "bg-amber-500/10 border border-amber-500/30"
                    : "hover:bg-muted/50 border border-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{seq.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {TRIGGER_LABELS[seq.triggerType as TriggerType] ?? seq.triggerType}
                    </p>
                  </div>
                  <Badge className={`text-xs shrink-0 border ${STATUS_COLORS[seq.status as SequenceStatus] ?? STATUS_COLORS.draft}`}>
                    {seq.status}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Right Panel: Sequence Editor ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center">
              <SpectreEmptyState
                title="Select a sequence"
                body="Choose a sequence from the list to edit its steps, manage enrollments, and send emails."
                spectreQuote="Consistency closes deals. Build the sequence, then let it run."
                action={
                  <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> New Sequence
                  </Button>
                }
              />
            </div>
          ) : !selected ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-amber-400" />
                  <div>
                    <h2 className="font-semibold">{selected.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {selected.steps?.length ?? 0} steps · {TRIGGER_LABELS[selected.triggerType as TriggerType]}
                    </p>
                  </div>
                  <Badge className={`border ${STATUS_COLORS[selected.status as SequenceStatus] ?? STATUS_COLORS.draft}`}>
                    {selected.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={handleToggleStatus}
                    disabled={updateSeq.isPending}
                  >
                    {selected.status === "active" ? (
                      <><Pause className="w-3.5 h-3.5" /> Pause</>
                    ) : (
                      <><Play className="w-3.5 h-3.5" /> Activate</>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteSeq.mutate({ id: selected.id })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="steps" className="flex-1 flex flex-col min-h-0">
                <TabsList className="mx-4 mt-3 w-fit shrink-0">
                  <TabsTrigger value="steps" className="gap-1.5">
                    <Settings2 className="w-3.5 h-3.5" /> Steps ({selected.steps?.length ?? 0})
                  </TabsTrigger>
                  <TabsTrigger value="enrollments" className="gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Enrolled ({enrollments?.length ?? 0})
                  </TabsTrigger>
                </TabsList>

                {/* Steps Tab */}
                <TabsContent value="steps" className="flex-1 overflow-y-auto p-4 space-y-3">
                  {(!selected.steps || selected.steps.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No steps yet. Add your first email step below.
                    </div>
                  )}
                  {selected.steps?.map((step, i) => (
                    <StepEditor
                      key={step.id}
                      step={step}
                      index={i}
                      onUpdate={handleUpdateStep}
                      onDelete={(id) => deleteStep.mutate({ id })}
                    />
                  ))}
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-dashed"
                    onClick={handleAddStep}
                    disabled={addStep.isPending}
                  >
                    <Plus className="w-4 h-4" /> Add Step
                  </Button>
                </TabsContent>

                {/* Enrollments Tab */}
                <TabsContent value="enrollments" className="flex-1 overflow-y-auto p-4">
                  <div className="flex justify-end mb-3">
                    <Button size="sm" className="gap-1.5" onClick={() => setShowEnroll(true)}>
                      <Plus className="w-3.5 h-3.5" /> Enroll Client
                    </Button>
                  </div>
                  {(!enrollments || enrollments.length === 0) && (
                    <SpectreEmptyState
                      title="No clients enrolled"
                      body="Enroll a client to start sending this sequence."
                      spectreQuote="The sequence is ready. Feed it a name."
                    />
                  )}
                  <div className="space-y-2">
                    {enrollments?.map(({ enrollment, client }) => (
                      <div
                        key={enrollment.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-bold">
                            {client?.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{client?.name ?? "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">
                              Step {enrollment.currentStep} · {enrollment.status}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {enrollment.status === "active" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5 h-7 text-xs"
                                  onClick={() => sendNext.mutate({ enrollmentId: enrollment.id })}
                                  disabled={sendNext.isPending}
                                >
                                  {sendNext.isPending ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Send className="w-3.5 h-3.5" />
                                  )}
                                  Send Next
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Send step {enrollment.currentStep + 1} now</TooltipContent>
                            </Tooltip>
                          )}
                          {enrollment.status === "completed" && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          )}
                          {enrollment.status === "active" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground"
                              onClick={() => unenroll.mutate({ enrollmentId: enrollment.id })}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      {/* ── Create Sequence Dialog ── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Sequence</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              placeholder="Sequence name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && newName.trim() && createSeq.mutate({ name: newName.trim(), triggerType: newTrigger })}
            />
            <Select value={newTrigger} onValueChange={(v) => setNewTrigger(v as TriggerType)}>
              <SelectTrigger>
                <SelectValue placeholder="Trigger type" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(TRIGGER_LABELS) as [TriggerType, string][]).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              onClick={() => createSeq.mutate({ name: newName.trim(), triggerType: newTrigger })}
              disabled={!newName.trim() || createSeq.isPending}
            >
              {createSeq.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Template Picker Dialog ── */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" /> Pre-Built Templates
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {/* Soul Engineer Templates */}
            <div>
              <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Soul Engineer AI Services
              </h3>
              <div className="space-y-2">
                {templates?.filter(t => t.isSoulEngineer).map((tpl) => (
                  <div
                    key={tpl.index}
                    className="p-4 rounded-lg border border-amber-500/20 hover:border-amber-500/50 bg-amber-500/5 cursor-pointer transition-colors"
                    onClick={() => seedTemplate.mutate({ templateIndex: tpl.index })}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm">{tpl.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{tpl.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <Badge variant="outline" className="text-xs">{tpl.stepCount} steps</Badge>
                        <Badge className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/30">
                          {TRIGGER_LABELS[tpl.triggerType as TriggerType]}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-amber-400 text-xs">
                      <ChevronRight className="w-3.5 h-3.5" /> Load this template
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* General Templates */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">General Sequences</h3>
              <div className="space-y-2">
                {templates?.filter(t => !t.isSoulEngineer).map((tpl) => (
                  <div
                    key={tpl.index}
                    className="p-4 rounded-lg border border-border hover:border-amber-500/40 bg-card/50 cursor-pointer transition-colors"
                    onClick={() => seedTemplate.mutate({ templateIndex: tpl.index })}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm">{tpl.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{tpl.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <Badge variant="outline" className="text-xs">{tpl.stepCount} steps</Badge>
                        <Badge className="text-xs bg-zinc-500/20 text-zinc-400 border-zinc-500/30">
                          {TRIGGER_LABELS[tpl.triggerType as TriggerType]}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-amber-400 text-xs">
                      <ChevronRight className="w-3.5 h-3.5" /> Load this template
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Enroll Client Dialog ── */}
      <Dialog open={showEnroll} onOpenChange={setShowEnroll}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Enroll a Client</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Select value={enrollClientId} onValueChange={setEnrollClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnroll(false)}>Cancel</Button>
            <Button
              onClick={() => enroll.mutate({ sequenceId: selectedId!, clientId: parseInt(enrollClientId) })}
              disabled={!enrollClientId || enroll.isPending}
            >
              {enroll.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enroll"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Test Email Dialog ── */}
      <Dialog open={showTest} onOpenChange={setShowTest}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TestTube className="w-4 h-4 text-amber-400" /> Test Resend Email
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Recipient Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Test Type</label>
              <Select value={testType} onValueChange={(v) => setTestType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Plain Text Email</SelectItem>
                  <SelectItem value="html">HTML Formatted Email</SelectItem>
                  <SelectItem value="template">Soul Engineer Template</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
              {testType === "text" && "Sends a simple plain text email to verify basic delivery."}
              {testType === "html" && "Sends an HTML formatted email to verify rich content delivery."}
              {testType === "template" && "Sends a sample Soul Engineer AI services outreach email."}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTest(false)}>Cancel</Button>
            <Button
              onClick={() => testSend.mutate({ toEmail: testEmail, testType })}
              disabled={!testEmail || testSend.isPending}
            >
              {testSend.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
