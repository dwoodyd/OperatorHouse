import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Linkedin,
  Plus,
  Users,
  MessageSquare,
  TrendingUp,
  Copy,
  CheckCircle2,
  Clock,
  ChevronRight,
  Trash2,
  Edit3,
  Zap,
  Target,
  BarChart3,
  Send,
  UserCheck,
  AlertCircle,
} from "lucide-react";

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-500/20 text-slate-300",
  requested: "bg-blue-500/20 text-blue-300",
  accepted: "bg-emerald-500/20 text-emerald-300",
  messaged: "bg-violet-500/20 text-violet-300",
  replied: "bg-amber-500/20 text-amber-300",
  converted: "bg-green-500/20 text-green-300",
  withdrawn: "bg-red-500/20 text-red-300",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  requested: "Request Sent",
  accepted: "Accepted",
  messaged: "Messaged",
  replied: "Replied",
  converted: "Converted",
  withdrawn: "Withdrawn",
};
const CAMPAIGN_STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-500/20 text-slate-300",
  active: "bg-emerald-500/20 text-emerald-300",
  paused: "bg-amber-500/20 text-amber-300",
  completed: "bg-blue-500/20 text-blue-300",
};

// ─── Analytics Banner ─────────────────────────────────────────────────────────
function AnalyticsBanner() {
  const { data } = trpc.linkedin.analytics.summary.useQuery();
  if (!data) return null;
  const stats = [
    { label: "Campaigns", value: data.totalCampaigns, icon: Target },
    { label: "Connections", value: data.totalConnections, icon: Users },
    { label: "Requests Sent", value: data.totalSent, icon: Send },
    { label: "Accepted", value: data.totalAccepted, icon: UserCheck },
    { label: "Replied", value: data.totalReplied, icon: MessageSquare },
    { label: "Acceptance Rate", value: `${data.acceptanceRate}%`, icon: TrendingUp },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {stats.map((s) => (
        <Card key={s.label} className="bg-card/50 border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <div className="text-xl font-bold">{s.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Create Campaign Dialog ───────────────────────────────────────────────────
function CreateCampaignDialog({ onCreated }: { onCreated: (id: number) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [dailyLimit, setDailyLimit] = useState("15");
  const utils = trpc.useUtils();

  const { data: templates } = trpc.linkedin.campaigns.getTemplates.useQuery();
  const create = trpc.linkedin.campaigns.create.useMutation({
    onSuccess: (data) => {
      utils.linkedin.campaigns.list.invalidate();
      utils.linkedin.analytics.summary.invalidate();
      toast.success("Campaign created");
      setOpen(false);
      setName(""); setDescription(""); setTargetAudience("");
      onCreated(data.id);
    },
    onError: (e) => toast.error(e.message),
  });
  const createFromTemplate = trpc.linkedin.campaigns.createFromTemplate.useMutation({
    onSuccess: (data) => {
      utils.linkedin.campaigns.list.invalidate();
      utils.linkedin.analytics.summary.invalidate();
      toast.success("Campaign created from template");
      setOpen(false);
      onCreated(data.id);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create LinkedIn Campaign</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="blank">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="blank" className="flex-1">Blank Campaign</TabsTrigger>
            <TabsTrigger value="template" className="flex-1">Use Template</TabsTrigger>
          </TabsList>
          <TabsContent value="blank" className="space-y-4">
            <div className="space-y-2">
              <Label>Campaign Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., AI Automation — Q3 Outreach"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's the goal of this campaign?"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Textarea
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g., Founders and COOs at 10-50 person SaaS companies in the US"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Daily Connection Request Limit</Label>
              <Select value={dailyLimit} onValueChange={setDailyLimit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 / day (safest)</SelectItem>
                  <SelectItem value="10">10 / day</SelectItem>
                  <SelectItem value="15">15 / day (recommended)</SelectItem>
                  <SelectItem value="20">20 / day (max safe)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">LinkedIn recommends staying under 20/day to avoid restrictions.</p>
            </div>
            <Button
              className="w-full"
              disabled={!name.trim() || create.isPending}
              onClick={() => create.mutate({ name, description, targetAudience, dailyLimit: parseInt(dailyLimit) })}
            >
              {create.isPending ? "Creating..." : "Create Campaign"}
            </Button>
          </TabsContent>
          <TabsContent value="template" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Pre-built Soul Engineer sequences — your voice, ready to personalize.
            </p>
            {templates?.map((t) => (
              <Card
                key={t.index}
                className="cursor-pointer hover:border-primary/50 transition-colors border-border/50"
                onClick={() => createFromTemplate.mutate({ templateIndex: t.index })}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div>
                      <div className="text-xs text-muted-foreground mt-1 italic">{t.targetAudience}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs">{t.stepCount} steps</Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Connection Dialog ────────────────────────────────────────────────────
function AddConnectionDialog({ campaignId, onAdded }: { campaignId: number; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", title: "", company: "", linkedinUrl: "", notes: "",
  });
  const utils = trpc.useUtils();
  const add = trpc.linkedin.connections.add.useMutation({
    onSuccess: () => {
      utils.linkedin.campaigns.get.invalidate({ id: campaignId });
      utils.linkedin.analytics.summary.invalidate();
      toast.success("Connection added");
      setOpen(false);
      setForm({ firstName: "", lastName: "", title: "", company: "", linkedinUrl: "", notes: "" });
      onAdded();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-3.5 w-3.5" />
          Add Prospect
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add LinkedIn Prospect</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>First Name *</Label>
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Sarah" />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name</Label>
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Okafor" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Founder & CEO" />
          </div>
          <div className="space-y-1.5">
            <Label>Company</Label>
            <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Meridian Brand Studio" />
          </div>
          <div className="space-y-1.5">
            <Label>LinkedIn URL</Label>
            <Input value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} placeholder="https://linkedin.com/in/..." />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Context, how you found them, etc." rows={2} />
          </div>
          <Button
            className="w-full"
            disabled={!form.firstName.trim() || add.isPending}
            onClick={() => add.mutate({ campaignId, ...form, linkedinUrl: form.linkedinUrl || undefined })}
          >
            {add.isPending ? "Adding..." : "Add Prospect"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Message Composer ─────────────────────────────────────────────────────────
function MessageComposer({ connectionId, campaignId }: { connectionId: number; campaignId: number }) {
  const [stepOrder, setStepOrder] = useState(1);
  const [copied, setCopied] = useState(false);
  const utils = trpc.useUtils();

  const { data: campaign } = trpc.linkedin.campaigns.get.useQuery({ id: campaignId });
  const { data: msg, isLoading } = trpc.linkedin.connections.generateMessage.useQuery(
    { connectionId, stepOrder },
    { enabled: !!connectionId }
  );
  const logMessage = trpc.linkedin.connections.logMessage.useMutation({
    onSuccess: () => {
      utils.linkedin.campaigns.get.invalidate({ id: campaignId });
      utils.linkedin.analytics.summary.invalidate();
      toast.success("Message logged — now paste it into LinkedIn");
    },
    onError: (e) => toast.error(e.message),
  });

  const steps = campaign?.steps ?? [];
  const maxStep = steps.length;

  const handleCopy = () => {
    if (!msg?.message) return;
    navigator.clipboard.writeText(msg.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogAndCopy = () => {
    if (!msg?.message) return;
    navigator.clipboard.writeText(msg.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    logMessage.mutate({ connectionId, stepOrder, messageText: msg.message });
  };

  return (
    <div className="space-y-3">
      {maxStep > 1 && (
        <div className="flex gap-1.5 flex-wrap">
          {steps.map((s) => (
            <Button
              key={s.stepOrder}
              variant={stepOrder === s.stepOrder ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => setStepOrder(s.stepOrder)}
            >
              Step {s.stepOrder}: {s.stepType === "connection_request" ? "Connect" : `Follow-up (Day ${s.delayDays})`}
            </Button>
          ))}
        </div>
      )}
      {isLoading ? (
        <div className="text-sm text-muted-foreground animate-pulse">Generating message...</div>
      ) : msg ? (
        <div className="space-y-2">
          <div className="relative">
            <Textarea
              value={msg.message}
              readOnly
              rows={6}
              className="text-sm font-mono resize-none bg-muted/30"
            />
            <div className="absolute top-2 right-2 flex items-center gap-1">
              {msg.stepType === "connection_request" && (
                <Badge
                  variant="outline"
                  className={`text-xs ${msg.isOverLimit ? "border-red-500 text-red-400" : "border-emerald-500 text-emerald-400"}`}
                >
                  {msg.characterCount}/300
                </Badge>
              )}
            </div>
          </div>
          {msg.isOverLimit && (
            <div className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="h-3.5 w-3.5" />
              Connection request note exceeds 300 characters — edit the template to shorten it.
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopy}>
              {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button size="sm" className="gap-1.5" onClick={handleLogAndCopy} disabled={logMessage.isPending}>
              <Send className="h-3.5 w-3.5" />
              Copy & Log as Sent
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Connection Row ───────────────────────────────────────────────────────────
function ConnectionRow({
  conn,
  campaignId,
  onRefresh,
}: {
  conn: {
    id: number; firstName: string; lastName?: string | null; title?: string | null;
    company?: string | null; linkedinUrl?: string | null; status: string;
    currentStep: number; notes?: string | null;
  };
  campaignId: number;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const utils = trpc.useUtils();
  const updateStatus = trpc.linkedin.connections.updateStatus.useMutation({
    onSuccess: () => { utils.linkedin.campaigns.get.invalidate({ id: campaignId }); utils.linkedin.analytics.summary.invalidate(); onRefresh(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteConn = trpc.linkedin.connections.delete.useMutation({
    onSuccess: () => { utils.linkedin.campaigns.get.invalidate({ id: campaignId }); utils.linkedin.analytics.summary.invalidate(); toast.success("Removed"); },
    onError: (e) => toast.error(e.message),
  });

  const fullName = [conn.firstName, conn.lastName].filter(Boolean).join(" ");

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{fullName}</span>
            {conn.linkedinUrl && (
              <a
                href={conn.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
                onClick={(e) => e.stopPropagation()}
              >
                <Linkedin className="h-3.5 w-3.5" />
              </a>
            )}
            <Badge className={`text-xs ${STATUS_COLORS[conn.status] ?? ""}`}>
              {STATUS_LABELS[conn.status] ?? conn.status}
            </Badge>
          </div>
          {(conn.title || conn.company) && (
            <div className="text-xs text-muted-foreground mt-0.5">
              {[conn.title, conn.company].filter(Boolean).join(" @ ")}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Select
            value={conn.status}
            onValueChange={(v) => updateStatus.mutate({ id: conn.id, status: v as "pending" | "requested" | "accepted" | "messaged" | "replied" | "converted" | "withdrawn" })}
          >
            <SelectTrigger className="h-7 text-xs w-36" onClick={(e) => e.stopPropagation()}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-red-400"
            onClick={(e) => { e.stopPropagation(); deleteConn.mutate({ id: conn.id }); }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </div>
      {expanded && (
        <div className="border-t border-border/50 p-4 bg-muted/10">
          {conn.notes && (
            <p className="text-xs text-muted-foreground mb-3 italic">{conn.notes}</p>
          )}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Message Composer</div>
            <MessageComposer connectionId={conn.id} campaignId={campaignId} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Campaign Detail Panel ────────────────────────────────────────────────────
function CampaignDetail({ campaignId, onBack }: { campaignId: number; onBack: () => void }) {
  const utils = trpc.useUtils();
  const { data: campaign, isLoading } = trpc.linkedin.campaigns.get.useQuery({ id: campaignId });
  const updateCampaign = trpc.linkedin.campaigns.update.useMutation({
    onSuccess: () => { utils.linkedin.campaigns.get.invalidate({ id: campaignId }); utils.linkedin.campaigns.list.invalidate(); },
  });
  const deleteCampaign = trpc.linkedin.campaigns.delete.useMutation({
    onSuccess: () => { utils.linkedin.campaigns.list.invalidate(); utils.linkedin.analytics.summary.invalidate(); onBack(); toast.success("Campaign deleted"); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground p-4 animate-pulse">Loading campaign...</div>;
  if (!campaign) return null;

  const statusCycle: Array<"draft" | "active" | "paused" | "completed"> = ["draft", "active", "paused", "completed"];
  const nextStatus = statusCycle[(statusCycle.indexOf(campaign.status as typeof statusCycle[0]) + 1) % statusCycle.length];

  const byStatus = campaign.connections.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="mt-0.5 text-muted-foreground">
          ← Back
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">{campaign.name}</h2>
            <Badge className={`text-xs ${CAMPAIGN_STATUS_COLORS[campaign.status] ?? ""}`}>
              {campaign.status}
            </Badge>
          </div>
          {campaign.description && <p className="text-sm text-muted-foreground mt-0.5">{campaign.description}</p>}
          {campaign.targetAudience && (
            <p className="text-xs text-muted-foreground mt-1 italic">Target: {campaign.targetAudience}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateCampaign.mutate({ id: campaignId, status: nextStatus })}
          >
            {campaign.status === "active" ? "Pause" : campaign.status === "paused" ? "Resume" : campaign.status === "draft" ? "Activate" : "Reopen"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-red-400"
            onClick={() => { if (confirm("Delete this campaign and all its connections?")) deleteCampaign.mutate({ id: campaignId }); }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <div key={status} className="text-center p-2 rounded-lg bg-muted/20 border border-border/30">
            <div className="text-lg font-bold">{byStatus[status] ?? 0}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Sequence Steps */}
      {campaign.steps.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Sequence ({campaign.steps.length} steps)</div>
          <div className="space-y-2">
            {campaign.steps.map((step) => (
              <div key={step.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {step.stepOrder}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {step.stepType === "connection_request" ? "Connection Request" : `Follow-up (Day ${step.delayDays})`}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{step.messageTemplate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connections */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Prospects ({campaign.connections.length})
          </div>
          <AddConnectionDialog campaignId={campaignId} onAdded={() => utils.linkedin.campaigns.get.invalidate({ id: campaignId })} />
        </div>
        {campaign.connections.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No prospects yet — add your first one above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {campaign.connections.map((conn) => (
              <ConnectionRow
                key={conn.id}
                conn={conn}
                campaignId={campaignId}
                onRefresh={() => utils.linkedin.campaigns.get.invalidate({ id: campaignId })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Campaign List ────────────────────────────────────────────────────────────
function CampaignList({ onSelect }: { onSelect: (id: number) => void }) {
  const { data: campaigns, isLoading } = trpc.linkedin.campaigns.list.useQuery();

  if (isLoading) return <div className="text-sm text-muted-foreground animate-pulse p-4">Loading campaigns...</div>;
  if (!campaigns?.length) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Linkedin className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-base font-medium mb-1">No campaigns yet</p>
        <p className="text-sm">Create your first LinkedIn outreach campaign above.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {campaigns.map((c) => {
        const acceptanceRate = c.totalSent > 0 ? Math.round((c.totalAccepted / c.totalSent) * 100) : 0;
        return (
          <Card
            key={c.id}
            className="cursor-pointer hover:border-primary/50 transition-colors border-border/50 bg-card/50"
            onClick={() => onSelect(c.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm font-semibold leading-tight">{c.name}</CardTitle>
                <Badge className={`text-xs shrink-0 ${CAMPAIGN_STATUS_COLORS[c.status] ?? ""}`}>
                  {c.status}
                </Badge>
              </div>
              {c.description && (
                <CardDescription className="text-xs line-clamp-2">{c.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div>
                  <div className="text-sm font-bold">{c.connectionCount}</div>
                  <div className="text-xs text-muted-foreground">Prospects</div>
                </div>
                <div>
                  <div className="text-sm font-bold">{c.totalSent}</div>
                  <div className="text-xs text-muted-foreground">Sent</div>
                </div>
                <div>
                  <div className="text-sm font-bold">{acceptanceRate}%</div>
                  <div className="text-xs text-muted-foreground">Accepted</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{c.steps.length} sequence steps</span>
                <span>Limit: {c.dailyLimit}/day</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LinkedInOutreach() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Linkedin className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">LinkedIn Outreach</h1>
            <p className="text-sm text-muted-foreground">
              Campaign manager + message composer. Copy messages, paste into LinkedIn.
            </p>
          </div>
        </div>
        {!selectedCampaignId && (
          <CreateCampaignDialog onCreated={(id) => setSelectedCampaignId(id)} />
        )}
      </div>

      {/* How it works banner */}
      {!selectedCampaignId && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Zap className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">How this works: </span>
                LinkedIn doesn't allow automated sending. This tool composes personalized messages from your templates,
                you copy them with one click, then paste into LinkedIn. Status is tracked manually so you always know
                where each prospect stands.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics */}
      <AnalyticsBanner />

      {/* Main Content */}
      {selectedCampaignId ? (
        <CampaignDetail campaignId={selectedCampaignId} onBack={() => setSelectedCampaignId(null)} />
      ) : (
        <CampaignList onSelect={setSelectedCampaignId} />
      )}
    </div>
  );
}
