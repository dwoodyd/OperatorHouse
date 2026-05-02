import { useState, useCallback, useTransition } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Users, Building2, Filter, Download, Upload, Plus, Search,
  ChevronRight, Phone, Mail, Star, MoreHorizontal, Layers,
  Trash2, Edit2, Tag,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SkeletonRows } from "@/components/StateUI";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "contacts" | "companies" | "segments";

const LIFECYCLE_COLORS: Record<string, string> = {
  lead: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  prospect: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  client: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  past_client: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  partner: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

const LIFECYCLE_LABELS: Record<string, string> = {
  lead: "Lead",
  prospect: "Prospect",
  client: "Client",
  past_client: "Past Client",
  partner: "Partner",
};

// ─── Add Contact Dialog ───────────────────────────────────────────────────────
function AddContactDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", title: "",
    lifecycleStage: "lead" as const, source: "manual" as const,
  });

  const create = trpc.crm.createContact.useMutation({
    onSuccess: () => {
      utils.crm.listContacts.invalidate();
      utils.crm.getStats.invalidate();
      toast.success("Contact created");
      onClose();
      setForm({ firstName: "", lastName: "", email: "", phone: "", title: "", lifecycleStage: "lead", source: "manual" });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-[#e5e5e5] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#f5c842]">New Contact</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-[#888]">First Name *</Label>
            <Input className="bg-[#111] border-[#333] text-[#e5e5e5] mt-1" value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs text-[#888]">Last Name</Label>
            <Input className="bg-[#111] border-[#333] text-[#e5e5e5] mt-1" value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <Label className="text-xs text-[#888]">Email</Label>
            <Input type="email" className="bg-[#111] border-[#333] text-[#e5e5e5] mt-1" value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs text-[#888]">Phone</Label>
            <Input className="bg-[#111] border-[#333] text-[#e5e5e5] mt-1" value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs text-[#888]">Title</Label>
            <Input className="bg-[#111] border-[#333] text-[#e5e5e5] mt-1" value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs text-[#888]">Stage</Label>
            <Select value={form.lifecycleStage} onValueChange={(v) => setForm((f) => ({ ...f, lifecycleStage: v as any }))}>
              <SelectTrigger className="bg-[#111] border-[#333] text-[#e5e5e5] mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#333]">
                {Object.entries(LIFECYCLE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v} className="text-[#e5e5e5]">{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-[#888]">Source</Label>
            <Select value={form.source} onValueChange={(v) => setForm((f) => ({ ...f, source: v as any }))}>
              <SelectTrigger className="bg-[#111] border-[#333] text-[#e5e5e5] mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#333]">
                {["manual", "funnel", "import", "prospecting", "referral", "social"].map((s) => (
                  <SelectItem key={s} value={s} className="text-[#e5e5e5] capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-[#888]">Cancel</Button>
          <Button
            className="bg-[#f5c842] text-black hover:bg-[#f5c842]/90"
            disabled={!form.firstName || create.isPending}
            onClick={() => create.mutate(form)}
          >
            {create.isPending ? "Creating…" : "Create Contact"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Company Dialog ───────────────────────────────────────────────────────
function AddCompanyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({ name: "", industry: "", size: "small" as const, website: "", description: "" });

  const create = trpc.crm.createCompany.useMutation({
    onSuccess: () => {
      utils.crm.listCompanies.invalidate();
      toast.success("Company created");
      onClose();
      setForm({ name: "", industry: "", size: "small", website: "", description: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-[#e5e5e5] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#f5c842]">New Company</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-[#888]">Company Name *</Label>
            <Input className="bg-[#111] border-[#333] text-[#e5e5e5] mt-1" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-[#888]">Industry</Label>
              <Input className="bg-[#111] border-[#333] text-[#e5e5e5] mt-1" value={form.industry}
                onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-[#888]">Size</Label>
              <Select value={form.size} onValueChange={(v) => setForm((f) => ({ ...f, size: v as any }))}>
                <SelectTrigger className="bg-[#111] border-[#333] text-[#e5e5e5] mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#333]">
                  {["solo", "small", "medium", "large", "enterprise"].map((s) => (
                    <SelectItem key={s} value={s} className="text-[#e5e5e5] capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs text-[#888]">Website</Label>
            <Input className="bg-[#111] border-[#333] text-[#e5e5e5] mt-1" value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs text-[#888]">Description</Label>
            <Input className="bg-[#111] border-[#333] text-[#e5e5e5] mt-1" value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-[#888]">Cancel</Button>
          <Button
            className="bg-[#f5c842] text-black hover:bg-[#f5c842]/90"
            disabled={!form.name || create.isPending}
            onClick={() => create.mutate(form)}
          >
            {create.isPending ? "Creating…" : "Create Company"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Contacts Tab ─────────────────────────────────────────────────────────────
function ContactsTab() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [, startSearchTransition] = useTransition();

  const { data: contacts = [], isLoading } = trpc.crm.listContacts.useQuery({
    search: search || undefined,
    lifecycleStage: stageFilter || undefined,
    limit: 100,
  });

  const deleteContact = trpc.crm.deleteContact.useMutation({
    onSuccess: () => {
      utils.crm.listContacts.invalidate();
      utils.crm.getStats.invalidate();
      toast.success("Contact deleted");
    },
  });

  const exportQuery = trpc.crm.exportContacts.useQuery(
    { lifecycleStage: stageFilter || undefined, search: search || undefined },
    { enabled: false }
  );

  const handleExport = useCallback(async () => {
    const result = await exportQuery.refetch();
    if (!result.data) return;
    const headers = ["firstName", "lastName", "email", "phone", "title", "lifecycleStage", "source", "healthScore", "tags", "createdAt"];
    const csv = [headers.join(","), ...result.data.map((r) =>
      headers.map((h) => `"${String((r as any)[h] ?? "").replace(/"/g, '""')}"`).join(",")
    )].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "contacts.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${result.data.length} contacts`);
  }, [exportQuery, toast]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
          <Input
            placeholder="Search contacts…"
            className="pl-9 bg-[#111] border-[#2a2a2a] text-[#e5e5e5] placeholder:text-[#555]"
            value={search}
            onChange={(e) => { const v = e.target.value; startSearchTransition(() => setSearch(v)); }}
          />
        </div>
        <Select value={stageFilter} onValueChange={(v) => startSearchTransition(() => setStageFilter(v))}>
          <SelectTrigger className="w-36 bg-[#111] border-[#2a2a2a] text-[#e5e5e5]">
            <Filter className="w-3 h-3 mr-1 text-[#555]" />
            <SelectValue placeholder="All stages" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-[#333]">
            <SelectItem value="" className="text-[#e5e5e5]">All stages</SelectItem>
            {Object.entries(LIFECYCLE_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v} className="text-[#e5e5e5]">{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="border-[#333] text-[#888] hover:text-[#e5e5e5]" onClick={handleExport}>
          <Download className="w-3 h-3 mr-1" /> Export
        </Button>
        <Button
          size="sm"
          className="bg-[#f5c842] text-black hover:bg-[#f5c842]/90"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="w-3 h-3 mr-1" /> Add Contact
        </Button>
      </div>

      {isLoading ? (
        <SkeletonRows rows={6} />
      ) : contacts.length === 0 ? (
        <div className="text-center py-16 text-[#555]">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No contacts yet. Add your first contact to get started.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#2a2a2a] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a] bg-[#111]">
                <th className="text-left px-4 py-3 text-[#666] font-medium">Name</th>
                <th className="text-left px-4 py-3 text-[#666] font-medium hidden md:table-cell">Contact</th>
                <th className="text-left px-4 py-3 text-[#666] font-medium hidden lg:table-cell">Company</th>
                <th className="text-left px-4 py-3 text-[#666] font-medium">Stage</th>
                <th className="text-right px-4 py-3 text-[#666] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr
                  key={contact.id}
                  className="border-b border-[#1e1e1e] hover:bg-[#1a1a1a] cursor-pointer transition-colors"
                  onClick={() => navigate(`/crm/${contact.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#f5c842]/20 flex items-center justify-center text-[#f5c842] text-xs font-bold shrink-0">
                        {contact.firstName[0]}{contact.lastName?.[0] ?? ""}
                      </div>
                      <div>
                        <p className="font-medium text-[#e5e5e5]">{contact.firstName} {contact.lastName}</p>
                        {contact.title && <p className="text-xs text-[#666]">{contact.title}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="space-y-0.5">
                      {contact.email && (
                        <div className="flex items-center gap-1 text-[#888] text-xs">
                          <Mail className="w-3 h-3" /> {contact.email}
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-1 text-[#888] text-xs">
                          <Phone className="w-3 h-3" /> {contact.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-[#888] text-xs">
                    {(contact as any).company?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${LIFECYCLE_COLORS[contact.lifecycleStage] ?? ""}`}>
                      {LIFECYCLE_LABELS[contact.lifecycleStage]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#555] hover:text-[#e5e5e5]">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#333]">
                        <DropdownMenuItem className="text-[#e5e5e5] cursor-pointer" onClick={() => navigate(`/crm/${contact.id}`)}>
                          <Edit2 className="w-3 h-3 mr-2" /> View / Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-400 cursor-pointer"
                          onClick={() => deleteContact.mutate({ id: contact.id })}
                        >
                          <Trash2 className="w-3 h-3 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddContactDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

// ─── Companies Tab ────────────────────────────────────────────────────────────
function CompaniesTab() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const { data: companies = [], isLoading } = trpc.crm.listCompanies.useQuery({ search: search || undefined });

  const deleteCompany = trpc.crm.deleteCompany.useMutation({
    onSuccess: () => {
      utils.crm.listCompanies.invalidate();
      toast.success("Company deleted");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
          <Input
            placeholder="Search companies…"
            className="pl-9 bg-[#111] border-[#2a2a2a] text-[#e5e5e5] placeholder:text-[#555]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button size="sm" className="bg-[#f5c842] text-black hover:bg-[#f5c842]/90" onClick={() => setAddOpen(true)}>
          <Plus className="w-3 h-3 mr-1" /> Add Company
        </Button>
      </div>

      {isLoading ? (
        <SkeletonRows rows={4} />
      ) : companies.length === 0 ? (
        <div className="text-center py-16 text-[#555]">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No companies yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {companies.map((company) => (
            <div
              key={company.id}
              className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#f5c842]/30 transition-colors cursor-pointer group"
              onClick={() => navigate(`/crm/companies/${company.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#f5c842]/10 flex items-center justify-center text-[#f5c842] font-bold text-sm">
                    {company.name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-[#e5e5e5]">{company.name}</p>
                    <p className="text-xs text-[#666]">{company.industry ?? "No industry"}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#555] opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#333]">
                    <DropdownMenuItem className="text-red-400 cursor-pointer" onClick={(e) => { e.stopPropagation(); deleteCompany.mutate({ id: company.id }); }}>
                      <Trash2 className="w-3 h-3 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-[#666]">
                <span className="capitalize">{company.size}</span>
                <span>•</span>
                <span>{(company as any).contactCount ?? 0} contacts</span>
                {company.website && (
                  <>
                    <span>•</span>
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-[#f5c842]/70 hover:text-[#f5c842] truncate" onClick={(e) => e.stopPropagation()}>
                      {company.website.replace(/^https?:\/\//, "")}
                    </a>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddCompanyDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

// ─── Segments Tab ─────────────────────────────────────────────────────────────
function SegmentsTab() {
  const utils = trpc.useUtils();
  const [addOpen, setAddOpen] = useState(false);
  const [newSeg, setNewSeg] = useState({ name: "", description: "" });

  const { data: segments = [], isLoading } = trpc.crm.listSegments.useQuery();

  const createSeg = trpc.crm.createSegment.useMutation({
    onSuccess: () => {
      utils.crm.listSegments.invalidate();
      toast.success("Segment created");
      setAddOpen(false);
      setNewSeg({ name: "", description: "" });
    },
  });

  const deleteSeg = trpc.crm.deleteSegment.useMutation({
    onSuccess: () => utils.crm.listSegments.invalidate(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#666]">Smart segments auto-update based on contact properties.</p>
        <Button size="sm" className="bg-[#f5c842] text-black hover:bg-[#f5c842]/90" onClick={() => setAddOpen(true)}>
          <Plus className="w-3 h-3 mr-1" /> New Segment
        </Button>
      </div>

      {isLoading ? (
        <SkeletonRows rows={3} />
      ) : segments.length === 0 ? (
        <div className="text-center py-16 text-[#555]">
          <Layers className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No segments yet. Create one to group contacts by criteria.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {segments.map((seg) => (
            <div key={seg.id} className="flex items-center justify-between bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 hover:border-[#333] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-[#e5e5e5] text-sm">{seg.name}</p>
                  {seg.description && <p className="text-xs text-[#666]">{seg.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#666] bg-[#1a1a1a] px-2 py-0.5 rounded-full">
                  {seg.contactCount ?? 0} contacts
                </span>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#555] hover:text-red-400"
                  onClick={() => deleteSeg.mutate({ id: seg.id })}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-[#e5e5e5] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#f5c842]">New Segment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-[#888]">Segment Name *</Label>
              <Input className="bg-[#111] border-[#333] text-[#e5e5e5] mt-1" value={newSeg.name}
                onChange={(e) => setNewSeg((s) => ({ ...s, name: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-[#888]">Description</Label>
              <Input className="bg-[#111] border-[#333] text-[#e5e5e5] mt-1" value={newSeg.description}
                onChange={(e) => setNewSeg((s) => ({ ...s, description: e.target.value }))} />
            </div>
            <p className="text-xs text-[#555]">Segment rules can be configured after creation from the segment detail view.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)} className="text-[#888]">Cancel</Button>
            <Button
              className="bg-[#f5c842] text-black hover:bg-[#f5c842]/90"
              disabled={!newSeg.name || createSeg.isPending}
              onClick={() => createSeg.mutate({ name: newSeg.name, description: newSeg.description, filterRules: { logic: "AND", rules: [] } })}
            >
              Create Segment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main CRM Page ────────────────────────────────────────────────────────────
export default function CRM() {
  const [activeTab, setActiveTab] = useState<Tab>("contacts");
  const { data: stats } = trpc.crm.getStats.useQuery();

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "contacts", label: "Contacts", icon: <Users className="w-4 h-4" />, count: stats?.totalContacts },
    { id: "companies", label: "Companies", icon: <Building2 className="w-4 h-4" />, count: stats?.totalCompanies },
    { id: "segments", label: "Segments", icon: <Layers className="w-4 h-4" /> },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 animate-[oh-fade-up_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e5e5e5]">CRM</h1>
          <p className="text-sm text-[#666] mt-0.5">Contacts, companies, and smart segments</p>
        </div>
        {stats && (
          <div className="hidden md:flex items-center gap-4 text-sm">
            {Object.entries(stats.byStage ?? {}).map(([stage, count]) => (
              <div key={stage} className="text-center">
                <p className="text-lg font-bold text-[#f5c842]">{count as number}</p>
                <p className="text-xs text-[#666]">{LIFECYCLE_LABELS[stage]}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#111] rounded-xl p-1 w-fit border border-[#2a2a2a]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-[#f5c842] text-black"
                : "text-[#666] hover:text-[#e5e5e5]"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? "bg-black/20 text-black" : "bg-[#1a1a1a] text-[#555]"}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "contacts" && <ContactsTab />}
      {activeTab === "companies" && <CompaniesTab />}
      {activeTab === "segments" && <SegmentsTab />}
    </div>
  );
}
