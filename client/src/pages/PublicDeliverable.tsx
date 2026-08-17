import { useParams } from "wouter";
import { BookOpen, Clock, FileText, Globe2, Loader2, ShieldCheck } from "lucide-react";
import { Streamdown } from "streamdown";
import { trpc } from "@/lib/trpc";

export default function PublicDeliverable() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";
  const { data, isLoading, error } = trpc.sharedDeliverables.getPublic.useQuery({ token }, { enabled: !!token, retry: false });

  if (isLoading) {
    return <div className="min-h-screen bg-[#0b0b11] grid place-items-center"><Loader2 className="w-7 h-7 animate-spin text-amber-300" /></div>;
  }
  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#0b0b11] text-[#eee9df] grid place-items-center p-6">
        <section className="max-w-md text-center">
          <Globe2 className="w-11 h-11 mx-auto mb-5 text-zinc-600" />
          <h1 className="font-serif text-3xl mb-3">This strategy link is unavailable.</h1>
          <p className="text-zinc-400 leading-relaxed">It may have expired or been revoked by the consultant who sent it. Please request a new link from them directly.</p>
        </section>
      </main>
    );
  }

  const { document, sources } = data;
  const accent = document.accentColor || "#F5A623";
  return (
    <main className="min-h-screen bg-[#0b0b11] text-[#eee9df]" style={{ "--deliverable-accent": accent } as React.CSSProperties}>
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0b0b11]/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {document.consultantLogoUrl ? <img src={document.consultantLogoUrl} alt="" className="w-9 h-9 object-contain rounded" /> : <div className="w-9 h-9 grid place-items-center rounded border" style={{ color: accent, borderColor: `${accent}66` }}><FileText size={16} /></div>}
            <div className="min-w-0"><p className="font-medium truncate">{document.consultantName}</p><p className="text-xs text-zinc-500">Private strategy deliverable</p></div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-500"><ShieldCheck size={13} /> Read-only</div>
        </div>
      </header>

      <article className="max-w-4xl mx-auto px-5 py-10 sm:py-16">
        <p className="text-xs uppercase tracking-[0.2em] mb-4" style={{ color: accent }}>{document.clientName ? `Prepared for ${document.clientName}` : "Strategy deliverable"}</p>
        <h1 className="font-serif text-4xl sm:text-5xl leading-tight mb-5">{document.title}</h1>
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-10"><Clock size={14} /> Shared privately by {document.consultantName}</div>

        <section className="prose prose-invert prose-zinc max-w-none prose-headings:font-serif prose-a:text-amber-300">
          <Streamdown>{document.strategyContent}</Streamdown>
        </section>

        {sources.length > 0 && (
          <section className="mt-14 pt-8 border-t border-white/10">
            <div className="flex items-center gap-2 mb-3" style={{ color: accent }}><BookOpen size={17} /><span className="text-xs uppercase tracking-[0.16em]">Evidence selected for this strategy</span></div>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">These source notes were selected by your consultant to make the recommendation inspectable. They are excerpts, not access to their private workspace.</p>
            <div className="space-y-4">
              {sources.map((source, index) => <div key={`${source.title}-${index}`} className="rounded-lg p-5 bg-white/[0.035] border border-white/10">
                <h2 className="font-medium text-base mb-2">{source.title}</h2>
                <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{source.excerpt}</p>
                {source.rationale && <p className="mt-4 pt-3 border-t border-white/10 text-sm leading-relaxed" style={{ color: accent }}><span className="text-zinc-500">Why it matters: </span>{source.rationale}</p>}
              </div>)}
            </div>
          </section>
        )}
      </article>
    </main>
  );
}
