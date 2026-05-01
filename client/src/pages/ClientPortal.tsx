import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Globe,
  Plus,
  Copy,
  XCircle,
  MessageSquare,
  FileText,
  Send,
  Loader2,
  CheckCircle2,
  Clock,
  User,
} from "lucide-react";
import { SkeletonCards } from "@/components/StateUI";

// ─── Create Portal Dialog ─────────────────────────────────────────────────────
function CreatePortalDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [contactId, setContactId] = useState("");
  const [allowInvoices, setAllowInvoices] = useState(true);
  const [allowBooking, setAllowBooking] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);
  const [allowContracts, setAllowContracts] = useState(false);

  const { data: contacts } = trpc.crm.listContacts.useQuery({ limit: 200 });

  const create = trpc.portal.create.useMutation({
    onSuccess: (data) => {
      const url = `${window.location.origin}/portal/${data.accessToken}`;
      navigator.clipboard.writeText(url).catch(() => {});
      toast.success("Portal created — link copied to clipboard");
      setOpen(false);
      onCreated();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold">
          <Plus className="w-4 h-4" />
          New Portal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-ivory">Create Client Portal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-zinc-400 text-xs">Contact</Label>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-ivory">
                <SelectValue placeholder="Select a contact..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 max-h-48">
                {contacts?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.firstName} {c.lastName}{c.email ? ` — ${c.email}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label className="text-zinc-400 text-xs">Permissions</Label>
            {[
              { label: "Invoices", value: allowInvoices, set: setAllowInvoices },
              { label: "Booking", value: allowBooking, set: setAllowBooking },
              { label: "Messages", value: allowMessages, set: setAllowMessages },
              { label: "Contracts", value: allowContracts, set: setAllowContracts },
            ].map((p) => (
              <div key={p.label} className="flex items-center justify-between">
                <span className="text-zinc-300 text-sm">{p.label}</span>
                <Switch checked={p.value} onCheckedChange={p.set} />
              </div>
            ))}
          </div>
          <Button
            onClick={() =>
              create.mutate({
                contactId: parseInt(contactId),
                allowInvoices,
                allowBooking,
                allowMessages,
                allowContracts,
              })
            }
            disabled={!contactId || create.isPending}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          >
            {create.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating...</>
            ) : (
              <><Globe className="w-4 h-4 mr-2" />Create & Copy Link</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Messages Panel ───────────────────────────────────────────────────────────
function MessagesPanel({ portalId, onClose }: { portalId: number; onClose: () => void }) {
  const [msg, setMsg] = useState("");
  const utils = trpc.useUtils();

  const { data: messages, isLoading } = trpc.portal.getMessages.useQuery({ portalId });

  const send = trpc.portal.sendMessage.useMutation({
    onSuccess: () => {
      setMsg("");
      utils.portal.getMessages.invalidate({ portalId });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg mx-4 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="text-ivory font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            Portal Messages
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-zinc-400 hover:text-ivory">
            ✕
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
          ) : !messages?.length ? (
            <p className="text-zinc-500 text-sm text-center py-8">No messages yet</p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.senderType === "operator" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-xl text-sm ${
                    m.senderType === "operator"
                      ? "bg-amber-500/20 text-amber-100 rounded-br-sm"
                      : "bg-zinc-800 text-zinc-200 rounded-bl-sm"
                  }`}
                >
                  <p>{m.content}</p>
                  <p className="text-xs opacity-50 mt-1">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-zinc-800 flex gap-2">
          <Textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Type a message..."
            className="bg-zinc-800 border-zinc-700 text-ivory resize-none text-sm"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (msg.trim()) send.mutate({ portalId, content: msg.trim() });
              }
            }}
          />
          <Button
            onClick={() => { if (msg.trim()) send.mutate({ portalId, content: msg.trim() }); }}
            disabled={!msg.trim() || send.isPending}
            className="bg-amber-500 hover:bg-amber-600 text-black self-end"
            size="sm"
          >
            {send.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Portal Card ──────────────────────────────────────────────────────────────
function PortalCard({
  portal,
  onRefetch,
}: {
  portal: {
    id: number;
    accessToken: string;
    status: string;
    allowInvoices: boolean;
    allowBooking: boolean;
    allowMessages: boolean;
    allowContracts: boolean;
    lastAccessedAt: Date | null;
    unreadMessages: number;
    contact: { firstName: string; lastName: string; email: string | null; companyId: number | null } | null;
  };
  onRefetch: () => void;
}) {
  const [showMessages, setShowMessages] = useState(false);

  const revoke = trpc.portal.revoke.useMutation({
    onSuccess: () => { toast.success("Portal revoked"); onRefetch(); },
    onError: (e) => toast.error(e.message),
  });

  const portalUrl = `${window.location.origin}/portal/${portal.accessToken}`;
  const copyLink = () => {
    navigator.clipboard.writeText(portalUrl).catch(() => {});
    toast.success("Link copied");
  };

  const name = portal.contact
    ? `${portal.contact.firstName} ${portal.contact.lastName}`
    : "Unknown Contact";

  return (
    <>
      {showMessages && (
        <MessagesPanel portalId={portal.id} onClose={() => setShowMessages(false)} />
      )}
      <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <User className="w-3.5 h-3.5 text-zinc-500" />
                <h3 className="text-ivory font-semibold text-sm">{name}</h3>
                <Badge
                  variant="outline"
                  className={
                    portal.status === "active"
                      ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10 text-xs"
                      : "text-red-400 border-red-500/20 bg-red-500/10 text-xs"
                  }
                >
                  {portal.status}
                </Badge>
              </div>
              {portal.contact?.email && (
                <p className="text-zinc-500 text-xs">{portal.contact.email}</p>
              )}
            </div>
            {portal.unreadMessages > 0 && (
              <Badge className="bg-amber-500 text-black text-xs">
                {portal.unreadMessages} new
              </Badge>
            )}
          </div>

          {/* Permissions */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[
              { label: "Invoices", enabled: portal.allowInvoices },
              { label: "Booking", enabled: portal.allowBooking },
              { label: "Messages", enabled: portal.allowMessages },
              { label: "Contracts", enabled: portal.allowContracts },
            ].map((p) => (
              <span
                key={p.label}
                className={`text-xs px-2 py-0.5 rounded-full border ${
                  p.enabled
                    ? "border-zinc-600 text-zinc-300 bg-zinc-800"
                    : "border-zinc-800 text-zinc-600"
                }`}
              >
                {p.enabled ? "✓" : "✗"} {p.label}
              </span>
            ))}
          </div>

          {portal.lastAccessedAt && (
            <p className="text-zinc-600 text-xs mb-3 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last accessed {new Date(portal.lastAccessedAt).toLocaleDateString()}
            </p>
          )}

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={copyLink}
              className="flex-1 h-8 text-xs border-zinc-700 text-zinc-300 hover:text-ivory hover:bg-zinc-800 gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Link
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowMessages(true)}
              className="h-8 text-xs text-zinc-400 hover:text-ivory hover:bg-zinc-800 relative"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {portal.unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full text-black text-[9px] flex items-center justify-center font-bold">
                  {portal.unreadMessages}
                </span>
              )}
            </Button>
            {portal.status === "active" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => revoke.mutate({ id: portal.id })}
                disabled={revoke.isPending}
                className="h-8 text-xs text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                title="Revoke access"
              >
                <XCircle className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ClientPortalPage() {
  const { data: portals, isLoading, refetch } = trpc.portal.list.useQuery();

  const active = portals?.filter((p) => p.status === "active").length ?? 0;
  const unread = portals?.reduce((s, p) => s + p.unreadMessages, 0) ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ivory">Client Portal</h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            White-labeled portals for clients to view invoices, book, and message you
          </p>
        </div>
        <CreatePortalDialog onCreated={refetch} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Portals", value: portals?.length ?? 0, color: "text-ivory" },
          { label: "Active", value: active, color: "text-emerald-400" },
          { label: "Unread Messages", value: unread, color: "text-amber-400" },
        ].map((s) => (
          <Card key={s.label} className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Portal Grid */}
      {isLoading ? (
        <SkeletonCards count={3} />
      ) : !portals?.length ? (
        <div className="text-center py-20">
          <Globe className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-ivory font-semibold mb-2">No portals yet</h3>
          <p className="text-zinc-500 text-sm mb-6">
            Create a portal to give clients a dedicated space to view invoices and communicate
          </p>
          <CreatePortalDialog onCreated={refetch} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portals.map((p) => (
            <PortalCard key={p.id} portal={p} onRefetch={refetch} />
          ))}
        </div>
      )}
    </div>
  );
}
