import { useState } from "react";
import { useLocation } from "wouter";
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
  FileSignature,
  Plus,
  Send,
  XCircle,
  Copy,
  Loader2,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
} from "lucide-react";
import { SkeletonCards } from "@/components/StateUI";
import AppLayout from "@/components/AppLayout";

const STATUS_COLORS: Record<string, string> = {
  draft: "text-zinc-400 border-zinc-600 bg-zinc-800",
  sent: "text-blue-400 border-blue-500/20 bg-blue-500/10",
  viewed: "text-amber-400 border-amber-500/20 bg-amber-500/10",
  signed: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
  voided: "text-red-400 border-red-500/20 bg-red-500/10",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  draft: FileText,
  sent: Send,
  viewed: Eye,
  signed: CheckCircle2,
  voided: XCircle,
};

// ─── Create/Edit Dialog ───────────────────────────────────────────────────────
function ContractDialog({
  onCreated,
  editContract,
  onClose,
}: {
  onCreated: () => void;
  editContract?: { id: number; title: string; body: string; signerName?: string | null; signerEmail?: string | null };
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(!editContract);
  const [title, setTitle] = useState(editContract?.title ?? "");
  const [body, setBody] = useState(editContract?.body ?? "");
  const [signerName, setSignerName] = useState(editContract?.signerName ?? "");
  const [signerEmail, setSignerEmail] = useState(editContract?.signerEmail ?? "");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const { data: contacts } = trpc.crm.listContacts.useQuery({ limit: 200 });
  const { data: templates } = trpc.contracts.getTemplates.useQuery();
  const [contactId, setContactId] = useState("");

  const create = trpc.contracts.create.useMutation({
    onSuccess: () => { toast.success("Contract created"); setOpen(false); onCreated(); },
    onError: (e) => toast.error(e.message),
  });

  const update = trpc.contracts.update.useMutation({
    onSuccess: () => { toast.success("Contract saved"); onClose?.(); onCreated(); },
    onError: (e) => toast.error(e.message),
  });

  const handleTemplate = (id: string) => {
    const t = templates?.find((t) => t.id === id);
    if (t) { setTitle(t.title); setBody(t.body); setSelectedTemplate(id); }
  };

  const handleSubmit = () => {
    if (editContract) {
      update.mutate({ id: editContract.id, title, body, signerName: signerName || undefined, signerEmail: signerEmail || undefined });
    } else {
      create.mutate({ title, body, contactId: contactId ? parseInt(contactId) : undefined, signerName: signerName || undefined, signerEmail: signerEmail || undefined });
    }
  };

  const isPending = create.isPending || update.isPending;

  const content = (
    <div className="space-y-4">
      {!editContract && (
        <div className="space-y-1">
          <Label className="text-zinc-400 text-xs">Start from template</Label>
          <Select value={selectedTemplate} onValueChange={handleTemplate}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-ivory">
              <SelectValue placeholder="Choose a template..." />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              {templates?.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-1">
        <Label className="text-zinc-400 text-xs">Contract Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Service Agreement" className="bg-zinc-800 border-zinc-700 text-ivory" />
      </div>
      <div className="space-y-1">
        <Label className="text-zinc-400 text-xs">Contract Body</Label>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Enter contract terms..." className="bg-zinc-800 border-zinc-700 text-ivory font-mono text-xs" rows={10} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-zinc-400 text-xs">Signer Name</Label>
          <Input value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="John Smith" className="bg-zinc-800 border-zinc-700 text-ivory" />
        </div>
        <div className="space-y-1">
          <Label className="text-zinc-400 text-xs">Signer Email</Label>
          <Input value={signerEmail} onChange={(e) => setSignerEmail(e.target.value)} placeholder="john@example.com" type="email" className="bg-zinc-800 border-zinc-700 text-ivory" />
        </div>
      </div>
      {!editContract && (
        <div className="space-y-1">
          <Label className="text-zinc-400 text-xs">Link to Contact (optional)</Label>
          <Select value={contactId} onValueChange={setContactId}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-ivory">
              <SelectValue placeholder="Select contact..." />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700 max-h-40">
              {contacts?.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.firstName} {c.lastName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <Button onClick={handleSubmit} disabled={!title || !body || isPending} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold">
        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileSignature className="w-4 h-4 mr-2" />}
        {editContract ? "Save Changes" : "Create Contract"}
      </Button>
    </div>
  );

  if (editContract) return content;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold">
          <Plus className="w-4 h-4" />New Contract
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-ivory">New Contract</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

// ─── Contract Card ────────────────────────────────────────────────────────────
function ContractCard({ contract, onRefetch }: { contract: any; onRefetch: () => void }) {
  const [editing, setEditing] = useState(false);
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const send = trpc.contracts.send.useMutation({
    onSuccess: (data) => {
      const url = `${window.location.origin}/sign/${data.token}`;
      navigator.clipboard.writeText(url).catch(() => {});
      toast.success("Contract sent — signing link copied");
      onRefetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const voidContract = trpc.contracts.void.useMutation({
    onSuccess: () => { toast.success("Contract voided"); onRefetch(); },
    onError: (e) => toast.error(e.message),
  });

  const StatusIcon = STATUS_ICONS[contract.status] ?? FileText;

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
      <CardContent className="p-5">
        {editing ? (
          <>
            <ContractDialog
              onCreated={() => { setEditing(false); onRefetch(); }}
              editContract={contract}
              onClose={() => setEditing(false)}
            />
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="mt-2 text-zinc-500 w-full">Cancel</Button>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-ivory font-semibold text-sm truncate">{contract.title}</h3>
                {contract.contact && (
                  <p className="text-zinc-500 text-xs mt-0.5">{contract.contact.firstName} {contract.contact.lastName}</p>
                )}
                {contract.signerEmail && !contract.contact && (
                  <p className="text-zinc-500 text-xs mt-0.5">{contract.signerEmail}</p>
                )}
              </div>
              <Badge variant="outline" className={`text-xs ml-2 shrink-0 flex items-center gap-1 ${STATUS_COLORS[contract.status]}`}>
                <StatusIcon className="w-3 h-3" />
                {contract.status}
              </Badge>
            </div>

            {contract.signedAt && (
              <p className="text-emerald-400 text-xs mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Signed {new Date(contract.signedAt).toLocaleDateString()}
              </p>
            )}
            {contract.sentAt && !contract.signedAt && (
              <p className="text-zinc-500 text-xs mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Sent {new Date(contract.sentAt).toLocaleDateString()}
              </p>
            )}

            <p className="text-zinc-600 text-xs mb-3">
              {new Date(contract.createdAt).toLocaleDateString()}
            </p>

            <div className="flex items-center gap-1.5">
              {contract.status === "draft" && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="flex-1 h-8 text-xs border-zinc-700 text-zinc-300 hover:text-ivory hover:bg-zinc-800">
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => send.mutate({ id: contract.id })}
                    disabled={!contract.signerEmail || send.isPending}
                    className="flex-1 h-8 text-xs bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                  >
                    {send.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5 mr-1" />Send</>}
                  </Button>
                </>
              )}
              {(contract.status === "sent" || contract.status === "viewed") && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const url = `${window.location.origin}/sign/${contract.signToken}`;
                      navigator.clipboard.writeText(url).catch(() => {});
                      toast.success("Signing link copied");
                    }}
                    className="flex-1 h-8 text-xs border-zinc-700 text-zinc-300 hover:text-ivory hover:bg-zinc-800 gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />Copy Link
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => voidContract.mutate({ id: contract.id })}
                    disabled={voidContract.isPending}
                    className="h-8 text-xs text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
              {contract.status === "signed" && (
                <div className="flex items-center gap-1 text-emerald-400 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Signed by {contract.signerName}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ContractsPage() {
  const { data: contracts, isLoading, refetch } = trpc.contracts.list.useQuery();

  const counts = {
    total: contracts?.length ?? 0,
    signed: contracts?.filter((c) => c.status === "signed").length ?? 0,
    pending: contracts?.filter((c) => c.status === "sent" || c.status === "viewed").length ?? 0,
  };

  return (
    <AppLayout>
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ivory">Contracts</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Create, send, and e-sign contracts with clients</p>
        </div>
        <ContractDialog onCreated={refetch} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: counts.total, color: "text-ivory" },
          { label: "Awaiting Signature", value: counts.pending, color: "text-amber-400" },
          { label: "Signed", value: counts.signed, color: "text-emerald-400" },
        ].map((s) => (
          <Card key={s.label} className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <SkeletonCards count={3} />
      ) : !contracts?.length ? (
        <div className="text-center py-20">
          <FileSignature className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-ivory font-semibold mb-2">No contracts yet</h3>
          <p className="text-zinc-500 text-sm mb-6">Create a contract from a template and send it for e-signature</p>
          <ContractDialog onCreated={refetch} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contracts.map((c) => (
            <ContractCard key={c.id} contract={c} onRefetch={refetch} />
          ))}
        </div>
      )}
    </div>
    </AppLayout>
  );
}
