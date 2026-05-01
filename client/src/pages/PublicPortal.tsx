import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  FileText,
  Send,
  Loader2,
  Globe,
  CheckCircle2,
  Clock,
} from "lucide-react";

export default function PublicPortal() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";
  const [msg, setMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"messages" | "documents">("messages");

  const { data, isLoading, error, refetch } = trpc.portal.getByToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const sendMsg = trpc.portal.clientSendMessage.useMutation({
    onSuccess: () => {
      setMsg("");
      refetch();
      toast.success("Message sent");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0e0c09] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0e0c09] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <Globe className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-ivory text-xl font-bold mb-2">Portal Unavailable</h2>
          <p className="text-zinc-400 text-sm">
            This portal link is invalid, expired, or has been revoked. Please contact your operator for a new link.
          </p>
        </div>
      </div>
    );
  }

  const { portal, contact, messages, documents } = data;
  const clientName = contact ? `${contact.firstName} ${contact.lastName}` : "Client";

  const tabs = [
    portal.allowMessages && { id: "messages" as const, label: "Messages", icon: MessageSquare },
    portal.allowInvoices && { id: "documents" as const, label: "Documents", icon: FileText },
  ].filter(Boolean) as { id: "messages" | "documents"; label: string; icon: React.ElementType }[];

  return (
    <div className="min-h-screen bg-[#0e0c09] text-ivory">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <span className="text-amber-400 text-xs font-bold">OH</span>
            </div>
            <div>
              <p className="text-ivory font-semibold text-sm">Operator House</p>
              <p className="text-zinc-500 text-xs">Client Portal</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-zinc-300 text-sm font-medium">{clientName}</p>
            {contact?.email && <p className="text-zinc-500 text-xs">{contact.email}</p>}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome */}
        <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
          <h1 className="text-ivory font-bold text-lg mb-1">Welcome, {clientName}</h1>
          <p className="text-zinc-400 text-sm">
            This is your private portal. Use it to communicate, view documents, and manage your engagement.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {portal.allowMessages && (
              <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/20 bg-emerald-500/10">
                <CheckCircle2 className="w-3 h-3 mr-1" />Messages
              </Badge>
            )}
            {portal.allowInvoices && (
              <Badge variant="outline" className="text-xs text-blue-400 border-blue-500/20 bg-blue-500/10">
                <CheckCircle2 className="w-3 h-3 mr-1" />Documents
              </Badge>
            )}
            {portal.allowBooking && (
              <Badge variant="outline" className="text-xs text-violet-400 border-violet-500/20 bg-violet-500/10">
                <CheckCircle2 className="w-3 h-3 mr-1" />Booking
              </Badge>
            )}
          </div>
        </div>

        {/* Tabs */}
        {tabs.length > 1 && (
          <div className="flex gap-1 bg-zinc-900 rounded-lg p-1 border border-zinc-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-zinc-800 text-ivory"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Messages Tab */}
        {(activeTab === "messages" || tabs.length === 1) && portal.allowMessages && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-ivory text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {!messages.length ? (
                  <p className="text-zinc-500 text-sm text-center py-6">No messages yet. Start the conversation below.</p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.senderType === "client" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-xl text-sm ${
                          m.senderType === "client"
                            ? "bg-amber-500/20 text-amber-100 rounded-br-sm"
                            : "bg-zinc-800 text-zinc-200 rounded-bl-sm"
                        }`}
                      >
                        <p className="text-xs font-medium opacity-60 mb-0.5">
                          {m.senderType === "client" ? "You" : "Operator"}
                        </p>
                        <p>{m.content}</p>
                        <p className="text-xs opacity-40 mt-1">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2 pt-2 border-t border-zinc-800">
                <Textarea
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  placeholder="Type a message..."
                  className="bg-zinc-800 border-zinc-700 text-ivory resize-none text-sm"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (msg.trim()) sendMsg.mutate({ token, content: msg.trim() });
                    }
                  }}
                />
                <Button
                  onClick={() => { if (msg.trim()) sendMsg.mutate({ token, content: msg.trim() }); }}
                  disabled={!msg.trim() || sendMsg.isPending}
                  className="bg-amber-500 hover:bg-amber-600 text-black self-end"
                  size="sm"
                >
                  {sendMsg.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents Tab */}
        {activeTab === "documents" && portal.allowInvoices && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-ivory text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!documents.length ? (
                <p className="text-zinc-500 text-sm text-center py-6">No documents shared yet.</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg"
                    >
                      <div>
                        <p className="text-ivory text-sm font-medium">{doc.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs text-zinc-400 border-zinc-600">
                            {doc.type}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              doc.status === "signed" || doc.status === "approved"
                                ? "text-emerald-400 border-emerald-500/20"
                                : "text-zinc-400 border-zinc-600"
                            }`}
                          >
                            {doc.status}
                          </Badge>
                        </div>
                      </div>
                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-400 text-xs hover:underline"
                        >
                          View
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
