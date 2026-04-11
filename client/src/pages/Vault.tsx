/* =============================================================================
   Operator House — The Vault (Knowledge Base)
   Obsidian Intelligence: Knowledge archive — real data
   ============================================================================= */

import React, { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Plus, Search, Archive, Loader2, X, Trash2, FileText, BookOpen, Mic, Layout, FlaskConical, StickyNote } from "lucide-react";
import { SkeletonCards, EmptyState } from "@/components/StateUI";
import { toast } from "sonner";

type VaultType = "framework" | "case_study" | "voice_note" | "template" | "research" | "note";

const TYPE_META: Record<VaultType, { label: string; icon: React.ElementType; color: string }> = {
  framework: { label: "Framework", icon: BookOpen, color: "#F5A623" },
  case_study: { label: "Case Study", icon: FileText, color: "#60A5FA" },
  voice_note: { label: "Voice Note", icon: Mic, color: "#A78BFA" },
  template: { label: "Template", icon: Layout, color: "#4ADE80" },
  research: { label: "Research", icon: FlaskConical, color: "#F472B6" },
  note: { label: "Note", icon: StickyNote, color: "#6B6B7A" },
};

const VAULT_TYPES: VaultType[] = ["framework", "case_study", "voice_note", "template", "research", "note"];

export default function Vault() {
  const utils = trpc.useUtils();
  const { data: items, isLoading } = trpc.vault.list.useQuery();
  const createItem = trpc.vault.create.useMutation({
    onSuccess: () => {
      utils.vault.list.invalidate();
      toast.success("Item saved to Vault");
      setShowForm(false);
      setForm({ title: "", type: "note", textContent: "", tags: "" });
    },
    onError: () => toast.error("Failed to save item"),
  });
  const deleteItem = trpc.vault.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.vault.list.cancel();
      const prev = utils.vault.list.getData();
      utils.vault.list.setData(undefined, (old) => old?.filter((v) => v.id !== id));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.vault.list.setData(undefined, ctx.prev);
      toast.error("Failed to delete item");
    },
    onSettled: () => { utils.vault.list.invalidate(); toast.success("Item removed"); },
  });

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<VaultType | "all">("all");
  const [form, setForm] = useState({ title: "", type: "note" as VaultType, textContent: "", tags: "" });
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = items?.filter((item) => {
    const matchesSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || (item.textContent ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || item.type === filterType;
    return matchesSearch && matchesType;
  }) ?? [];

  return (
    <AppLayout title="The Vault" subtitle="Your living knowledge archive">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <div className="relative" style={{ minWidth: "200px" }}>
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input type="text" placeholder="Search vault..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "var(--surface)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)", fontFamily: "DM Sans, sans-serif" }} />
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <button onClick={() => setFilterType("all")} className="px-3 py-1.5 rounded text-xs font-medium"
                style={{ background: filterType === "all" ? "var(--amber)" : "var(--surface)", color: filterType === "all" ? "#0A0A0F" : "var(--text-muted)", fontFamily: "DM Sans, sans-serif" }}>All</button>
              {VAULT_TYPES.map((t) => {
                const meta = TYPE_META[t];
                return (
                  <button key={t} onClick={() => setFilterType(filterType === t ? "all" : t)} className="px-3 py-1.5 rounded text-xs font-medium"
                    style={{ background: filterType === t ? meta.color : "var(--surface)", color: filterType === t ? "#0A0A0F" : "var(--text-muted)", fontFamily: "DM Sans, sans-serif" }}>
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold flex-shrink-0"
            style={{ background: "var(--amber)", color: "#0A0A0F", fontFamily: "DM Sans, sans-serif" }}>
            <Plus size={14} /> Add Item
          </button>
        </div>

        {showForm && (
          <div className="rounded-xl p-5 space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--border-amber)" }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontFamily: "Playfair Display, serif", fontSize: "15px", color: "var(--text-primary)" }}>New Vault Item</span>
              <button onClick={() => setShowForm(false)}><X size={14} style={{ color: "var(--text-muted)" }} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="col-span-2 px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "var(--obsidian)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)", fontFamily: "DM Sans, sans-serif" }} />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as VaultType })}
                className="px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "var(--obsidian)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)", fontFamily: "DM Sans, sans-serif" }}>
                {VAULT_TYPES.map((t) => <option key={t} value={t}>{TYPE_META[t].label}</option>)}
              </select>
              <input type="text" placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "var(--obsidian)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)", fontFamily: "DM Sans, sans-serif" }} />
              <textarea placeholder="Content / notes..." value={form.textContent} onChange={(e) => setForm({ ...form, textContent: e.target.value })}
                rows={4} className="col-span-2 px-3 py-2 rounded-lg text-sm outline-none resize-none"
                style={{ background: "var(--obsidian)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)", fontFamily: "DM Sans, sans-serif" }} />
            </div>
            <button onClick={() => {
              if (!form.title.trim()) return toast.error("Title is required");
              createItem.mutate({ title: form.title, type: form.type, textContent: form.textContent || undefined,
                tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined });
            }} disabled={createItem.isPending} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold"
              style={{ background: "var(--amber)", color: "#0A0A0F", fontFamily: "DM Sans, sans-serif" }}>
              {createItem.isPending ? <Loader2 size={12} className="animate-spin" /> : <Archive size={12} />} Save to Vault
            </button>
          </div>
        )}

        {isLoading ? (
          <SkeletonCards count={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Archive}
            title={search || filterType !== "all" ? "No items match your filter." : "Your Vault is empty."}
            body={!search && filterType === "all" ? "Start adding frameworks, case studies, and templates." : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => {
              const meta = TYPE_META[item.type as VaultType] ?? TYPE_META.note;
              const Icon = meta.icon;
              const isOpen = expanded === item.id;
              return (
                <div key={item.id} className="rounded-xl group cursor-pointer"
                  style={{ background: "var(--surface)", border: `1px solid ${isOpen ? meta.color + "60" : "var(--border-subtle)"}`, transition: "border-color 180ms ease" }}
                  onClick={() => setExpanded(isOpen ? null : item.id)}>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: meta.color + "20" }}>
                          <Icon size={13} style={{ color: meta.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", fontFamily: "DM Sans, sans-serif" }} className="truncate">{item.title}</div>
                          <div style={{ fontSize: "10px", color: meta.color, fontFamily: "Fira Code, monospace", marginTop: "2px" }}>{meta.label}</div>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteItem.mutate({ id: item.id }); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <Trash2 size={12} style={{ color: "var(--text-muted)" }} />
                      </button>
                    </div>
                    {item.tags && Array.isArray(item.tags) && (item.tags as string[]).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {(item.tags as string[]).slice(0, 3).map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded text-xs"
                            style={{ background: "var(--obsidian)", color: "var(--text-muted)", fontFamily: "Fira Code, monospace" }}>{tag}</span>
                        ))}
                      </div>
                    )}
                    {isOpen && item.textContent && (
                      <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                        <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{item.textContent}</p>
                      </div>
                    )}
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "8px", fontFamily: "Fira Code, monospace" }}>
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
