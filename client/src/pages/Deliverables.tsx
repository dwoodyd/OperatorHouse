import { useMemo, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Copy, ExternalLink, Link2, RefreshCw, ShieldOff, Share2 } from "lucide-react";
import { toast } from "sonner";
import { buildClientDeliveryNote } from "@/lib/deliverableNote";

function statusFor(deliverable: { status: string; expiresAt: Date | null }) {
  if (deliverable.status === "revoked") return "revoked";
  if (deliverable.expiresAt && new Date(deliverable.expiresAt) <= new Date()) return "expired";
  return "active";
}

export default function Deliverables() {
  const utils = trpc.useUtils();
  const { data: deliverables, isLoading } = trpc.sharedDeliverables.list.useQuery();
  const [reissued, setReissued] = useState<{ id: number; url: string; expiresAt: Date } | null>(null);
  const revoke = trpc.sharedDeliverables.revoke.useMutation({
    onSuccess: () => { utils.sharedDeliverables.list.invalidate(); toast.success("Client link revoked"); },
    onError: (error) => toast.error(error.message),
  });
  const reissue = trpc.sharedDeliverables.reissue.useMutation({
    onSuccess: (data, variables) => {
      const url = `${window.location.origin}/shared/${data.token}`;
      setReissued({ id: data.id, url, expiresAt: data.expiresAt });
      utils.sharedDeliverables.list.invalidate();
      toast.success("New private link created; the previous link is now revoked");
    },
    onError: (error) => toast.error(error.message),
  });
  const ordered = useMemo(() => deliverables ?? [], [deliverables]);
  const copy = async (url: string) => { await navigator.clipboard.writeText(url); toast.success("Link copied"); };

  return <AppLayout title="Client Deliverables" subtitle="Manage the private strategy links you share with clients">
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 p-4" style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}>
        <div className="flex gap-3"><Share2 size={18} style={{ color: "var(--amber)", flexShrink: 0 }} /><div><p className="font-semibold" style={{ color: "var(--text-primary)" }}>Private links are intentionally one-time secrets.</p><p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>For safety, an existing link cannot be revealed again. Reissuing creates a fresh link from the frozen strategy and selected evidence, then revokes the old one.</p></div></div>
      </div>
      {isLoading ? <div className="grid gap-3">{[1,2,3].map((i) => <div key={i} className="h-28 animate-pulse" style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }} />)}</div> : !ordered.length ? <div className="py-20 text-center" style={{ border: "1px dashed var(--border-subtle)" }}><Link2 size={25} className="mx-auto mb-3" style={{ color: "var(--amber)" }} /><h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, color: "var(--text-primary)" }}>No client deliverables yet</h2><p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>Open a completed strategy and choose Share to create a branded, source-grounded client document.</p></div> : <div className="grid gap-3">{ordered.map((item) => {
        const status = statusFor(item); const fresh = reissued?.id === item.id ? reissued : null;
        return <article key={item.id} className="p-5" style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderLeft: `3px solid ${item.accentColor || "var(--amber)"}` }}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"><div><div className="flex items-center gap-2"><span className="data-label" style={{ color: status === "active" ? "#79d69a" : status === "expired" ? "var(--amber)" : "#d68b8b" }}>{status.toUpperCase()}</span><span className="text-xs" style={{ color: "var(--text-muted)" }}>{item.clientName || "Unassigned client"}</span></div><h2 className="mt-1" style={{ fontFamily: "Playfair Display, serif", fontSize: 20, color: "var(--text-primary)" }}>{item.title}</h2><p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>By {item.consultantName} · {item.openCount} {item.openCount === 1 ? "open" : "opens"}{item.lastOpenedAt ? ` · last opened ${new Date(item.lastOpenedAt).toLocaleDateString()}` : ""}</p></div><div className="flex flex-wrap gap-2">{fresh ? <><button onClick={() => copy(fresh.url)} className="px-3 py-2 text-xs flex items-center gap-1.5" style={{ background: "var(--amber)", color: "#0a0908" }}><Copy size={13} />Copy fresh link</button><button onClick={() => copy(buildClientDeliveryNote({ clientName: item.clientName ?? undefined, title: item.title, url: fresh.url, expiresAt: fresh.expiresAt }))} className="px-3 py-2 text-xs flex items-center gap-1.5" style={{ border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}><Copy size={13} />Copy client note</button></> : <button onClick={() => reissue.mutate({ id: item.id, expiresInDays: 30 })} disabled={reissue.isPending} className="px-3 py-2 text-xs flex items-center gap-1.5" style={{ border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}><RefreshCw size={13} />Reissue</button>}{status === "active" && <button onClick={() => revoke.mutate({ id: item.id })} disabled={revoke.isPending} className="px-3 py-2 text-xs flex items-center gap-1.5" style={{ border: "1px solid rgba(214,139,139,.45)", color: "#d68b8b" }}><ShieldOff size={13} />Revoke</button>}</div></div>
          {item.expiresAt && <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>Expires {new Date(item.expiresAt).toLocaleDateString()}</p>}
        </article>;
      })}</div>}
    </div>
  </AppLayout>;
}
