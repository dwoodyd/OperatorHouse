import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Zap,
  Play,
  Pause,
  Trash2,
  Settings2,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  LayoutTemplate,
  ChevronRight,
  Activity,
} from "lucide-react";
import { SkeletonCards } from "@/components/StateUI";
import AppLayout from "@/components/AppLayout";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  paused: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  draft: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const TRIGGER_CATEGORY_COLORS: Record<string, string> = {
  CRM: "text-blue-400",
  Billing: "text-emerald-400",
  Scheduling: "text-violet-400",
  Funnels: "text-pink-400",
  General: "text-zinc-400",
};

// ─── Create Workflow Dialog ───────────────────────────────────────────────────
function CreateWorkflowDialog({ onCreated }: { onCreated: (id: number) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("manual");

  const { data: triggerTypes } = trpc.automations.getTriggerTypes.useQuery();

  const create = trpc.automations.create.useMutation({
    onSuccess: (data) => {
      toast.success("Workflow created");
      setOpen(false);
      setName("");
      setDescription("");
      onCreated(data.id as number);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-zinc-700 text-ivory hover:bg-zinc-800">
          <Plus className="w-4 h-4" />
          New Workflow
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-ivory">Create Workflow</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-zinc-400 text-xs">Workflow Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. New Lead Follow-Up"
              className="bg-zinc-800 border-zinc-700 text-ivory"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-zinc-400 text-xs">Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this workflow do?"
              className="bg-zinc-800 border-zinc-700 text-ivory resize-none"
              rows={2}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-zinc-400 text-xs">Trigger</Label>
            <Select value={triggerType} onValueChange={setTriggerType}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-ivory">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 max-h-60">
                {triggerTypes?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className={TRIGGER_CATEGORY_COLORS[t.category] ?? "text-zinc-400"}>
                      [{t.category}]
                    </span>{" "}
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => create.mutate({ name, triggerType, description: description || undefined })}
            disabled={!name.trim() || create.isPending}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          >
            {create.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating...</>
            ) : (
              <><Zap className="w-4 h-4 mr-2" />Create Workflow</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Templates Dialog ─────────────────────────────────────────────────────────
function TemplatesDialog({ onCreated }: { onCreated: (id: number) => void }) {
  const [open, setOpen] = useState(false);
  const { data: templates } = trpc.automations.getTemplates.useQuery();

  const createFromTemplate = trpc.automations.createFromTemplate.useMutation({
    onSuccess: (data) => {
      toast.success("Workflow created from template");
      setOpen(false);
      onCreated(data.id as number);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
          <LayoutTemplate className="w-4 h-4" />
          Use Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-ivory flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-violet-400" />
            Workflow Templates
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 mt-2">
          {templates?.map((t) => (
            <div
              key={t.id}
              className="p-4 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-ivory font-medium text-sm">{t.name}</h3>
                  <p className="text-zinc-400 text-xs mt-0.5">{t.description}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-zinc-500 text-xs">Trigger:</span>
                    <span className="text-amber-400 text-xs">{t.triggerType.replace(/_/g, " ")}</span>
                    <span className="text-zinc-600 text-xs mx-1">·</span>
                    <span className="text-zinc-500 text-xs">{t.nodes.length} steps</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => createFromTemplate.mutate({ templateId: t.id })}
                  disabled={createFromTemplate.isPending}
                  className="bg-violet-600 hover:bg-violet-700 text-white shrink-0"
                >
                  {createFromTemplate.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>Use<ChevronRight className="w-3.5 h-3.5 ml-1" /></>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Workflow Card ────────────────────────────────────────────────────────────
function WorkflowCard({
  workflow,
  onUpdate,
  onEdit,
}: {
  workflow: {
    id: number;
    name: string;
    description: string | null;
    status: string;
    triggerType: string;
    executionCount: number;
    successCount: number;
    failureCount: number;
    lastExecutedAt: Date | null;
  };
  onUpdate: () => void;
  onEdit: (id: number) => void;
}) {
  const setStatus = trpc.automations.setStatus.useMutation({
    onSuccess: () => {
      toast.success(`Workflow ${workflow.status === "active" ? "paused" : "activated"}`);
      onUpdate();
    },
    onError: (e) => toast.error(e.message),
  });

  const triggerManual = trpc.automations.triggerManual.useMutation({
    onSuccess: () => {
      toast.success("Workflow triggered manually");
      onUpdate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteWorkflow = trpc.automations.delete.useMutation({
    onSuccess: () => {
      toast.success("Workflow deleted");
      onUpdate();
    },
    onError: (e) => toast.error(e.message),
  });

  const successRate =
    workflow.executionCount > 0
      ? Math.round((workflow.successCount / workflow.executionCount) * 100)
      : null;

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-ivory font-semibold text-sm truncate">{workflow.name}</h3>
              <Badge
                variant="outline"
                className={`text-xs shrink-0 ${STATUS_COLORS[workflow.status] ?? ""}`}
              >
                {workflow.status}
              </Badge>
            </div>
            {workflow.description && (
              <p className="text-zinc-500 text-xs line-clamp-1">{workflow.description}</p>
            )}
            <div className="flex items-center gap-1 mt-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-zinc-400 text-xs">
                {workflow.triggerType.replace(/_/g, " ")}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-zinc-800 rounded-md p-2 text-center">
            <p className="text-ivory text-sm font-bold">{workflow.executionCount}</p>
            <p className="text-zinc-500 text-xs">Runs</p>
          </div>
          <div className="bg-zinc-800 rounded-md p-2 text-center">
            <p className="text-emerald-400 text-sm font-bold">
              {successRate !== null ? `${successRate}%` : "—"}
            </p>
            <p className="text-zinc-500 text-xs">Success</p>
          </div>
          <div className="bg-zinc-800 rounded-md p-2 text-center">
            <p className="text-red-400 text-sm font-bold">{workflow.failureCount}</p>
            <p className="text-zinc-500 text-xs">Errors</p>
          </div>
        </div>

        {workflow.lastExecutedAt && (
          <p className="text-zinc-600 text-xs mb-3 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last run: {new Date(workflow.lastExecutedAt).toLocaleDateString()}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              setStatus.mutate({
                id: workflow.id,
                status: workflow.status === "active" ? "paused" : "active",
              })
            }
            disabled={setStatus.isPending}
            className={`flex-1 h-8 text-xs ${
              workflow.status === "active"
                ? "text-amber-400 hover:bg-amber-500/10"
                : "text-emerald-400 hover:bg-emerald-500/10"
            }`}
          >
            {workflow.status === "active" ? (
              <><Pause className="w-3.5 h-3.5 mr-1" />Pause</>
            ) : (
              <><Play className="w-3.5 h-3.5 mr-1" />Activate</>
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => triggerManual.mutate({ workflowId: workflow.id })}
            disabled={triggerManual.isPending}
            className="h-8 text-xs text-zinc-400 hover:text-ivory hover:bg-zinc-800"
            title="Trigger manually"
          >
            {triggerManual.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Activity className="w-3.5 h-3.5" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(workflow.id)}
            className="h-8 text-xs text-zinc-400 hover:text-ivory hover:bg-zinc-800"
            title="Edit workflow"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteWorkflow.mutate({ id: workflow.id })}
            disabled={deleteWorkflow.isPending}
            className="h-8 text-xs text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
            title="Delete workflow"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Automations Page ────────────────────────────────────────────────────
export default function Automations() {
  const [, navigate] = useLocation();
  const { data: workflows, isLoading, refetch } = trpc.automations.list.useQuery();

  const stats = {
    total: workflows?.length ?? 0,
    active: workflows?.filter((w) => w.status === "active").length ?? 0,
    paused: workflows?.filter((w) => w.status === "paused").length ?? 0,
    totalRuns: workflows?.reduce((sum, w) => sum + (w.executionCount ?? 0), 0) ?? 0,
  };

  const handleCreated = (id: number) => {
    refetch();
    navigate(`/automations/${id}/edit`);
  };

  return (
    <AppLayout>
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ivory">Workflow Automations</h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            Build automated sequences that run on triggers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CreateWorkflowDialog onCreated={handleCreated} />
          <TemplatesDialog onCreated={handleCreated} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Workflows", value: stats.total, color: "text-ivory" },
          { label: "Active", value: stats.active, color: "text-emerald-400" },
          { label: "Paused", value: stats.paused, color: "text-amber-400" },
          { label: "Total Runs", value: stats.totalRuns, color: "text-violet-400" },
        ].map((s) => (
          <Card key={s.label} className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workflow Grid */}
      {isLoading ? (
        <SkeletonCards count={4} />
      ) : !workflows || workflows.length === 0 ? (
        <div className="text-center py-20">
          <Zap className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-ivory font-semibold mb-2">No workflows yet</h3>
          <p className="text-zinc-500 text-sm mb-6">
            Start with a template or create a custom workflow from scratch
          </p>
          <div className="flex items-center justify-center gap-3">
            <CreateWorkflowDialog onCreated={handleCreated} />
            <TemplatesDialog onCreated={handleCreated} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((wf) => (
            <WorkflowCard
              key={wf.id}
              workflow={wf}
              onUpdate={refetch}
              onEdit={(id) => navigate(`/automations/${id}/edit`)}
            />
          ))}
        </div>
      )}
    </div>
    </AppLayout>
  );
}
