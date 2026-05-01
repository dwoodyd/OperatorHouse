import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Play,
  Zap,
  Clock,
  GitBranch,
  MousePointerClick,
  Loader2,
  CheckCircle2,
  Activity,
} from "lucide-react";

const NODE_TYPE_ICONS: Record<string, React.ReactNode> = {
  trigger: <Zap className="w-4 h-4 text-amber-400" />,
  action: <MousePointerClick className="w-4 h-4 text-blue-400" />,
  condition: <GitBranch className="w-4 h-4 text-violet-400" />,
  delay: <Clock className="w-4 h-4 text-zinc-400" />,
};

const NODE_TYPE_COLORS: Record<string, string> = {
  trigger: "border-amber-500/30 bg-amber-500/5",
  action: "border-blue-500/30 bg-blue-500/5",
  condition: "border-violet-500/30 bg-violet-500/5",
  delay: "border-zinc-600 bg-zinc-800",
};

type NodeType = "trigger" | "action" | "condition" | "delay";

interface WorkflowNode {
  nodeType: NodeType;
  actionType: string;
  label: string;
  config?: Record<string, unknown>;
  positionX: number;
  positionY: number;
}

export default function WorkflowEditor() {
  const params = useParams<{ id: string }>();
  const workflowId = parseInt(params.id ?? "0");
  const [, navigate] = useLocation();
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [initialized, setInitialized] = useState(false);

  const { data: workflow, isLoading: wfLoading } = trpc.automations.get.useQuery(
    { id: workflowId },
    { enabled: !!workflowId }
  );

  const { data: existingNodes, isLoading: nodesLoading } = trpc.automations.getNodes.useQuery(
    { workflowId },
    { enabled: !!workflowId }
  );

  useEffect(() => {
    if (existingNodes && !initialized) {
      setNodes(
        existingNodes.map((n) => ({
          nodeType: n.nodeType as NodeType,
          actionType: n.actionType ?? "",
          label: n.label ?? "",
          config: (n.config as Record<string, unknown>) ?? {},
          positionX: n.positionX ?? 0,
          positionY: n.positionY ?? 0,
        }))
      );
      setInitialized(true);
    }
  }, [existingNodes, initialized]);

  const { data: triggerTypes } = trpc.automations.getTriggerTypes.useQuery();
  const { data: actionTypes } = trpc.automations.getActionTypes.useQuery();
  const { data: executions } = trpc.automations.listExecutions.useQuery(
    { workflowId, limit: 10 },
    { enabled: !!workflowId }
  );

  const saveNodes = trpc.automations.saveNodes.useMutation({
    onSuccess: () => toast.success("Workflow saved"),
    onError: (e) => toast.error(e.message),
  });

  const triggerManual = trpc.automations.triggerManual.useMutation({
    onSuccess: () => toast.success("Workflow triggered manually"),
    onError: (e) => toast.error(e.message),
  });

  const setStatus = trpc.automations.setStatus.useMutation({
    onSuccess: () => toast.success("Status updated"),
    onError: (e) => toast.error(e.message),
  });

  const addNode = (type: NodeType) => {
    setNodes((prev) => [
      ...prev,
      {
        nodeType: type,
        actionType: type === "trigger" ? "manual" : type === "delay" ? "wait_delay" : "send_email",
        label: type === "trigger" ? "Trigger" : type === "delay" ? "Wait" : type === "condition" ? "Condition" : "Action",
        config: {},
        positionX: 100,
        positionY: prev.length * 130 + 50,
      },
    ]);
  };

  const removeNode = (idx: number) => {
    setNodes((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateNode = (idx: number, updates: Partial<WorkflowNode>) => {
    setNodes((prev) => prev.map((n, i) => (i === idx ? { ...n, ...updates } : n)));
  };

  if (wfLoading || nodesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="p-6 text-center">
        <p className="text-zinc-400">Workflow not found</p>
        <Button variant="ghost" onClick={() => navigate("/automations")} className="mt-3 text-zinc-400">
          Back to Automations
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/automations")}
            className="text-zinc-400 hover:text-ivory"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-ivory">{workflow.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge
                variant="outline"
                className={
                  workflow.status === "active"
                    ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10 text-xs"
                    : "text-zinc-400 border-zinc-600 bg-zinc-800 text-xs"
                }
              >
                {workflow.status}
              </Badge>
              <span className="text-zinc-500 text-xs">
                Trigger: {workflow.triggerType.replace(/_/g, " ")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setStatus.mutate({
                id: workflowId,
                status: workflow.status === "active" ? "paused" : "active",
              })
            }
            disabled={setStatus.isPending}
            className="border-zinc-700 text-ivory hover:bg-zinc-800 text-xs"
          >
            {workflow.status === "active" ? "Pause" : "Activate"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerManual.mutate({ workflowId })}
            disabled={triggerManual.isPending}
            className="border-zinc-700 text-ivory hover:bg-zinc-800 text-xs gap-1"
          >
            {triggerManual.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Activity className="w-3.5 h-3.5" />
            )}
            Test Run
          </Button>
          <Button
            size="sm"
            onClick={() => saveNodes.mutate({ workflowId, nodes })}
            disabled={saveNodes.isPending}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs"
          >
            {saveNodes.isPending ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />Saving...</>
            ) : (
              <><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Save</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Node Builder */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-ivory font-semibold text-sm">Workflow Steps</h2>
            <div className="flex items-center gap-1.5">
              {(["trigger", "action", "condition", "delay"] as NodeType[]).map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant="outline"
                  onClick={() => addNode(type)}
                  className="h-7 px-2 border-zinc-700 text-zinc-400 hover:text-ivory hover:bg-zinc-800 text-xs gap-1"
                >
                  <Plus className="w-3 h-3" />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {nodes.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-zinc-700 rounded-xl">
              <Zap className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400 text-sm">No steps yet</p>
              <p className="text-zinc-600 text-xs mt-1">
                Add a Trigger to start, then chain Actions
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {nodes.map((node, idx) => (
                <div key={idx} className="relative">
                  {/* Connector line */}
                  {idx < nodes.length - 1 && (
                    <div className="absolute left-6 top-full w-0.5 h-2 bg-zinc-700 z-10" />
                  )}
                  <Card className={`border ${NODE_TYPE_COLORS[node.nodeType]}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{NODE_TYPE_ICONS[node.nodeType]}</div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500 text-xs uppercase tracking-wide">
                              {node.nodeType}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-zinc-500 text-xs">Label</Label>
                              <Input
                                value={node.label}
                                onChange={(e) => updateNode(idx, { label: e.target.value })}
                                className="h-7 text-xs bg-zinc-900 border-zinc-700 text-ivory"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-zinc-500 text-xs">
                                {node.nodeType === "trigger" ? "Trigger Type" : "Action Type"}
                              </Label>
                              <Select
                                value={node.actionType}
                                onValueChange={(v) => updateNode(idx, { actionType: v })}
                              >
                                <SelectTrigger className="h-7 text-xs bg-zinc-900 border-zinc-700 text-ivory">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700 max-h-48">
                                  {node.nodeType === "trigger"
                                    ? triggerTypes?.map((t) => (
                                        <SelectItem key={t.id} value={t.id} className="text-xs">
                                          {t.label}
                                        </SelectItem>
                                      ))
                                    : actionTypes?.map((a) => (
                                        <SelectItem key={a.id} value={a.id} className="text-xs">
                                          {a.label}
                                        </SelectItem>
                                      ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeNode(idx)}
                          className="h-7 w-7 p-0 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Execution History */}
        <div className="space-y-3">
          <h2 className="text-ivory font-semibold text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-zinc-400" />
            Run History
          </h2>
          {!executions || executions.length === 0 ? (
            <div className="text-center py-8 bg-zinc-900 rounded-lg border border-zinc-800">
              <p className="text-zinc-500 text-xs">No runs yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {executions.map((exec) => (
                <div
                  key={exec.id}
                  className="p-3 bg-zinc-900 rounded-lg border border-zinc-800"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge
                      variant="outline"
                      className={
                        exec.status === "completed"
                          ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10 text-xs"
                          : exec.status === "failed"
                          ? "text-red-400 border-red-500/20 bg-red-500/10 text-xs"
                          : "text-amber-400 border-amber-500/20 bg-amber-500/10 text-xs"
                      }
                    >
                      {exec.status}
                    </Badge>
                    <span className="text-zinc-600 text-xs">
                      {new Date(exec.startedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {exec.errorMessage && (
                    <p className="text-red-400 text-xs mt-1 line-clamp-2">{exec.errorMessage}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
