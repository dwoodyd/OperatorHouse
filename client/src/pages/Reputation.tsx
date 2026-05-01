import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SkeletonRows } from "@/components/StateUI";
import { Star, Send, Globe, Archive, Plus, TrendingUp, MessageSquare, BarChart3, Copy } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/_core/hooks/useAuth";

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-white/20"}`}
        />
      ))}
    </div>
  );
}

function InteractiveStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(i)}
          className="focus:outline-none"
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              i <= (hovered || value) ? "fill-amber-400 text-amber-400" : "text-white/20"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  submitted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  published: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  archived: "bg-white/5 text-white/40 border-white/10",
};

export default function Reputation() {
  const { user } = useAuth();
  const [requestOpen, setRequestOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [filter, setFilter] = useState("all");

  const { data: reviews = [], isLoading, refetch } = trpc.reviews.list.useQuery();
  const { data: stats } = trpc.reviews.stats.useQuery();

  const requestMutation = trpc.reviews.request.useMutation({
    onSuccess: () => {
      toast.success("Review request sent");
      setRequestOpen(false);
      setEmail(""); setName("");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateStatus = trpc.reviews.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = reviews.filter((r) => filter === "all" || r.status === filter);

  const widgetUrl = user ? `${window.location.origin}/widget/${user.id}` : "";

  return (
    <div className="min-h-screen bg-[#0e0c09] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ivory">Reputation</h1>
          <p className="text-sm text-ivory/50 mt-0.5">Collect and manage client reviews</p>
        </div>
        <Button
          onClick={() => setRequestOpen(true)}
          className="bg-[#f5c842] text-[#0e0c09] hover:bg-[#f5c842]/90 font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Request Review
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Reviews", value: stats?.total ?? 0, icon: MessageSquare, color: "text-amber-400" },
          { label: "Avg Rating", value: stats?.avg ? `${stats.avg} / 5` : "—", icon: Star, color: "text-yellow-400" },
          { label: "Published", value: reviews.filter((r) => r.status === "published").length, icon: Globe, color: "text-emerald-400" },
          { label: "Pending", value: reviews.filter((r) => r.status === "pending").length, icon: TrendingUp, color: "text-blue-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-ivory/50">{s.label}</span>
            </div>
            <div className="text-2xl font-bold text-ivory">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Rating breakdown */}
      {stats && stats.total > 0 && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-ivory">Rating Breakdown</span>
          </div>
          <div className="space-y-2">
            {stats.byRating.map(({ rating, count }) => (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-xs text-ivory/60">{rating}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </div>
                <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: stats.total > 0 ? `${(count / stats.total) * 100}%` : "0%" }}
                  />
                </div>
                <span className="text-xs text-ivory/40 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Widget URL */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-center gap-3">
        <Globe className="w-4 h-4 text-ivory/40 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-ivory/50 mb-0.5">Public Reviews Widget URL</p>
          <p className="text-xs text-ivory/70 truncate font-mono">{widgetUrl}</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => { navigator.clipboard.writeText(widgetUrl); toast.success("Copied"); }}
          className="text-ivory/40 hover:text-ivory"
        >
          <Copy className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "pending", "submitted", "published", "archived"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
              filter === f
                ? "bg-[#f5c842] text-[#0e0c09]"
                : "bg-white/5 text-ivory/50 hover:text-ivory"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Reviews list */}
      <div className="space-y-3">
        {isLoading ? (
          <SkeletonRows rows={4} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-ivory/30">
            <Star className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p>No reviews yet. Send your first request.</p>
          </div>
        ) : (
          filtered.map((r) => (
            <div key={r.id} className="rounded-xl bg-white/5 border border-white/10 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-ivory">{r.reviewerName || "—"}</span>
                    {r.reviewerTitle && (
                      <span className="text-xs text-ivory/40">{r.reviewerTitle}</span>
                    )}
                    <Badge className={`${STATUS_COLORS[r.status]} border text-xs ml-auto`}>
                      {r.status}
                    </Badge>
                  </div>
                  {r.rating && <StarRating rating={r.rating} />}
                  {r.headline && (
                    <p className="text-sm font-medium text-ivory/80 mt-1">{r.headline}</p>
                  )}
                  {r.body && (
                    <p className="text-sm text-ivory/50 mt-1 line-clamp-3">{r.body}</p>
                  )}
                  <p className="text-xs text-ivory/30 mt-2">
                    {r.reviewerEmail} · Requested {format(new Date(r.requestedAt), "MMM d, yyyy")}
                    {r.submittedAt && ` · Submitted ${format(new Date(r.submittedAt), "MMM d")}`}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  {r.status === "submitted" && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus.mutate({ id: r.id, status: "published", isPublic: true })}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-7"
                    >
                      <Globe className="w-3 h-3 mr-1" />
                      Publish
                    </Button>
                  )}
                  {r.status === "published" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateStatus.mutate({ id: r.id, status: "archived" })}
                      className="text-ivory/40 hover:text-ivory text-xs h-7"
                    >
                      <Archive className="w-3 h-3 mr-1" />
                      Archive
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Request Review Dialog */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 text-ivory">
          <DialogHeader>
            <DialogTitle>Request a Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-ivory/70 text-sm">Client Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="bg-white/5 border-white/10 text-ivory mt-1"
              />
            </div>
            <div>
              <Label className="text-ivory/70 text-sm">Client Email</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="bg-white/5 border-white/10 text-ivory mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRequestOpen(false)} className="text-ivory/60">
              Cancel
            </Button>
            <Button
              onClick={() => requestMutation.mutate({ reviewerEmail: email, reviewerName: name })}
              disabled={!email || !name || requestMutation.isPending}
              className="bg-[#f5c842] text-[#0e0c09] hover:bg-[#f5c842]/90 font-semibold"
            >
              <Send className="w-4 h-4 mr-2" />
              {requestMutation.isPending ? "Sending…" : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
