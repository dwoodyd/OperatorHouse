import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle2 } from "lucide-react";

function InteractiveStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-2 justify-center">
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
            className={`w-10 h-10 transition-all ${
              i <= (hovered || value)
                ? "fill-amber-400 text-amber-400 scale-110"
                : "text-white/20 hover:text-white/40"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ReviewForm() {
  const { token } = useParams<{ token: string }>();
  const [rating, setRating] = useState(0);
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerTitle, setReviewerTitle] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading, error } = trpc.reviews.getByToken.useQuery({ token: token ?? "" }, {
    enabled: !!token,
  });

  // Sync data into local state
  const dataStr = JSON.stringify(data);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useState(() => {
    if (!data) return;
    if (data.reviewerName) setReviewerName(data.reviewerName);
    if (data.alreadySubmitted) setSubmitted(true);
  });

  const submitMutation = trpc.reviews.submit.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0e0c09] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0e0c09] flex items-center justify-center text-ivory/50">
        Invalid or expired review link.
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0e0c09] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-ivory mb-2">Thank you!</h2>
          <p className="text-ivory/50">Your review has been submitted and will be reviewed shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0c09] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-[#f5c842]/10 flex items-center justify-center mx-auto mb-3">
            <Star className="w-6 h-6 text-[#f5c842]" />
          </div>
          <h1 className="text-xl font-bold text-ivory">Leave a Review</h1>
          <p className="text-sm text-ivory/50 mt-1">
            Hi {data.reviewerName}, we'd love your feedback!
          </p>
        </div>

        {/* Star rating */}
        <div className="space-y-2">
          <Label className="text-ivory/70 text-sm block text-center">Overall Rating</Label>
          <InteractiveStars value={rating} onChange={setRating} />
          {rating > 0 && (
            <p className="text-center text-xs text-ivory/40">
              {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
            </p>
          )}
        </div>

        {/* Headline */}
        <div>
          <Label className="text-ivory/70 text-sm">Headline</Label>
          <Input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Summarize your experience"
            className="bg-white/5 border-white/10 text-ivory mt-1"
          />
        </div>

        {/* Body */}
        <div>
          <Label className="text-ivory/70 text-sm">Your Review</Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Tell us about your experience in detail…"
            rows={4}
            className="bg-white/5 border-white/10 text-ivory mt-1 resize-none"
          />
        </div>

        {/* Name + Title */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-ivory/70 text-sm">Your Name</Label>
            <Input
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="Jane Smith"
              className="bg-white/5 border-white/10 text-ivory mt-1"
            />
          </div>
          <div>
            <Label className="text-ivory/70 text-sm">Title / Role</Label>
            <Input
              value={reviewerTitle}
              onChange={(e) => setReviewerTitle(e.target.value)}
              placeholder="CEO, Founder…"
              className="bg-white/5 border-white/10 text-ivory mt-1"
            />
          </div>
        </div>

        <Button
          onClick={() => submitMutation.mutate({
            token: token ?? "",
            rating,
            headline,
            body,
            reviewerName,
            reviewerTitle: reviewerTitle || undefined,
          })}
          disabled={!rating || !headline || body.length < 10 || !reviewerName || submitMutation.isPending}
          className="w-full bg-[#f5c842] text-[#0e0c09] hover:bg-[#f5c842]/90 font-semibold"
        >
          {submitMutation.isPending ? "Submitting…" : "Submit Review"}
        </Button>
      </div>
    </div>
  );
}
