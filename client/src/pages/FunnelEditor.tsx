import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Save, Globe, Eye, Plus, Trash2, GripVertical,
  Type, Image, List, FileText, MousePointerClick, ChevronUp, ChevronDown,
} from "lucide-react";
import { SkeletonRows } from "@/components/StateUI";

type Section = {
  type: string;
  content: Record<string, unknown>;
  styles?: Record<string, unknown>;
};

type FunnelPage = {
  id: number;
  name: string;
  slug: string;
  sections: Section[];
  formConfig: {
    fields: string[];
    submitAction: "show_message" | "redirect";
    redirectUrl?: string;
    thankYouMessage: string;
  } | null;
  isPublished: boolean;
  views: number;
  submissions: number;
};

const SECTION_TYPES = [
  { type: "hero", label: "Hero", icon: Type, description: "Headline + CTA" },
  { type: "benefits", label: "Benefits", icon: List, description: "Feature list" },
  { type: "about", label: "About", icon: FileText, description: "Text block" },
  { type: "form", label: "Form", icon: MousePointerClick, description: "Lead capture form" },
  { type: "results", label: "Results", icon: Eye, description: "Metrics / outcomes" },
];

// ─── Section Preview ──────────────────────────────────────────────────────────
function SectionPreview({ section }: { section: Section }) {
  const c = section.content as any;
  switch (section.type) {
    case "hero":
      return (
        <div className="py-12 px-8 text-center bg-gradient-to-b from-[#1a1a1a] to-[#111]">
          <h1 className="text-3xl font-bold text-ivory mb-3">{c.headline || "Your Headline"}</h1>
          {c.subheadline && <p className="text-ivory/60 text-lg mb-6">{c.subheadline}</p>}
          {c.cta && (
            <button className="px-6 py-3 bg-[#f5c842] text-black font-semibold rounded-lg">
              {c.cta}
            </button>
          )}
        </div>
      );
    case "benefits":
    case "agenda":
      return (
        <div className="py-10 px-8">
          <h2 className="text-xl font-bold text-ivory mb-4">{c.title || "Benefits"}</h2>
          <ul className="space-y-2">
            {(c.items ?? []).map((item: string, i: number) => (
              <li key={i} className="flex items-center gap-2 text-ivory/70">
                <div className="w-1.5 h-1.5 rounded-full bg-[#f5c842]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      );
    case "about":
      return (
        <div className="py-10 px-8">
          <h2 className="text-xl font-bold text-ivory mb-3">{c.title || "About"}</h2>
          <p className="text-ivory/60">{c.body || "Your content here."}</p>
        </div>
      );
    case "form":
      return (
        <div className="py-10 px-8">
          <h2 className="text-xl font-bold text-ivory mb-4">{c.title || "Get in Touch"}</h2>
          <div className="space-y-3 max-w-sm">
            {(c.fields ?? ["name", "email"]).map((field: string) => (
              <div key={field}>
                <label className="text-ivory/60 text-sm capitalize">{field}</label>
                <div className="mt-1 h-9 bg-white/10 rounded-lg border border-white/10" />
              </div>
            ))}
            <button className="w-full py-2.5 bg-[#f5c842] text-black font-semibold rounded-lg mt-2">
              Submit
            </button>
          </div>
        </div>
      );
    case "results":
      return (
        <div className="py-10 px-8">
          <h2 className="text-xl font-bold text-ivory mb-4">{c.title || "Results"}</h2>
          <div className="grid grid-cols-3 gap-4">
            {(c.metrics ?? []).map((m: string, i: number) => (
              <div key={i} className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-[#f5c842] font-bold text-lg">{m}</div>
              </div>
            ))}
          </div>
        </div>
      );
    default:
      return (
        <div className="py-8 px-8 text-center text-ivory/30 border border-dashed border-white/10 rounded-lg m-4">
          {section.type} section
        </div>
      );
  }
}

// ─── Section Editor ───────────────────────────────────────────────────────────
function SectionEditor({
  section, onChange, onDelete, onMoveUp, onMoveDown,
}: {
  section: Section;
  onChange: (s: Section) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const c = section.content as any;

  function updateContent(key: string, value: unknown) {
    onChange({ ...section, content: { ...section.content, [key]: value } });
  }

  function updateArrayItem(key: string, index: number, value: string) {
    const arr = [...((c[key] as string[]) ?? [])];
    arr[index] = value;
    updateContent(key, arr);
  }

  function addArrayItem(key: string) {
    const arr = [...((c[key] as string[]) ?? [])];
    arr.push("New item");
    updateContent(key, arr);
  }

  function removeArrayItem(key: string, index: number) {
    const arr = [...((c[key] as string[]) ?? [])];
    arr.splice(index, 1);
    updateContent(key, arr);
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-ivory/30" />
          <span className="text-ivory/70 text-sm font-medium capitalize">{section.type} Section</span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-ivory/40 hover:text-ivory" onClick={onMoveUp}>
            <ChevronUp className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-ivory/40 hover:text-ivory" onClick={onMoveDown}>
            <ChevronDown className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-ivory/40 hover:text-red-400" onClick={onDelete}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Hero fields */}
      {section.type === "hero" && (
        <div className="space-y-2">
          <Input value={c.headline ?? ""} onChange={(e) => updateContent("headline", e.target.value)}
            placeholder="Headline" className="bg-white/5 border-white/10 text-ivory text-sm" />
          <Input value={c.subheadline ?? ""} onChange={(e) => updateContent("subheadline", e.target.value)}
            placeholder="Subheadline" className="bg-white/5 border-white/10 text-ivory text-sm" />
          <Input value={c.cta ?? ""} onChange={(e) => updateContent("cta", e.target.value)}
            placeholder="Button text" className="bg-white/5 border-white/10 text-ivory text-sm" />
        </div>
      )}

      {/* Benefits / Agenda / Services fields */}
      {["benefits", "agenda", "services"].includes(section.type) && (
        <div className="space-y-2">
          <Input value={c.title ?? ""} onChange={(e) => updateContent("title", e.target.value)}
            placeholder="Section title" className="bg-white/5 border-white/10 text-ivory text-sm" />
          {(c.items ?? [] as string[]).map((item: string, i: number) => (
            <div key={i} className="flex gap-2">
              <Input value={item} onChange={(e) => updateArrayItem("items", i, e.target.value)}
                placeholder={`Item ${i + 1}`} className="bg-white/5 border-white/10 text-ivory text-sm" />
              <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-ivory/40 hover:text-red-400"
                onClick={() => removeArrayItem("items", i)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="ghost" className="text-ivory/50 hover:text-ivory text-xs"
            onClick={() => addArrayItem("items")}>
            <Plus className="w-3 h-3 mr-1" /> Add Item
          </Button>
        </div>
      )}

      {/* About fields */}
      {section.type === "about" && (
        <div className="space-y-2">
          <Input value={c.title ?? ""} onChange={(e) => updateContent("title", e.target.value)}
            placeholder="Section title" className="bg-white/5 border-white/10 text-ivory text-sm" />
          <Textarea value={c.body ?? ""} onChange={(e) => updateContent("body", e.target.value)}
            placeholder="Body text" className="bg-white/5 border-white/10 text-ivory text-sm resize-none" rows={3} />
        </div>
      )}

      {/* Form fields */}
      {section.type === "form" && (
        <div className="space-y-2">
          <Input value={c.title ?? ""} onChange={(e) => updateContent("title", e.target.value)}
            placeholder="Form title" className="bg-white/5 border-white/10 text-ivory text-sm" />
          <div className="text-xs text-ivory/40">Fields (comma-separated)</div>
          <Input
            value={(c.fields ?? []).join(", ")}
            onChange={(e) => updateContent("fields", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
            placeholder="name, email, phone, message"
            className="bg-white/5 border-white/10 text-ivory text-sm"
          />
        </div>
      )}

      {/* Results fields */}
      {section.type === "results" && (
        <div className="space-y-2">
          <Input value={c.title ?? ""} onChange={(e) => updateContent("title", e.target.value)}
            placeholder="Section title" className="bg-white/5 border-white/10 text-ivory text-sm" />
          {(c.metrics ?? [] as string[]).map((m: string, i: number) => (
            <div key={i} className="flex gap-2">
              <Input value={m} onChange={(e) => updateArrayItem("metrics", i, e.target.value)}
                placeholder={`Metric ${i + 1}`} className="bg-white/5 border-white/10 text-ivory text-sm" />
              <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-ivory/40 hover:text-red-400"
                onClick={() => removeArrayItem("metrics", i)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="ghost" className="text-ivory/50 hover:text-ivory text-xs"
            onClick={() => addArrayItem("metrics")}>
            <Plus className="w-3 h-3 mr-1" /> Add Metric
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main Funnel Editor ───────────────────────────────────────────────────────
export default function FunnelEditor() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const funnelId = parseInt(id ?? "0");

  const utils = trpc.useUtils();
  const { data: funnelData, isLoading } = trpc.funnels.getFunnel.useQuery({ id: funnelId }, { enabled: !!funnelId });

  const [activePage, setActivePage] = useState<FunnelPage | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeTab, setActiveTab] = useState("editor");
  const [isDirty, setIsDirty] = useState(false);

  // Initialize from server
  useEffect(() => {
    if (funnelData?.pages?.length && !activePage) {
      const page = funnelData.pages[0] as FunnelPage;
      setActivePage(page);
      setSections((page.sections as Section[]) ?? []);
    }
  }, [funnelData]);

  const updatePage = trpc.funnels.updatePage.useMutation({
    onSuccess: () => {
      utils.funnels.getFunnel.invalidate({ id: funnelId });
      setIsDirty(false);
      toast.success("Page saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateFunnel = trpc.funnels.updateFunnel.useMutation({
    onSuccess: () => {
      utils.funnels.getFunnel.invalidate({ id: funnelId });
      toast.success("Funnel published!");
    },
    onError: (e) => toast.error(e.message),
  });

  function handleSave() {
    if (!activePage) return;
    updatePage.mutate({ id: activePage.id, sections });
    setIsDirty(false);
  }

  function addSection(type: string) {
    const defaults: Record<string, Record<string, unknown>> = {
      hero: { headline: "Your Headline", subheadline: "Your subheadline", cta: "Get Started" },
      benefits: { title: "Key Benefits", items: ["Benefit 1", "Benefit 2", "Benefit 3"] },
      about: { title: "About This", body: "Tell your story here." },
      form: { title: "Get in Touch", fields: ["name", "email"] },
      results: { title: "The Results", metrics: ["100%", "50+", "$10K"] },
    };
    const newSection: Section = { type, content: defaults[type] ?? {}, styles: {} };
    setSections([...sections, newSection]);
    setIsDirty(true);
  }

  function updateSection(index: number, updated: Section) {
    const newSections = [...sections];
    newSections[index] = updated;
    setSections(newSections);
    setIsDirty(true);
  }

  function deleteSection(index: number) {
    setSections(sections.filter((_, i) => i !== index));
    setIsDirty(true);
  }

  function moveSection(index: number, direction: "up" | "down") {
    const newSections = [...sections];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newSections.length) return;
    [newSections[index], newSections[target]] = [newSections[target], newSections[index]];
    setSections(newSections);
    setIsDirty(true);
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <SkeletonRows rows={6} />
      </div>
    );
  }

  if (!funnelData) {
    return (
      <div className="p-6 text-center text-ivory/40">
        <p>Funnel not found</p>
        <Button variant="ghost" onClick={() => setLocation("/funnels")} className="mt-3 text-ivory/60">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Funnels
        </Button>
      </div>
    );
  }

  const isPublished = funnelData.status === "published";

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#111]">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/funnels")} className="text-ivory/60 hover:text-ivory">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <span className="text-ivory font-semibold text-sm">{funnelData.name}</span>
            {isDirty && <span className="text-amber-400 text-xs ml-2">· Unsaved changes</span>}
          </div>
          <Badge className={`text-xs border ${isPublished ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-white/10 text-ivory/60 border-white/10"}`}>
            {isPublished ? "Live" : "Draft"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {isPublished && (
            <Button
              size="sm"
              variant="ghost"
              className="text-ivory/60 hover:text-ivory"
              onClick={() => window.open(`/f/${funnelData.slug}`, "_blank")}
            >
              <Eye className="w-4 h-4 mr-1" /> Preview
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            disabled={!isDirty || updatePage.isPending}
            className="text-ivory/60 hover:text-ivory"
          >
            <Save className="w-4 h-4 mr-1" />
            {updatePage.isPending ? "Saving…" : "Save"}
          </Button>
          {!isPublished && (
            <Button
              size="sm"
              onClick={() => {
                handleSave();
                updateFunnel.mutate({ id: funnelId, status: "published" });
                if (activePage) updatePage.mutate({ id: activePage.id, sections, isPublished: true });
              }}
              className="bg-[#f5c842] text-black hover:bg-[#f5c842]/90 font-semibold"
            >
              <Globe className="w-4 h-4 mr-1" /> Publish
            </Button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Section Builder */}
        <div className="w-72 border-r border-white/10 bg-[#111] overflow-y-auto p-4 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white/5 border border-white/10 w-full">
              <TabsTrigger value="editor" className="data-[state=active]:bg-[#f5c842] data-[state=active]:text-black text-ivory/70 flex-1 text-xs">
                Sections
              </TabsTrigger>
              <TabsTrigger value="add" className="data-[state=active]:bg-[#f5c842] data-[state=active]:text-black text-ivory/70 flex-1 text-xs">
                Add
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="mt-3 space-y-3">
              {sections.length === 0 ? (
                <div className="text-center py-8 text-ivory/30 text-sm">
                  <p>No sections yet</p>
                  <p className="text-xs mt-1">Switch to "Add" to add sections</p>
                </div>
              ) : (
                sections.map((section, i) => (
                  <SectionEditor
                    key={i}
                    section={section}
                    onChange={(s) => updateSection(i, s)}
                    onDelete={() => deleteSection(i)}
                    onMoveUp={() => moveSection(i, "up")}
                    onMoveDown={() => moveSection(i, "down")}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="add" className="mt-3 space-y-2">
              <p className="text-ivory/40 text-xs mb-3">Click a section type to add it</p>
              {SECTION_TYPES.map(({ type, label, icon: Icon, description }) => (
                <button
                  key={type}
                  onClick={() => { addSection(type); setActiveTab("editor"); }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-[#f5c842]/40 hover:bg-[#f5c842]/5 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#f5c842]/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[#f5c842]" />
                  </div>
                  <div>
                    <div className="text-ivory text-sm font-medium">{label}</div>
                    <div className="text-ivory/40 text-xs">{description}</div>
                  </div>
                </button>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel: Live Preview */}
        <div className="flex-1 overflow-y-auto bg-[#0d0d0d]">
          <div className="max-w-2xl mx-auto">
            {sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-ivory/20">
                <Plus className="w-10 h-10 mb-3" />
                <p className="text-sm">Add sections to build your page</p>
              </div>
            ) : (
              sections.map((section, i) => (
                <SectionPreview key={i} section={section} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
