import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SpectreEmptyState } from "@/components/StateUI";
import { toast } from "sonner";
import { Send, Plus, MessageSquare, FileText, Phone, CheckCheck, Clock, AlertCircle } from "lucide-react";

function statusIcon(status: string) {
  if (status === "delivered" || status === "read") return <CheckCheck className="w-3 h-3 text-amber-400" />;
  if (status === "sent") return <CheckCheck className="w-3 h-3 text-zinc-400" />;
  if (status === "failed") return <AlertCircle className="w-3 h-3 text-red-400" />;
  return <Clock className="w-3 h-3 text-zinc-500" />;
}

export default function SMS() {
  const [selectedConvoId, setSelectedConvoId] = useState<number | null>(null);
  const [compose, setCompose] = useState("");
  const [showNewConvo, setShowNewConvo] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newClientId, setNewClientId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: caps } = trpc.capabilities.check.useQuery();
  const twilioConfigured = caps?.twilio ?? false;

  const utils = trpc.useUtils();
  const { data: convos = [] } = trpc.sms.listConversations.useQuery();
  const { data: messages = [] } = trpc.sms.listMessages.useQuery(
    { conversationId: selectedConvoId! },
    { enabled: !!selectedConvoId, refetchInterval: 5000 }
  );
  const { data: templates = [] } = trpc.sms.listTemplates.useQuery();
  const { data: clients = [] } = trpc.clients.list.useQuery();

  const createConvo = trpc.sms.createConversation.useMutation({
    onSuccess: () => {
      utils.sms.listConversations.invalidate();
      setShowNewConvo(false);
      setNewPhone("");
      setNewClientId("");
      toast.success("Conversation started");
    },
    onError: (e) => toast.error(e.message),
  });

  const sendMsg = trpc.sms.sendMessage.useMutation({
    onSuccess: (data) => {
      utils.sms.listMessages.invalidate({ conversationId: selectedConvoId! });
      utils.sms.listConversations.invalidate();
      setCompose("");
      if (data.status === "queued") {
        toast.info("Message queued — add Twilio credentials to send live SMS");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedConvo = convos.find((c) => c.id === selectedConvoId);

  function handleSend() {
    if (!compose.trim() || !selectedConvoId) return;
    sendMsg.mutate({ conversationId: selectedConvoId, body: compose.trim() });
  }

  function insertTemplate(body: string) {
    setCompose(body);
    setShowTemplates(false);
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-zinc-950">
      {/* Conversation list */}
      <div className="w-72 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">SMS Outreach</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{convos.length} conversation{convos.length !== 1 ? "s" : ""}</p>
          </div>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowNewConvo(true)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Twilio status banner */}
        {!twilioConfigured && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-amber-950/40 border border-amber-800/40 text-xs text-amber-400">
            <strong>Twilio not connected</strong> — messages are queued locally but won't send until you add Twilio credentials in Settings → Integrations.
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {convos.length === 0 ? (
            <div className="p-4 text-center text-zinc-600 text-sm mt-8">
              No conversations yet.<br />Start one with the + button.
            </div>
          ) : (
            convos.map((c) => {
              const client = clients.find((cl) => cl.id === c.clientId);
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedConvoId(c.id)}
                  className={`w-full text-left px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-900 transition-colors ${selectedConvoId === c.id ? "bg-zinc-900 border-l-2 border-l-amber-500" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-900/40 border border-amber-700/30 flex items-center justify-center shrink-0">
                      <span className="text-xs font-medium text-amber-400">
                        {(client?.name ?? c.phoneNumber).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{client?.name ?? "Unknown"}</p>
                      <p className="text-xs text-zinc-500 truncate">{c.phoneNumber}</p>
                    </div>
                  </div>
                  {c.lastMessageAt && (
                    <p className="text-xs text-zinc-600 mt-1 text-right">
                      {new Date(c.lastMessageAt).toLocaleDateString()}
                    </p>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Message thread */}
      <div className="flex-1 flex flex-col">
        {!selectedConvoId ? (
          <div className="flex-1 flex items-center justify-center">
            <SpectreEmptyState
              title="Select a conversation"
              body="Choose a contact from the left or start a new conversation."
              spectreQuote="I'm monitoring all channels. Pick a target."
            />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-900/40 border border-amber-700/30 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-100">
                    {clients.find((c) => c.id === selectedConvo?.clientId)?.name ?? "Contact"}
                  </p>
                  <p className="text-xs text-zinc-500">{selectedConvo?.phoneNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-xs ${selectedConvo?.optInStatus === "opted_in" ? "border-emerald-700 text-emerald-400" : "border-zinc-700 text-zinc-400"}`}>
                  {selectedConvo?.optInStatus === "opted_in" ? "Opted In" : "Pending"}
                </Badge>
                {selectedConvo?.phoneNumber && (
                  <a href={`tel:${selectedConvo.phoneNumber}`}>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Phone className="w-4 h-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-zinc-600 text-sm mt-12">
                  No messages yet. Send the first one below.
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                      m.direction === "outbound"
                        ? "bg-amber-600 text-white rounded-br-sm"
                        : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
                    }`}>
                      <p className="leading-relaxed">{m.body}</p>
                      <div className={`flex items-center gap-1 mt-1 ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                        <span className="text-xs opacity-60">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {m.direction === "outbound" && statusIcon(m.status)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Compose bar */}
            <div className="px-6 py-4 border-t border-zinc-800">
              <div className="flex items-end gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 shrink-0 mb-0.5"
                  onClick={() => setShowTemplates(true)}
                  title="Insert template"
                >
                  <FileText className="w-4 h-4" />
                </Button>
                <Textarea
                  value={compose}
                  onChange={(e) => setCompose(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 min-h-[40px] max-h-32 resize-none bg-zinc-900 border-zinc-700 text-zinc-100 text-sm"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="h-9 w-9 shrink-0 mb-0.5 bg-amber-600 hover:bg-amber-500"
                  onClick={handleSend}
                  disabled={!compose.trim() || sendMsg.isPending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-zinc-600 mt-1.5">Enter to send · Shift+Enter for new line</p>
            </div>
          </>
        )}
      </div>

      {/* New Conversation Dialog */}
      <Dialog open={showNewConvo} onOpenChange={setShowNewConvo}>
        <DialogContent className="bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">New SMS Conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Contact</label>
              <Select value={newClientId} onValueChange={setNewClientId}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                  <SelectValue placeholder="Select a client…" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)} className="text-zinc-100">
                      {c.name} {c.company ? `— ${c.company}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Phone Number</label>
              <Input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+1 555 000 0000"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewConvo(false)}>Cancel</Button>
            <Button
              className="bg-amber-600 hover:bg-amber-500"
              disabled={!newPhone.trim() || !newClientId || createConvo.isPending}
              onClick={() => createConvo.mutate({ clientId: Number(newClientId), phoneNumber: newPhone.trim() })}
            >
              Start Conversation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Picker Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="bg-zinc-900 border-zinc-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">SMS Templates</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto py-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => insertTemplate(t.body)}
                className="w-full text-left p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-zinc-100">{t.name}</span>
                  {t.isBuiltIn && <Badge variant="outline" className="text-xs border-amber-700 text-amber-400">Built-in</Badge>}
                  <Badge variant="outline" className="text-xs border-zinc-600 text-zinc-400 capitalize">{t.category.replace("_", " ")}</Badge>
                </div>
                <p className="text-xs text-zinc-400 line-clamp-2">{t.body}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
