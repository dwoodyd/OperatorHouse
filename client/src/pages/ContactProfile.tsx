import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Mail, Phone, Building2, Edit2, Check, X,
  MessageSquare, Plus, Clock, Tag,
} from "lucide-react";

const LIFECYCLE_COLORS: Record<string, string> = {
  lead: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  prospect: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  client: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  past_client: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  partner: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

const LIFECYCLE_LABELS: Record<string, string> = {
  lead: "Lead", prospect: "Prospect", client: "Client", past_client: "Past Client", partner: "Partner",
};

export default function ContactProfile() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const contactId = Number(params.id);
  const utils = trpc.useUtils();

  const [editing, setEditing] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: contact, isLoading } = trpc.crm.getContact.useQuery(
    { id: contactId },
    { enabled: !!contactId }
  );

  // Sync form when contact loads (only when not actively editing)
  if (contact && !editing && !form.firstName) {
    setForm({
      firstName: contact.firstName,
      lastName: contact.lastName ?? "",
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      title: contact.title ?? "",
      lifecycleStage: contact.lifecycleStage,
      notes: "",
    });
  }

  const update = trpc.crm.updateContact.useMutation({
    onSuccess: () => {
      utils.crm.getContact.invalidate({ id: contactId });
      utils.crm.listContacts.invalidate();
      toast.success("Contact updated");
      setEditing(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const addNote = trpc.crm.addNote.useMutation({
    onSuccess: () => {
      utils.crm.getContact.invalidate({ id: contactId });
      setNoteText("");
      toast.success("Note added");
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="w-6 h-6 border-2 border-[#f5c842] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-6 text-center text-[#555]">
        <p>Contact not found.</p>
        <Button variant="ghost" className="mt-4 text-[#888]" onClick={() => navigate("/crm")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to CRM
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-[oh-fade-up_0.3s_ease-out]">
      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" className="text-[#666] hover:text-[#e5e5e5] mt-1" onClick={() => navigate("/crm")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#f5c842]/20 flex items-center justify-center text-[#f5c842] text-xl font-bold">
                {contact.firstName[0]}{contact.lastName?.[0] ?? ""}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#e5e5e5]">{contact.firstName} {contact.lastName}</h1>
                {contact.title && <p className="text-sm text-[#666]">{contact.title}</p>}
                <span className={`text-xs px-2 py-0.5 rounded-full border mt-1 inline-block ${LIFECYCLE_COLORS[contact.lifecycleStage] ?? ""}`}>
                  {LIFECYCLE_LABELS[contact.lifecycleStage]}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button size="sm" variant="ghost" className="text-[#888]" onClick={() => setEditing(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[#f5c842] text-black hover:bg-[#f5c842]/90"
                    disabled={update.isPending}
                    onClick={() => update.mutate({ id: contactId, ...form as any })}
                  >
                    <Check className="w-4 h-4 mr-1" /> Save
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" className="border-[#333] text-[#888] hover:text-[#e5e5e5]" onClick={() => setEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-1" /> Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wider mb-4">Contact Details</h2>
            {editing ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#666]">First Name</Label>
                  <Input className="bg-[#0a0a0a] border-[#333] text-[#e5e5e5] mt-1" value={form.firstName ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs text-[#666]">Last Name</Label>
                  <Input className="bg-[#0a0a0a] border-[#333] text-[#e5e5e5] mt-1" value={form.lastName ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-[#666]">Email</Label>
                  <Input type="email" className="bg-[#0a0a0a] border-[#333] text-[#e5e5e5] mt-1" value={form.email ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs text-[#666]">Phone</Label>
                  <Input className="bg-[#0a0a0a] border-[#333] text-[#e5e5e5] mt-1" value={form.phone ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs text-[#666]">Title</Label>
                  <Input className="bg-[#0a0a0a] border-[#333] text-[#e5e5e5] mt-1" value={form.title ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs text-[#666]">Lifecycle Stage</Label>
                  <Select value={form.lifecycleStage} onValueChange={(v) => setForm((f) => ({ ...f, lifecycleStage: v }))}>
                    <SelectTrigger className="bg-[#0a0a0a] border-[#333] text-[#e5e5e5] mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#333]">
                      {Object.entries(LIFECYCLE_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v} className="text-[#e5e5e5]">{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-[#666]">Notes</Label>
                  <Textarea className="bg-[#0a0a0a] border-[#333] text-[#e5e5e5] mt-1 resize-none" rows={3}
                    value={form.notes ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {contact.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-[#555]" />
                    <a href={`mailto:${contact.email}`} className="text-[#e5e5e5] hover:text-[#f5c842] transition-colors text-sm">
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-[#555]" />
                    <a href={`tel:${contact.phone}`} className="text-[#e5e5e5] hover:text-[#f5c842] transition-colors text-sm">
                      {contact.phone}
                    </a>
                  </div>
                )}
                {contact.company && (
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-[#555]" />
                    <span className="text-[#e5e5e5] text-sm">{contact.company.name}</span>
                  </div>
                )}
                {contact.tags && (contact.tags as string[]).length > 0 && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <Tag className="w-4 h-4 text-[#555]" />
                    {(contact.tags as string[]).map((tag) => (
                      <span key={tag} className="text-xs bg-[#1a1a1a] border border-[#333] px-2 py-0.5 rounded-full text-[#888]">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {form.notes && (
                  <div className="mt-3 pt-3 border-t border-[#1e1e1e]">
                    <p className="text-xs text-[#555] mb-1">Notes</p>
                    <p className="text-sm text-[#888] whitespace-pre-wrap">{form.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Activity Notes */}
          <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wider mb-4">Activity Log</h2>

            {/* Add note */}
            <div className="flex gap-2 mb-4">
              <Textarea
                placeholder="Add a note or interaction log…"
                className="bg-[#0a0a0a] border-[#333] text-[#e5e5e5] placeholder:text-[#444] resize-none text-sm"
                rows={2}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <Button
                size="sm"
                className="bg-[#f5c842] text-black hover:bg-[#f5c842]/90 self-end"
                disabled={!noteText.trim() || addNote.isPending}
                onClick={() => addNote.mutate({ contactId, note: noteText })}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Activity notes from DB */}
            {contact.notes.length === 0 ? (
              <p className="text-sm text-[#555] text-center py-4">No activity yet. Add a note above.</p>
            ) : (
              <div className="space-y-3">
                {contact.notes.map((n) => (
                  <div key={n.id} className="flex gap-3 border-t border-[#1e1e1e] pt-3 first:border-0 first:pt-0">
                    <MessageSquare className="w-4 h-4 text-[#555] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-[#e5e5e5]">{n.note}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-[#555]">
                        <Clock className="w-3 h-3" />
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Meta */}
        <div className="space-y-4">
          <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wider mb-4">Meta</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#555]">Source</span>
                <span className="text-[#e5e5e5] capitalize">{contact.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#555]">Health Score</span>
                <span className={`font-mono font-bold ${(contact.healthScore ?? 50) >= 70 ? "text-emerald-400" : (contact.healthScore ?? 50) >= 40 ? "text-amber-400" : "text-red-400"}`}>
                  {contact.healthScore ?? 50}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#555]">Email Opt-in</span>
                <span className={contact.optedInEmail ? "text-emerald-400" : "text-[#555]"}>
                  {contact.optedInEmail ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#555]">SMS Opt-in</span>
                <span className={contact.optedInSms ? "text-emerald-400" : "text-[#555]"}>
                  {contact.optedInSms ? "Yes" : "No"}
                </span>
              </div>
              {contact.lastContactedAt && (
                <div className="flex justify-between">
                  <span className="text-[#555]">Last Contact</span>
                  <span className="text-[#e5e5e5] text-xs">{new Date(contact.lastContactedAt).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#555]">Created</span>
                <span className="text-[#e5e5e5] text-xs">{new Date(contact.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {contact.company && (
            <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-5">
              <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wider mb-3">Company</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#f5c842]/10 flex items-center justify-center text-[#f5c842] font-bold text-sm">
                  {contact.company.name[0]}
                </div>
                <div>
                  <p className="font-medium text-[#e5e5e5] text-sm">{contact.company.name}</p>
                  <p className="text-xs text-[#666]">{contact.company.industry ?? "No industry"}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
