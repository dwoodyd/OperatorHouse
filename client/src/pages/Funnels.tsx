import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Filter, BarChart3, Eye, MousePointerClick, Edit2, Trash2,
  Globe, Archive, FileText, ExternalLink, Copy, Zap, Users, BookOpen, Briefcase,
} from "lucide-react";
import { SkeletonCards } from "@/components/StateUI";
import { format } from "date-fns";

type FunnelTemplate = {
  id: "lead_magnet" | "consultation" | "webinar" | "service" | "case_study" | "blank";
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
};

const TEMPLATES: FunnelTemplate[] = [
  { id: "lead_magnet", label: "Lead Magnet", description: "Offer a free resource in exchange for contact info", icon: Zap, color: "#f5c842" },
  { id: "consultation", label: "Consultation", description: "Book discovery calls and strategy sessions", icon: Users, color: "#60a5fa" },
  { id: "webinar", label: "Webinar", description: "Register attendees for live or recorded training", icon: BookOpen, color: "#34d399" },
  { id: "service", label: "Service Page", description: "Showcase and sell your services", icon: Briefcase, color: "#a78bfa" },
  { id: "case_study", label: "Case Study", description: "Share client results to build credibility", icon: FileText, color: "#fb923c" },
  { id: "blank", label: "Blank", description: "Start from scratch with a clean canvas", icon: Plus, color: "#6b7280" },
];

const STATUS_CONFIG = {
  draft: { label: "Draft", color: "bg-white/10 text-ivory/60 border-white/10" },
  published: { label: "Live", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  archived: { label: "Archived", color: "bg-white/5 text-ivory/30 border-white/5" },
};

function CreateFunnelDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [step, setStep] = useState<"template" | "details">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<FunnelTemplate["id"]>("blank");
  const [form, setForm] = useState({ name: "", description: "" });

  const create = trpc.funnels.createFunnel.useMutation({
    onSuccess: (result) => {
      utils.funnels.listFunnels.invalidate();
      toast.success("Funnel created!");
      onClose();
      setLocation(`/funnels/${result.id}/edit`);
    },
    onError: (e) => toast.error(e.message),
  });

  function handleClose() {
    setStep("template");
    setForm({ name: "", description: "" });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1a1a1a] border-white/10 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-ivory">
            {step === "template" ? "Choose a Template" : "Name Your Funnel"}
          </DialogTitle>
        </DialogHeader>

        {step === "template" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2">
            {TEMPLATES.map((t) => {
              const Icon = t.icon;
              const selected = selectedTemplate === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selected
                      ? "border-[#f5c842]/50 bg-[#f5c842]/5"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${t.color}20` }}>
                    <Icon className="w-4 h-4" style={{ color: t.color }} />
                  </div>
                  <div className="text-ivory text-sm font-medium">{t.label}</div>
                  <div className="text-ivory/40 text-xs mt-1 leading-tight">{t.description}</div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-ivory/70 text-xs uppercase tracking-wider">Funnel Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Free Strategy Session"
                className="bg-white/5 border-white/10 text-ivory mt-1"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-ivory/70 text-xs uppercase tracking-wider">Description (optional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What is this funnel for?"
                className="bg-white/5 border-white/10 text-ivory mt-1 resize-none"
                rows={2}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "template" ? (
            <>
              <Button variant="ghost" onClick={handleClose} className="text-ivory/60">Cancel</Button>
              <Button
                onClick={() => setStep("details")}
                className="bg-[#f5c842] text-black hover:bg-[#f5c842]/90"
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep("template")} className="text-ivory/60">Back</Button>
              <Button
                onClick={() => create.mutate({ name: form.name, description: form.description || undefined, templateType: selectedTemplate })}
                disabled={create.isPending || !form.name.trim()}
                className="bg-[#f5c842] text-black hover:bg-[#f5c842]/90"
              >
                {create.isPending ? "Creating…" : "Create Funnel"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function FunnelsPage() {
  const [, setLocation] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const utils = trpc.useUtils();

  const { data: funnelList, isLoading } = trpc.funnels.listFunnels.useQuery();

  const updateFunnel = trpc.funnels.updateFunnel.useMutation({
    onSuccess: () => { utils.funnels.listFunnels.invalidate(); toast.success("Updated"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteFunnel = trpc.funnels.deleteFunnel.useMutation({
    onSuccess: () => { utils.funnels.listFunnels.invalidate(); toast.success("Funnel deleted"); },
    onError: (e) => toast.error(e.message),
  });

  function copyPublicLink(slug: string) {
    navigator.clipboard.writeText(`${window.location.origin}/f/${slug}`);
    toast.success("Public link copied!");
  }

  const totalViews = funnelList?.reduce((s, f) => s + f.totalViews, 0) ?? 0;
  const totalSubs = funnelList?.reduce((s, f) => s + f.totalSubmissions, 0) ?? 0;
  const liveCount = funnelList?.filter((f) => f.status === "published").length ?? 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ivory tracking-tight">Funnel Builder</h1>
          <p className="text-ivory/50 text-sm mt-1">Build landing pages and lead capture funnels</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-[#f5c842] text-black hover:bg-[#f5c842]/90 font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Funnel
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Funnels", value: funnelList?.length ?? 0, icon: Filter, color: "#f5c842" },
          { label: "Live", value: liveCount, icon: Globe, color: "#34d399" },
          { label: "Total Views", value: totalViews.toLocaleString(), icon: Eye, color: "#60a5fa" },
          { label: "Submissions", value: totalSubs.toLocaleString(), icon: MousePointerClick, color: "#a78bfa" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-white/5 border-white/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <div className="text-2xl font-bold text-ivory">{value}</div>
                <div className="text-xs text-ivory/50">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Funnel Grid */}
      {isLoading ? (
        <SkeletonCards count={3} />
      ) : !funnelList?.length ? (
        <div className="text-center py-20 text-ivory/40">
          <Filter className="w-14 h-14 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No funnels yet</p>
          <p className="text-sm mt-1">Create your first funnel to start capturing leads</p>
          <Button
            onClick={() => setShowCreate(true)}
            className="mt-4 bg-[#f5c842] text-black hover:bg-[#f5c842]/90"
          >
            <Plus className="w-4 h-4 mr-2" /> Create Your First Funnel
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {funnelList.map((f) => {
            const statusCfg = STATUS_CONFIG[f.status];
            const convRate = f.totalViews > 0
              ? ((f.totalSubmissions / f.totalViews) * 100).toFixed(1)
              : "0.0";

            return (
              <Card key={f.id} className="bg-white/5 border-white/10 hover:border-white/20 transition-colors group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-ivory text-base leading-tight">{f.name}</CardTitle>
                    <Badge className={`${statusCfg.color} border text-xs shrink-0`}>{statusCfg.label}</Badge>
                  </div>
                  {f.description && (
                    <p className="text-ivory/40 text-xs line-clamp-2 mt-1">{f.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="text-ivory font-semibold text-sm">{f.totalViews.toLocaleString()}</div>
                      <div className="text-ivory/40 text-xs">Views</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="text-ivory font-semibold text-sm">{f.totalSubmissions.toLocaleString()}</div>
                      <div className="text-ivory/40 text-xs">Leads</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="text-[#f5c842] font-semibold text-sm">{convRate}%</div>
                      <div className="text-ivory/40 text-xs">Conv.</div>
                    </div>
                  </div>

                  <div className="text-xs text-ivory/30">
                    Updated {format(new Date(f.updatedAt), "MMM d, yyyy")}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-ivory/60 hover:text-ivory h-7 px-2 text-xs"
                      onClick={() => setLocation(`/funnels/${f.id}/edit`)}
                    >
                      <Edit2 className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    {f.status === "published" ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-ivory/60 hover:text-ivory h-7 px-2 text-xs"
                          onClick={() => copyPublicLink(f.slug)}
                        >
                          <Copy className="w-3 h-3 mr-1" /> Copy Link
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-ivory/60 hover:text-ivory h-7 px-2 text-xs"
                          onClick={() => window.open(`/f/${f.slug}`, "_blank")}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-emerald-400/70 hover:text-emerald-400 h-7 px-2 text-xs"
                        onClick={() => updateFunnel.mutate({ id: f.id, status: "published" })}
                      >
                        <Globe className="w-3 h-3 mr-1" /> Publish
                      </Button>
                    )}
                    <div className="flex-1" />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-ivory/40 hover:text-red-400 h-7 w-7 p-0"
                      onClick={() => {
                        if (confirm("Delete this funnel and all its data?")) {
                          deleteFunnel.mutate({ id: f.id });
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateFunnelDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
