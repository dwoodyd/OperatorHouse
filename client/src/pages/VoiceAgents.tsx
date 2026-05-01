import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SpectreEmptyState } from "@/components/StateUI";
import { toast } from "sonner";
import {
  Bot, Plus, Zap, Mic, BookOpen, Phone, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Clock, ThumbsUp, ThumbsDown, Minus, Trash2
} from "lucide-react";

const PERSONALITY_LABELS: Record<string, string> = {
  professional: "Professional",
  warm: "Warm",
  concise: "Concise",
  custom: "Custom",
};

const FALLBACK_LABELS: Record<string, string> = {
  voicemail: "Leave Voicemail",
  transfer: "Transfer to Human",
  schedule_callback: "Schedule Callback",
};

const SENTIMENT_ICON: Record<string, React.ReactElement> = {
  positive: <ThumbsUp className="w-3 h-3 text-emerald-400" />,
  neutral: <Minus className="w-3 h-3 text-zinc-400" />,
  negative: <ThumbsDown className="w-3 h-3 text-red-400" />,
};

const OUTCOME_BADGE: Record<string, string> = {
  resolved: "bg-emerald-900/40 text-emerald-400 border-emerald-700",
  transferred: "bg-blue-900/40 text-blue-400 border-blue-700",
  callback_scheduled: "bg-amber-900/40 text-amber-400 border-amber-700",
  voicemail: "bg-zinc-800 text-zinc-400 border-zinc-700",
};

export default function VoiceAgents() {
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [expandedCallId, setExpandedCallId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "", description: "", personality: "professional",
    greetingScript: "", fallbackAction: "voicemail", phoneNumber: "",
  });

  const utils = trpc.useUtils();
  const { data: agents = [] } = trpc.voiceAgents.listAgents.useQuery();
  const { data: calls = [] } = trpc.voiceAgents.listCalls.useQuery(
    { agentId: selectedAgentId ?? undefined },
    { enabled: true }
  );
  const { data: knowledge = [] } = trpc.voiceAgents.listKnowledge.useQuery(
    { agentId: selectedAgentId! },
    { enabled: !!selectedAgentId }
  );
  const { data: vaultItems = [] } = trpc.vault.list.useQuery();

  const createAgent = trpc.voiceAgents.createAgent.useMutation({
    onSuccess: () => {
      utils.voiceAgents.listAgents.invalidate();
      setShowCreate(false);
      setForm({ name: "", description: "", personality: "professional", greetingScript: "", fallbackAction: "voicemail", phoneNumber: "" });
      toast.success("Agent created");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateAgent = trpc.voiceAgents.updateAgent.useMutation({
    onSuccess: () => { utils.voiceAgents.listAgents.invalidate(); toast.success("Agent updated"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteAgent = trpc.voiceAgents.deleteAgent.useMutation({
    onSuccess: () => {
      utils.voiceAgents.listAgents.invalidate();
      if (selectedAgentId) setSelectedAgentId(null);
      toast.success("Agent deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const deployToVapi = trpc.voiceAgents.deployToVapi.useMutation({
    onSuccess: (data) => {
      utils.voiceAgents.listAgents.invalidate();
      if (data.success) toast.success("Agent deployed to Vapi.ai");
      else toast.error(data.message ?? "Deployment failed");
    },
    onError: (e) => toast.error(e.message),
  });

  const addKnowledge = trpc.voiceAgents.addKnowledge.useMutation({
    onSuccess: () => { utils.voiceAgents.listKnowledge.invalidate({ agentId: selectedAgentId! }); toast.success("Knowledge linked"); },
    onError: (e) => toast.error(e.message),
  });

  const removeKnowledge = trpc.voiceAgents.removeKnowledge.useMutation({
    onSuccess: () => { utils.voiceAgents.listKnowledge.invalidate({ agentId: selectedAgentId! }); },
    onError: (e) => toast.error(e.message),
  });

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-zinc-950">
      {/* Agent list */}
      <div className="w-72 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Voice Agents</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{agents.length} agent{agents.length !== 1 ? "s" : ""}</p>
          </div>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {agents.length === 0 ? (
            <div className="p-4 text-center text-zinc-600 text-sm mt-8">Loading agents…</div>
          ) : (
            agents.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAgentId(a.id)}
                className={`w-full text-left px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-900 transition-colors ${selectedAgentId === a.id ? "bg-zinc-900 border-l-2 border-l-amber-500" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${a.isActive ? "bg-emerald-400" : "bg-zinc-600"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{a.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{PERSONALITY_LABELS[a.personality]} · {FALLBACK_LABELS[a.fallbackAction]}</p>
                  </div>
                </div>
                {a.isBuiltIn && (
                  <Badge variant="outline" className="mt-1.5 text-xs border-amber-800 text-amber-500">Built-in</Badge>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Agent detail */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedAgent ? (
          <div className="flex-1 flex items-center justify-center">
            <SpectreEmptyState
              title="Select an agent"
              body="Choose an agent from the left to configure it, view call logs, and link knowledge."
              spectreQuote="Four agents standing by. Pick one and I'll brief you."
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Agent header */}
            <div className="px-6 py-5 border-b border-zinc-800">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-900/30 border border-amber-700/30 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-zinc-100">{selectedAgent.name}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{selectedAgent.description ?? "No description"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-zinc-700"
                    onClick={() => updateAgent.mutate({ id: selectedAgent.id, isActive: !selectedAgent.isActive })}
                    disabled={updateAgent.isPending}
                  >
                    {selectedAgent.isActive ? (
                      <><XCircle className="w-3 h-3 mr-1.5" />Deactivate</>
                    ) : (
                      <><CheckCircle className="w-3 h-3 mr-1.5" />Activate</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-amber-600 hover:bg-amber-500"
                    onClick={() => deployToVapi.mutate({ agentId: selectedAgent.id })}
                    disabled={deployToVapi.isPending}
                  >
                    <Zap className="w-3 h-3 mr-1.5" />
                    {selectedAgent.vapiAgentId ? "Re-deploy" : "Deploy to Vapi"}
                  </Button>
                  {!selectedAgent.isBuiltIn && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-400 hover:text-red-300"
                      onClick={() => deleteAgent.mutate({ id: selectedAgent.id })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Status badges */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge variant="outline" className={`text-xs ${selectedAgent.isActive ? "border-emerald-700 text-emerald-400" : "border-zinc-700 text-zinc-500"}`}>
                  {selectedAgent.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                  {PERSONALITY_LABELS[selectedAgent.personality]}
                </Badge>
                <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                  {FALLBACK_LABELS[selectedAgent.fallbackAction]}
                </Badge>
                {selectedAgent.vapiAgentId && (
                  <Badge variant="outline" className="text-xs border-blue-700 text-blue-400">
                    Vapi: {selectedAgent.vapiAgentId.slice(0, 8)}…
                  </Badge>
                )}
              </div>
            </div>

            {/* Greeting script */}
            <div className="px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <Mic className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-medium text-zinc-200">Greeting Script</h4>
              </div>
              <Textarea
                defaultValue={selectedAgent.greetingScript ?? ""}
                className="bg-zinc-900 border-zinc-700 text-zinc-200 text-sm min-h-[80px]"
                placeholder="How the agent opens the call…"
                onBlur={(e) => {
                  if (e.target.value !== selectedAgent.greetingScript) {
                    updateAgent.mutate({ id: selectedAgent.id, greetingScript: e.target.value });
                  }
                }}
              />
              <p className="text-xs text-zinc-600 mt-1">Use {"{{firstName}}"}, {"{{company}}"}, {"{{time}}"} as merge tags</p>
            </div>

            {/* Knowledge base */}
            <div className="px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-medium text-zinc-200">Knowledge Base</h4>
                  <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">{knowledge.length} items</Badge>
                </div>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowKnowledge(true)}>
                  <Plus className="w-3 h-3 mr-1" />Link Vault Item
                </Button>
              </div>
              {knowledge.length === 0 ? (
                <p className="text-xs text-zinc-600">No knowledge linked. Add Vault items to give this agent context.</p>
              ) : (
                <div className="space-y-1.5">
                  {knowledge.map((k) => (
                    <div key={k.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800">
                      <span className="text-xs text-zinc-300 truncate">{k.title}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-zinc-500 hover:text-red-400"
                        onClick={() => removeKnowledge.mutate({ agentId: selectedAgent.id, vaultItemId: k.id })}
                      >
                        <XCircle className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Call log */}
            <div className="px-6 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Phone className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-medium text-zinc-200">Call Log</h4>
                <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                  {calls.filter((c) => c.agentId === selectedAgent.id).length} calls
                </Badge>
              </div>
              {calls.filter((c) => c.agentId === selectedAgent.id).length === 0 ? (
                <p className="text-xs text-zinc-600">No calls logged for this agent yet.</p>
              ) : (
                <div className="space-y-2">
                  {calls
                    .filter((c) => c.agentId === selectedAgent.id)
                    .map((call) => (
                      <div key={call.id} className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
                        <button
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition-colors"
                          onClick={() => setExpandedCallId(expandedCallId === call.id ? null : call.id)}
                        >
                          <div className="flex items-center gap-3">
                            {call.sentiment && SENTIMENT_ICON[call.sentiment]}
                            <div className="text-left">
                              <p className="text-xs font-medium text-zinc-200">
                                {call.callerPhone ?? "Unknown caller"}
                                {call.durationSeconds && <span className="text-zinc-500 ml-2">{Math.floor(call.durationSeconds / 60)}m {call.durationSeconds % 60}s</span>}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {new Date(call.handledAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {call.outcome && (
                              <span className={`text-xs px-2 py-0.5 rounded border ${OUTCOME_BADGE[call.outcome] ?? "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
                                {call.outcome.replace("_", " ")}
                              </span>
                            )}
                            {expandedCallId === call.id ? <ChevronUp className="w-3 h-3 text-zinc-500" /> : <ChevronDown className="w-3 h-3 text-zinc-500" />}
                          </div>
                        </button>
                        {expandedCallId === call.id && (
                          <div className="px-4 pb-4 border-t border-zinc-800 pt-3 space-y-3">
                            {call.summary && (
                              <div>
                                <p className="text-xs text-zinc-500 mb-1">Summary</p>
                                <p className="text-xs text-zinc-300 leading-relaxed">{call.summary}</p>
                              </div>
                            )}
                            {call.transcript && (
                              <div>
                                <p className="text-xs text-zinc-500 mb-1">Transcript</p>
                                <div className="bg-zinc-950 rounded p-3 max-h-48 overflow-y-auto">
                                  <p className="text-xs text-zinc-400 font-mono leading-relaxed whitespace-pre-wrap">{call.transcript}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Agent Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-zinc-900 border-zinc-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">New Voice Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Agent Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Discovery Agent" className="bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Description</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What does this agent do?" className="bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Personality</label>
                <Select value={form.personality} onValueChange={(v) => setForm({ ...form, personality: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {Object.entries(PERSONALITY_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v} className="text-zinc-100">{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Fallback</label>
                <Select value={form.fallbackAction} onValueChange={(v) => setForm({ ...form, fallbackAction: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {Object.entries(FALLBACK_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v} className="text-zinc-100">{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Greeting Script</label>
              <Textarea value={form.greetingScript} onChange={(e) => setForm({ ...form, greetingScript: e.target.value })}
                placeholder="How the agent opens the call…" className="bg-zinc-800 border-zinc-700 text-zinc-100 text-sm" rows={3} />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Phone Number (optional)</label>
              <Input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                placeholder="+1 555 000 0000" className="bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              className="bg-amber-600 hover:bg-amber-500"
              disabled={!form.name.trim() || createAgent.isPending}
              onClick={() => createAgent.mutate({
                name: form.name,
                description: form.description || undefined,
                personality: form.personality as any,
                greetingScript: form.greetingScript || undefined,
                fallbackAction: form.fallbackAction as any,
                phoneNumber: form.phoneNumber || undefined,
              })}
            >
              Create Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Knowledge Dialog */}
      <Dialog open={showKnowledge} onOpenChange={setShowKnowledge}>
        <DialogContent className="bg-zinc-900 border-zinc-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Link Vault Knowledge</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto py-2">
            {vaultItems.filter((v) => !knowledge.some((k) => k.id === v.id)).length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">All Vault items are already linked.</p>
            ) : (
              vaultItems
                .filter((v) => !knowledge.some((k) => k.id === v.id))
                .map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      if (selectedAgentId) {
                        addKnowledge.mutate({ agentId: selectedAgentId, vaultItemId: v.id });
                        setShowKnowledge(false);
                      }
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors"
                  >
                    <p className="text-sm font-medium text-zinc-100">{v.title}</p>
                    <p className="text-xs text-zinc-500 capitalize mt-0.5">{v.type}</p>
                  </button>
                ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
