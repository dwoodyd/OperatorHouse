/* =============================================================================
   Operator House — Tasks
   Specter-suggested task management with priority, due dates, and client linking
   ============================================================================= */
import { useState } from "react";
import { createTaskSchema } from "@/lib/schemas";
import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  CheckCircle2, Circle, Plus, Trash2, Loader2,
  AlertTriangle, Clock, Zap, ChevronDown, ChevronUp,
} from "lucide-react";
import { SkeletonRows, SpectreEmptyState } from "@/components/StateUI";

const PRIORITY_CONFIG = {
  urgent: { label: "URGENT", color: "#F87171", bg: "rgba(248,113,113,0.08)" },
  high:   { label: "HIGH",   color: "#F5A623", bg: "rgba(245,166,35,0.08)" },
  medium: { label: "MED",    color: "#60A5FA", bg: "rgba(96,165,250,0.08)" },
  low:    { label: "LOW",    color: "#4A4A5A", bg: "rgba(74,74,90,0.08)"  },
} as const;

type Priority = keyof typeof PRIORITY_CONFIG;
type Status = "pending" | "in_progress" | "done" | "cancelled";

export default function Tasks() {
  const utils = trpc.useUtils();
  const { data: tasks, isLoading } = trpc.tasks.list.useQuery();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");

  const createTask = trpc.tasks.create.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      setTitle(""); setDescription(""); setPriority("medium"); setShowForm(false);
      toast.success("Task created");
    },
    onError: () => toast.error("Failed to create task"),
  });

  const updateTask = trpc.tasks.update.useMutation({
    onMutate: async ({ id, status }) => {
      await utils.tasks.list.cancel();
      const prev = utils.tasks.list.getData();
      utils.tasks.list.setData(undefined, (old) =>
        old?.map((t) => t.id === id ? { ...t, status: status ?? t.status } : t)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.tasks.list.setData(undefined, ctx.prev);
      toast.error("Failed to update task");
    },
    onSettled: () => utils.tasks.list.invalidate(),
  });

  const deleteTask = trpc.tasks.delete.useMutation({
    onSuccess: () => { utils.tasks.list.invalidate(); toast.success("Task removed"); },
    onError: () => toast.error("Failed to delete task"),
  });

  const filtered = (tasks ?? []).filter((t) => {
    if (filter === "pending") return t.status === "pending" || t.status === "in_progress";
    if (filter === "done") return t.status === "done";
    return true;
  });

  const pending = (tasks ?? []).filter((t) => t.status === "pending" || t.status === "in_progress").length;
  const done = (tasks ?? []).filter((t) => t.status === "done").length;

  return (
    <AppLayout title="Tasks" subtitle="Specter-suggested actions and follow-ups">
      <div className="p-6 space-y-5 max-w-3xl mx-auto">

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Pending", value: pending, color: "var(--amber)", icon: Clock },
            { label: "Done", value: done, color: "#4ADE80", icon: CheckCircle2 },
            { label: "Total", value: (tasks ?? []).length, color: "#60A5FA", icon: Zap },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="glass-panel p-4 fade-in-up" style={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-2">
                <span className="data-label">{label}</span>
                <Icon size={12} style={{ color }} />
              </div>
              <div style={{ fontFamily: 'Fira Code, monospace', fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Add Task */}
        <div className="glass-panel fade-in-up" style={{ opacity: 0, animationDelay: '0.05s' }}>
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full flex items-center justify-between px-5 py-4"
            style={{ borderBottom: showForm ? '1px solid var(--border-subtle)' : 'none' }}
          >
            <div className="flex items-center gap-2">
              <Plus size={13} style={{ color: 'var(--amber)' }} />
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Add Task</span>
            </div>
            {showForm ? <ChevronUp size={13} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />}
          </button>
          {showForm && (
            <div className="p-5 space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title…"
                className="w-full px-4 py-2.5 text-sm outline-none"
                style={{ background: 'var(--obsidian)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: 4, fontFamily: 'DM Sans, sans-serif' }}
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description…"
                rows={2}
                className="w-full px-4 py-2.5 text-sm outline-none resize-none"
                style={{ background: 'var(--obsidian)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: 4, fontFamily: 'DM Sans, sans-serif' }}
              />
              <div className="flex items-center gap-2 flex-wrap">
                {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className="px-3 py-1 text-xs font-mono"
                    style={{
                      borderRadius: 3,
                      border: `1px solid ${priority === p ? PRIORITY_CONFIG[p].color : 'var(--border-subtle)'}`,
                      background: priority === p ? PRIORITY_CONFIG[p].bg : 'transparent',
                      color: priority === p ? PRIORITY_CONFIG[p].color : 'var(--text-muted)',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {PRIORITY_CONFIG[p].label}
                  </button>
                ))}
                <div style={{ flex: 1 }} />
                <button
                  onClick={() => {
                    const result = createTaskSchema.safeParse({ title: title.trim(), description: description || undefined, priority });
                    if (!result.success) return toast.error(result.error.issues[0]?.message ?? "Invalid input");
                    createTask.mutate(result.data);
                  }}
                  disabled={!title.trim() || createTask.isPending}
                  className="flex items-center gap-2 px-4 py-2"
                  style={{ background: 'var(--amber)', color: 'var(--obsidian)', fontWeight: 600, fontSize: 12, borderRadius: 4, opacity: !title.trim() ? 0.5 : 1 }}
                >
                  {createTask.isPending ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                  Create
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 0 }}>
          {(["all", "pending", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2.5 text-xs capitalize"
              style={{
                fontFamily: 'Fira Code, monospace', letterSpacing: '0.08em', textTransform: 'uppercase',
                color: filter === f ? 'var(--amber)' : 'var(--text-muted)',
                borderBottom: filter === f ? '2px solid var(--amber)' : '2px solid transparent',
                marginBottom: -1,
                transition: 'color 150ms ease, border-color 150ms ease',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Task List */}
        <div className="space-y-2">
          {isLoading ? (
            <SkeletonRows rows={4} />
          ) : filtered.length === 0 ? (
            <SpectreEmptyState
              title={filter === "done" ? "No completed tasks yet." : "No tasks yet."}
              spectreQuote={filter === "done" ? "Nothing marked done yet. I respect the grind." : "Your task list is empty. I'll hold the silence — for now."}
              body={filter !== "done" ? "Add one above or let Specter suggest actions from your leads." : undefined}
              compact
            />
          ) : (
            filtered.map((task) => {
              const p = PRIORITY_CONFIG[(task.priority as Priority) ?? "medium"];
              const isDone = task.status === "done";
              return (
                <div
                  key={task.id}
                  className="glass-panel p-4 flex items-start gap-3 fade-in-up"
                  tabIndex={0}
                  role="listitem"
                  aria-label={`Task: ${task.title}, priority: ${(task.priority as Priority) ?? 'medium'}, status: ${task.status}`}
                  style={{ opacity: 0, transition: 'opacity 150ms ease, transform 150ms ease', outline: 'none' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      updateTask.mutate({ id: task.id, status: isDone ? 'pending' : 'done' as Status });
                    } else if (e.key === 'Delete' || e.key === 'Backspace') {
                      e.preventDefault();
                      deleteTask.mutate({ id: task.id });
                    }
                  }}
                  onFocus={(e) => (e.currentTarget.style.boxShadow = '0 0 0 1px rgba(245,166,35,0.5)')}
                  onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
                >
                  <button
                    onClick={() => updateTask.mutate({ id: task.id, status: isDone ? "pending" : "done" as Status })}
                    style={{ marginTop: 2, flexShrink: 0 }}
                  >
                    {isDone
                      ? <CheckCircle2 size={16} style={{ color: '#4ADE80' }} />
                      : <Circle size={16} style={{ color: 'var(--text-muted)' }} />
                    }
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span style={{ fontSize: 13, fontWeight: 500, color: isDone ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: isDone ? 'line-through' : 'none' }}>
                        {task.title}
                      </span>
                      <span
                        className="ghost-badge"
                        style={{ borderColor: `${p.color}40`, color: p.color, background: p.bg, fontSize: 9 }}
                      >
                        {p.label}
                      </span>
                      {(task.status === "in_progress") && (
                        <span className="ghost-badge" style={{ borderColor: 'rgba(96,165,250,0.3)', color: '#60A5FA', background: 'rgba(96,165,250,0.06)', fontSize: 9 }}>IN PROGRESS</span>
                      )}
                    </div>
                    {task.description && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.5 }}>{task.description}</p>
                    )}
                    {task.dueAt && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <AlertTriangle size={10} style={{ color: '#F59E0B' }} />
                        <span style={{ fontSize: 11, color: '#F59E0B', fontFamily: 'Fira Code, monospace' }}>
                          Due {new Date(task.dueAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteTask.mutate({ id: task.id })}
                    style={{ color: 'var(--text-muted)', flexShrink: 0, padding: 4, borderRadius: 4, transition: 'color 150ms' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#F87171')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
