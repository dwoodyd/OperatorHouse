/* =============================================================================
   Operator House — Client Pipeline (CRM)
   Obsidian Intelligence: Kanban-style client deal pipeline — real data
   ============================================================================= */

import { useState } from "react";
import { createDealSchema } from "@/lib/schemas";
import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Plus, DollarSign, Loader2, X, Trash2 } from "lucide-react";
import { SkeletonKanban } from "@/components/StateUI";
import DealSlideOver from "@/components/DealSlideOver";
import { toast } from "sonner";

type Stage = "Discovery" | "Analysis" | "Strategy" | "Proposal" | "Closed";
// Deal type derived from the query result
type Deal = {
  id: number;
  userId: number;
  clientId: number | null;
  title: string;
  stage: Stage;
  value: number | null;
  intentScore: number | null;
  tags: string[] | null;
  notes: string | null;
  closeProbability: number | null;
  expectedCloseDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const STAGES: Stage[] = ["Discovery", "Analysis", "Strategy", "Proposal", "Closed"];

const STAGE_COLORS: Record<Stage, string> = {
  Discovery: "#6B6B7A",
  Analysis: "#F5A623",
  Strategy: "#60A5FA",
  Proposal: "#A78BFA",
  Closed: "#4ADE80",
};

const SCORE_COLOR = (score: number) => {
  if (score >= 8.5) return "#4ADE80";
  if (score >= 7) return "#F5A623";
  return "#6B6B7A";
};

interface NewDealForm {
  title: string;
  stage: Stage;
  value: string;
  notes: string;
}

export default function Pipeline() {
  const utils = trpc.useUtils();
  const { data: deals, isLoading } = trpc.pipeline.list.useQuery();

  const createDeal = trpc.pipeline.create.useMutation({
    onSuccess: () => {
      utils.pipeline.list.invalidate();
      utils.dashboard.metrics.invalidate();
      toast.success("Deal added to pipeline");
      setShowForm(false);
      setForm({ title: "", stage: "Discovery", value: "", notes: "" });
    },
    onError: () => toast.error("Failed to create deal"),
  });

  // Optimistic update: stage change via drag-and-drop
  const updateDeal = trpc.pipeline.update.useMutation({
    onMutate: async (vars) => {
      await utils.pipeline.list.cancel();
      const prev = utils.pipeline.list.getData();
      utils.pipeline.list.setData(undefined, (old) =>
        old?.map((d) =>
          d.id === vars.id
            ? {
                ...d,
                ...(vars.stage ? { stage: vars.stage } : {}),
                ...(vars.value != null ? { value: vars.value } : {}),
                ...(vars.notes != null ? { notes: vars.notes } : {}),
              }
            : d
        )
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.pipeline.list.setData(undefined, ctx.prev);
      toast.error("Failed to update deal");
    },
    onSettled: () => {
      utils.pipeline.list.invalidate();
      utils.dashboard.metrics.invalidate();
    },
  });

  // Optimistic update: delete
  const deleteDeal = trpc.pipeline.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.pipeline.list.cancel();
      const prev = utils.pipeline.list.getData();
      utils.pipeline.list.setData(undefined, (old) => old?.filter((d) => d.id !== id));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.pipeline.list.setData(undefined, ctx.prev);
      toast.error("Failed to delete deal");
    },
    onSettled: () => {
      utils.pipeline.list.invalidate();
      utils.dashboard.metrics.invalidate();
      toast.success("Deal removed");
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewDealForm>({ title: "", stage: "Discovery", value: "", notes: "" });
  const [dragId, setDragId] = useState<number | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const dealsByStage = (stage: Stage) => deals?.filter((d) => d.stage === stage) ?? [];
  const totalValue = deals?.reduce((sum, d) => sum + (d.value ?? 0), 0) ?? 0;

  const handleDrop = (stage: Stage) => {
    if (dragId == null) return;
    updateDeal.mutate({ id: dragId, stage });
    setDragId(null);
  };

  return (
    <AppLayout title="Client Pipeline" subtitle="Manage your deals across all stages">
      <div className="p-6 space-y-4">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <DollarSign size={14} style={{ color: 'var(--amber)' }} />
              <span style={{ fontFamily: 'Fira Code, monospace', fontSize: '13px', color: 'var(--amber)' }}>
                ${totalValue.toLocaleString()} total
              </span>
            </div>
            <span style={{ color: 'var(--border-subtle)' }}>|</span>
            <span style={{ fontFamily: 'Fira Code, monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
              {deals?.length ?? 0} deals
            </span>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold"
            style={{ background: 'var(--amber)', color: '#0A0A0F', fontFamily: 'DM Sans, sans-serif' }}
          >
            <Plus size={14} />
            Add Deal
          </button>
        </div>

        {/* Add Deal Form */}
        {showForm && (
          <div className="rounded-xl p-5 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border-amber)' }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', color: 'var(--text-primary)' }}>New Deal</span>
              <button onClick={() => setShowForm(false)}><X size={14} style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Deal title / client name"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="col-span-2 px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--obsidian)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', fontFamily: 'DM Sans, sans-serif' }}
              />
              <select
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value as Stage })}
                className="px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--obsidian)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', fontFamily: 'DM Sans, sans-serif' }}
              >
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input
                type="number"
                placeholder="Deal value ($)"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--obsidian)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', fontFamily: 'DM Sans, sans-serif' }}
              />
              <input
                type="text"
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="col-span-2 px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--obsidian)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', fontFamily: 'DM Sans, sans-serif' }}
              />
            </div>
            <button
              onClick={() => {
                const result = createDealSchema.safeParse({ title: form.title, stage: form.stage, value: form.value ? Number(form.value) : undefined, notes: form.notes || undefined });
                if (!result.success) return toast.error(result.error.issues[0]?.message ?? "Invalid input");
                createDeal.mutate(result.data);
              }}
              disabled={createDeal.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold"
              style={{ background: 'var(--amber)', color: '#0A0A0F', fontFamily: 'DM Sans, sans-serif' }}
            >
              {createDeal.isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              Create Deal
            </button>
          </div>
        )}

        {/* Kanban Board */}
        {isLoading ? (
          <SkeletonKanban cols={5} />
        ) : (
          <div className="grid grid-cols-5 gap-3" style={{ minHeight: '500px' }}>
            {STAGES.map((stage) => (
              <div
                key={stage}
                className="flex flex-col glass-panel"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(stage)}
              >
                {/* Stage Header */}
                <div className="px-3 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: STAGE_COLORS[stage] }} />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'DM Sans, sans-serif' }}>{stage}</span>
                    </div>
                    <span style={{ fontFamily: 'Fira Code, monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
                      {dealsByStage(stage).length}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'Fira Code, monospace', fontSize: '11px', color: STAGE_COLORS[stage], marginTop: '4px' }}>
                    ${dealsByStage(stage).reduce((s, d) => s + (d.value ?? 0), 0).toLocaleString()}
                  </div>
                </div>

                {/* Deal Cards */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                  {dealsByStage(stage).length === 0 && (
                    <div className="py-8 flex flex-col items-center gap-3" style={{ opacity: 0.7 }}>
                      <img
                        src="/manus-storage/specter_icon_ce569ea5.png"
                        alt="The Specter"
                        style={{
                          height: 36,
                          width: 'auto',
                          filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.25))',
                          animation: 'specter-idle 4s ease-in-out infinite',
                        }}
                      />
                      <span style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Fira Code, monospace' }}>
                        {stage === 'Discovery' ? 'Waiting for leads' :
                         stage === 'Closed' ? 'Nothing closed yet' :
                         'Drop deals here'}
                      </span>
                    </div>
                  )}
                  {dealsByStage(stage).map((deal) => (
                    <div
                      key={deal.id}
                      draggable
                      tabIndex={0}
                      role="button"
                      aria-label={`Deal: ${deal.title}${deal.value != null ? `, $${deal.value.toLocaleString()}` : ''}, stage: ${stage}`}
                      onDragStart={(e) => { e.stopPropagation(); setDragId(deal.id); }}
                      onClick={() => setSelectedDeal(deal)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedDeal(deal);
                        }
                      }}
                      className="rounded-lg p-3 cursor-pointer group"
                      style={{
                        background: 'var(--obsidian)',
                        border: '1px solid var(--border-subtle)',
                        transition: 'border-color 0.15s ease',
                        outline: 'none',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--amber)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                      onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(245,166,35,0.7)')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{deal.title}</div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteDeal.mutate({ id: deal.id }); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                          <Trash2 size={10} style={{ color: 'var(--text-muted)' }} />
                        </button>
                      </div>
                      {deal.value != null && (
                        <div style={{ fontFamily: 'Fira Code, monospace', fontSize: '11px', color: 'var(--amber)', marginTop: '4px' }}>
                          ${deal.value.toLocaleString()}
                        </div>
                      )}
                      {deal.intentScore != null && (
                        <div style={{ fontFamily: 'Fira Code, monospace', fontSize: '10px', color: SCORE_COLOR(deal.intentScore), marginTop: '2px' }}>
                          {deal.intentScore.toFixed(1)} intent
                        </div>
                      )}
                      {deal.notes && (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }} className="line-clamp-2">
                          {deal.notes}
                        </div>
                      )}
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {new Date(deal.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deal Slide-Over */}
      <DealSlideOver deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
    </AppLayout>
  );
}
