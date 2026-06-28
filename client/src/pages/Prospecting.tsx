import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Plus, Search, MapPin, Globe, Phone, Mail, User,
  ChevronRight, Copy, Check, ExternalLink, Target, Telescope,
  MessageSquare, BookOpen, Rocket,
} from "lucide-react";
import { useLocation } from "wouter";

// ─── Constants ────────────────────────────────────────────────────────────────
const STAGES = ["Prospect", "Contacted", "Responded", "Meeting", "Closed"] as const;
type Stage = typeof STAGES[number];

const SOURCES = [
  { value: "google_maps", label: "Google Maps" },
  { value: "facebook_groups", label: "Facebook Groups" },
  { value: "causeiq", label: "CauseIQ" },
  { value: "referral", label: "Referral" },
  { value: "manual", label: "Manual" },
  { value: "other", label: "Other" },
] as const;

const STAGE_COLORS: Record<Stage, string> = {
  Prospect: "bg-zinc-800/60 border-zinc-700",
  Contacted: "bg-blue-950/60 border-blue-800",
  Responded: "bg-amber-950/60 border-amber-800",
  Meeting: "bg-violet-950/60 border-violet-800",
  Closed: "bg-emerald-950/60 border-emerald-800",
};

const STAGE_BADGE: Record<Stage, string> = {
  Prospect: "bg-zinc-700 text-zinc-200",
  Contacted: "bg-blue-900 text-blue-200",
  Responded: "bg-amber-900 text-amber-200",
  Meeting: "bg-violet-900 text-violet-200",
  Closed: "bg-emerald-900 text-emerald-200",
};

// ─── Lead Finder Data ─────────────────────────────────────────────────────────
const LEAD_CATEGORIES = [
  { name: "Restaurants & Cafes", noWebsiteRate: "~65%", searchTip: 'Google Maps → "[niche] near [city]" → look for "No website"', source: "google_maps" },
  { name: "Salons & Barbershops", noWebsiteRate: "~72%", searchTip: 'Google Maps → "salon" OR "barbershop" near [city]', source: "google_maps" },
  { name: "Auto Repair Shops", noWebsiteRate: "~58%", searchTip: 'Google Maps → "auto repair" near [city]', source: "google_maps" },
  { name: "Nonprofits (501c3)", noWebsiteRate: "~45%", searchTip: "causeiq.com → filter by state → sort by revenue ($100K–$2M)", source: "causeiq" },
  { name: "Local FB Groups", noWebsiteRate: "~80%", searchTip: '"[city] business owners" OR "[city] entrepreneurs" group', source: "facebook_groups" },
  { name: "Cleaning Services", noWebsiteRate: "~70%", searchTip: 'Google Maps → "cleaning service" near [city]', source: "google_maps" },
  { name: "Landscaping", noWebsiteRate: "~68%", searchTip: 'Google Maps → "landscaping" OR "lawn care" near [city]', source: "google_maps" },
  { name: "Plumbers / Electricians", noWebsiteRate: "~55%", searchTip: 'Google Maps → "plumber" OR "electrician" near [city]', source: "google_maps" },
];

const LEAD_FINDER_STEPS = [
  {
    title: "Google Maps Method",
    icon: MapPin,
    color: "text-blue-400",
    steps: [
      'Search "[niche] near [city]" on Google Maps',
      "Filter by 4+ stars to find established businesses",
      'Click each result — look for "No website" in the listing',
      "Copy the business name, phone, and owner name if listed",
      "Add them to your Pipeline as a Prospect",
    ],
  },
  {
    title: "Facebook Groups Method",
    icon: MessageSquare,
    color: "text-indigo-400",
    steps: [
      'Search Facebook for "[city] business owners"',
      "Join 3–5 active groups (1,000+ members)",
      "Look for posts asking for website help",
      "DM the owner directly — reference their post",
      "Add to Pipeline before you reach out",
    ],
  },
  {
    title: "CauseIQ Method (Nonprofits)",
    icon: BookOpen,
    color: "text-amber-400",
    steps: [
      "Go to causeiq.com and filter by your state",
      "Sort by annual revenue ($100K–$2M sweet spot)",
      "Look for orgs with outdated or no website",
      "Find the Executive Director on LinkedIn",
      "Lead with mission-aligned messaging",
    ],
  },
];

// ─── Outreach Scripts ─────────────────────────────────────────────────────────
const OUTREACH_SCRIPTS = [
  {
    title: "Web Dev — Cold DM (No Website)",
    tag: "Web Dev",
    tagColor: "bg-blue-900 text-blue-200",
    script: `Hey [Name] 👋

I found [Business Name] on Google Maps and noticed you don't have a website yet.

I help local businesses like yours get a clean, professional site that actually brings in customers — not just a digital business card.

I'm currently taking on 2 new clients this month. Would you be open to a quick 15-min call to see if it's a fit?

— [Your Name]`,
  },
  {
    title: "Speaking — Outreach to Event Organizers",
    tag: "Speaking",
    tagColor: "bg-violet-900 text-violet-200",
    script: `Hi [Name],

I came across [Organization/Event] and love what you're doing for [community/industry].

I speak on [topic] and have helped audiences at [past event/company] achieve [specific result].

I'd love to explore if there's a fit for an upcoming event. Do you have 10 minutes this week?

— [Your Name]`,
  },
  {
    title: "Coaching — Discovery Call Invite",
    tag: "Coaching",
    tagColor: "bg-emerald-900 text-emerald-200",
    script: `Hey [Name],

I've been following your work and I think you're closer to [goal] than you realize — you just need a clear system.

I work with [target client type] to [specific outcome] in [timeframe].

I have one spot open right now. Want to hop on a free 20-min clarity call to map out your next 90 days?

— [Your Name]`,
  },
  {
    title: "General — Referral Ask",
    tag: "Referral",
    tagColor: "bg-amber-900 text-amber-200",
    script: `Hey [Name],

Quick ask — do you know anyone who [problem your service solves]?

I'm specifically looking for [ideal client description] who want [outcome].

If someone comes to mind, I'd love an intro. Happy to return the favor anytime.

— [Your Name]`,
  },
];

// ─── Add/Edit Lead Modal ──────────────────────────────────────────────────────
type LeadForm = {
  businessName: string; ownerName: string; email: string; phone: string;
  website: string; location: string; category: string; source: string;
  stage: Stage; notes: string; noWebsite: boolean; estimatedValue: string;
};

const EMPTY_FORM: LeadForm = {
  businessName: "", ownerName: "", email: "", phone: "",
  website: "", location: "", category: "", source: "manual",
  stage: "Prospect", notes: "", noWebsite: false, estimatedValue: "",
};

function LeadModal({ open, onClose, initial, editId }: {
  open: boolean; onClose: () => void; initial?: Partial<LeadForm>; editId?: number;
}) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState<LeadForm>({ ...EMPTY_FORM, ...initial });

  const create = trpc.prospecting.create.useMutation({
    onSuccess: () => { utils.prospecting.list.invalidate(); utils.prospecting.stats.invalidate(); onClose(); toast.success("Lead added"); },
    onError: (e) => toast.error(e.message),
  });
  const update = trpc.prospecting.update.useMutation({
    onSuccess: () => { utils.prospecting.list.invalidate(); onClose(); toast.success("Lead updated"); },
    onError: (e) => toast.error(e.message),
  });

  const set = (k: keyof LeadForm, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    const payload = {
      businessName: form.businessName.trim(),
      ownerName: form.ownerName || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      website: form.website || undefined,
      location: form.location || undefined,
      category: form.category || undefined,
      source: form.source as any,
      stage: form.stage,
      notes: form.notes || undefined,
      noWebsite: form.noWebsite,
      estimatedValue: form.estimatedValue ? parseFloat(form.estimatedValue) : undefined,
    };
    if (editId) update.mutate({ id: editId, ...payload });
    else create.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg bg-zinc-900 border-zinc-700 text-zinc-100">
        <DialogHeader>
          <DialogTitle>{editId ? "Edit Lead" : "Add New Lead"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-zinc-400 text-xs mb-1 block">Business Name *</Label>
              <Input value={form.businessName} onChange={e => set("businessName", e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100" placeholder="e.g. Tony's Auto Repair" />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs mb-1 block">Owner Name</Label>
              <Input value={form.ownerName} onChange={e => set("ownerName", e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100" placeholder="First Last" />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs mb-1 block">Location</Label>
              <Input value={form.location} onChange={e => set("location", e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100" placeholder="City, State" />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs mb-1 block">Phone</Label>
              <Input value={form.phone} onChange={e => set("phone", e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100" placeholder="(555) 000-0000" />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs mb-1 block">Email</Label>
              <Input value={form.email} onChange={e => set("email", e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100" placeholder="owner@biz.com" />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs mb-1 block">Website</Label>
              <Input value={form.website} onChange={e => set("website", e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100" placeholder="https://..." />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs mb-1 block">Category</Label>
              <Input value={form.category} onChange={e => set("category", e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100" placeholder="Restaurant, Salon…" />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs mb-1 block">Source</Label>
              <Select value={form.source} onValueChange={v => set("source", v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {SOURCES.map(s => <SelectItem key={s.value} value={s.value} className="text-zinc-100">{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-zinc-400 text-xs mb-1 block">Stage</Label>
              <Select value={form.stage} onValueChange={v => set("stage", v as Stage)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {STAGES.map(s => <SelectItem key={s} value={s} className="text-zinc-100">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-zinc-400 text-xs mb-1 block">Est. Value ($)</Label>
              <Input value={form.estimatedValue} onChange={e => set("estimatedValue", e.target.value)}
                type="number" className="bg-zinc-800 border-zinc-700 text-zinc-100" placeholder="2500" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="noWebsite" checked={form.noWebsite}
                onChange={e => set("noWebsite", e.target.checked)} className="accent-amber-500 w-4 h-4" />
              <Label htmlFor="noWebsite" className="text-zinc-300 text-sm cursor-pointer">No website (high-priority prospect)</Label>
            </div>
            <div className="col-span-2">
              <Label className="text-zinc-400 text-xs mb-1 block">Notes</Label>
              <Textarea value={form.notes} onChange={e => set("notes", e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 resize-none" rows={3}
                placeholder="Any context, next steps, or observations…" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-zinc-400">Cancel</Button>
          <Button onClick={handleSubmit} disabled={!form.businessName.trim() || create.isPending || update.isPending}
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold">
            {editId ? "Save Changes" : "Add Lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Lead Card ────────────────────────────────────────────────────────────────
function LeadCard({ lead, onEdit, onDelete, onMoveStage }: {
  lead: any; onEdit: (l: any) => void; onDelete: (id: number) => void; onMoveStage: (id: number, stage: Stage) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const stageIdx = STAGES.indexOf(lead.stage as Stage);
  const nextStage = stageIdx < STAGES.length - 1 ? STAGES[stageIdx + 1] : null;

  return (
    <div className={`rounded-lg border p-3 cursor-pointer transition-all ${STAGE_COLORS[lead.stage as Stage]} hover:border-zinc-500`}
      onClick={() => setExpanded(e => !e)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-zinc-100 text-sm truncate">{lead.businessName}</span>
            {lead.noWebsite && <Badge className="bg-amber-900 text-amber-300 text-[10px] px-1.5 py-0">NO SITE</Badge>}
          </div>
          {lead.ownerName && <p className="text-zinc-400 text-xs mt-0.5 flex items-center gap-1"><User className="w-3 h-3" />{lead.ownerName}</p>}
          {lead.location && <p className="text-zinc-500 text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.location}</p>}
        </div>
        {lead.estimatedValue && <span className="text-emerald-400 text-xs font-mono shrink-0">${Number(lead.estimatedValue).toLocaleString()}</span>}
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 border-t border-zinc-700 pt-3" onClick={e => e.stopPropagation()}>
          {lead.phone && <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white"><Phone className="w-3 h-3 text-zinc-500" />{lead.phone}</a>}
          {lead.email && <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white"><Mail className="w-3 h-3 text-zinc-500" />{lead.email}</a>}
          {lead.website && (
            <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300">
              <Globe className="w-3 h-3" />{lead.website}<ExternalLink className="w-3 h-3" />
            </a>
          )}
          {lead.notes && <p className="text-zinc-400 text-xs bg-zinc-900/50 rounded p-2">{lead.notes}</p>}
          <div className="flex gap-2 pt-1 flex-wrap">
            {nextStage && (
              <Button size="sm" variant="outline" className="text-xs h-7 border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                onClick={() => onMoveStage(lead.id, nextStage)}>
                Move to {nextStage} <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            )}
            <Button size="sm" variant="outline" className="text-xs h-7 border-zinc-600 text-zinc-300 hover:bg-zinc-700"
              onClick={() => onEdit(lead)}>Edit</Button>
            <Button size="sm" variant="ghost" className="text-xs h-7 text-red-400 hover:text-red-300 hover:bg-red-950"
              onClick={() => onDelete(lead.id)}>Delete</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Script Copy Button ───────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="text-zinc-400 hover:text-zinc-100 h-7 px-2">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      <span className="ml-1 text-xs">{copied ? "Copied" : "Copy"}</span>
    </Button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Prospecting() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editLead, setEditLead] = useState<any>(null);
  const [prefillSource, setPrefillSource] = useState<string>("manual");

  const { data: leads = [], isLoading } = trpc.prospecting.list.useQuery();
  const { data: stats = {} } = trpc.prospecting.stats.useQuery();

  const deleteMutation = trpc.prospecting.delete.useMutation({
    onSuccess: () => { utils.prospecting.list.invalidate(); utils.prospecting.stats.invalidate(); toast.success("Lead removed"); },
    onError: (e) => toast.error(e.message),
  });

  const moveStageMutation = trpc.prospecting.moveStage.useMutation({
    onMutate: async ({ id, stage }) => {
      await utils.prospecting.list.cancel();
      const prev = utils.prospecting.list.getData();
      utils.prospecting.list.setData(undefined, (old) => old?.map(l => l.id === id ? { ...l, stage } : l) ?? []);
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) utils.prospecting.list.setData(undefined, ctx.prev); },
    onSettled: () => { utils.prospecting.list.invalidate(); utils.prospecting.stats.invalidate(); },
  });

  const filtered = leads.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.businessName.toLowerCase().includes(q) || (l.ownerName ?? "").toLowerCase().includes(q) ||
      (l.location ?? "").toLowerCase().includes(q) || (l.category ?? "").toLowerCase().includes(q);
  });

  const byStage = (stage: Stage) => filtered.filter(l => l.stage === stage);

  return (
    <AppLayout title="Prospecting HQ" subtitle="Find, track, and close your next clients">
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Telescope className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100">Specter Prospecting HQ</h1>
              <p className="text-zinc-500 text-xs">Find, track, and close your next clients</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/apollo")} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-sm">
              <Rocket className="w-4 h-4 mr-1 text-[#f5c842]" /> Apollo Search
            </Button>
            <Button onClick={() => setAddOpen(true)} className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm">
              <Plus className="w-4 h-4 mr-1" /> Add Lead
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex gap-2 flex-wrap">
          {STAGES.map(stage => (
            <div key={stage} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${STAGE_COLORS[stage]}`}>
              <span className="text-zinc-300">{stage}</span>
              <span className={`font-bold px-1.5 py-0.5 rounded-full text-[10px] ${STAGE_BADGE[stage]}`}>{(stats as any)[stage] ?? 0}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-800 text-xs">
            <Target className="w-3 h-3 text-zinc-400" />
            <span className="text-zinc-300">Total</span>
            <span className="font-bold text-zinc-100">{leads.length}</span>
          </div>
        </div>

        <Tabs defaultValue="pipeline" className="space-y-4">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="pipeline" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-400">Pipeline</TabsTrigger>
            <TabsTrigger value="finder" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-400">Lead Finder</TabsTrigger>
            <TabsTrigger value="scripts" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-400">Outreach Scripts</TabsTrigger>
          </TabsList>

          {/* ── Pipeline Tab ── */}
          <TabsContent value="pipeline">
            <div className="mb-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads…"
                  className="pl-9 bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" />
              </div>
            </div>

            {isLoading ? (
              <div className="text-zinc-500 text-sm py-12 text-center">Loading leads…</div>
            ) : leads.length === 0 ? (
              <div className="text-center py-16">
                <Telescope className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-400 font-medium">No leads yet</p>
                <p className="text-zinc-600 text-sm mt-1">Use the Lead Finder tab to discover prospects, then add them here.</p>
                <Button onClick={() => setAddOpen(true)} className="mt-4 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm">
                  <Plus className="w-4 h-4 mr-1" /> Add Your First Lead
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {STAGES.map(stage => {
                  const stageLeads = byStage(stage);
                  return (
                    <div key={stage} className="space-y-2">
                      <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${STAGE_COLORS[stage]}`}>
                        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">{stage}</span>
                        <Badge className={`text-[10px] px-1.5 ${STAGE_BADGE[stage]}`}>{stageLeads.length}</Badge>
                      </div>
                      <div className="space-y-2 min-h-[80px]">
                        {stageLeads.length === 0 ? (
                          <div className="border border-dashed border-zinc-800 rounded-lg p-4 text-center">
                            <p className="text-zinc-600 text-xs">Empty</p>
                          </div>
                        ) : stageLeads.map(lead => (
                          <LeadCard key={lead.id} lead={lead}
                            onEdit={setEditLead}
                            onDelete={(id) => deleteMutation.mutate({ id })}
                            onMoveStage={(id, s) => moveStageMutation.mutate({ id, stage: s })}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── Lead Finder Tab ── */}
          <TabsContent value="finder" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              {LEAD_FINDER_STEPS.map(method => {
                const Icon = method.icon;
                return (
                  <Card key={method.title} className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Icon className={`w-4 h-4 ${method.color}`} />
                        <span className="text-zinc-100">{method.title}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {method.steps.map((step, i) => (
                        <div key={i} className="flex gap-2 text-xs text-zinc-400">
                          <span className="text-zinc-600 font-mono shrink-0">{i + 1}.</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                High-Value Target Categories
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {LEAD_CATEGORIES.map(cat => (
                  <div key={cat.name} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:border-zinc-600 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-sm font-medium text-zinc-200">{cat.name}</span>
                      <Badge className="bg-amber-900 text-amber-300 text-[10px] shrink-0">{cat.noWebsiteRate}</Badge>
                    </div>
                    <p className="text-zinc-500 text-xs bg-zinc-950 rounded p-1.5">{cat.searchTip}</p>
                    <Button size="sm" variant="ghost"
                      className="mt-2 w-full text-xs h-7 text-amber-400 hover:text-amber-300 hover:bg-amber-950/30"
                      onClick={() => { setPrefillSource(cat.source); setAddOpen(true); }}>
                      <Plus className="w-3 h-3 mr-1" /> Add Lead
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── Outreach Scripts Tab ── */}
          <TabsContent value="scripts" className="space-y-4">
            <p className="text-zinc-500 text-sm">Copy-ready DM and email scripts. Replace bracketed placeholders before sending.</p>
            <div className="grid md:grid-cols-2 gap-4">
              {OUTREACH_SCRIPTS.map(script => (
                <Card key={script.title} className="bg-zinc-900 border-zinc-800">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm text-zinc-100">{script.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] ${script.tagColor}`}>{script.tag}</Badge>
                        <CopyButton text={script.script} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-sans leading-relaxed bg-zinc-950 rounded p-3">{script.script}</pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        {addOpen && (
          <LeadModal open={addOpen} onClose={() => { setAddOpen(false); setPrefillSource("manual"); }}
            initial={{ source: prefillSource as any }} />
        )}
        {editLead && (
          <LeadModal open={!!editLead} onClose={() => setEditLead(null)} editId={editLead.id}
            initial={{
              businessName: editLead.businessName, ownerName: editLead.ownerName ?? "",
              email: editLead.email ?? "", phone: editLead.phone ?? "",
              website: editLead.website ?? "", location: editLead.location ?? "",
              category: editLead.category ?? "", source: editLead.source ?? "manual",
              stage: editLead.stage, notes: editLead.notes ?? "",
              noWebsite: editLead.noWebsite ?? false,
              estimatedValue: editLead.estimatedValue ? String(editLead.estimatedValue) : "",
            }} />
        )}
      </div>
    </AppLayout>
  );
}
