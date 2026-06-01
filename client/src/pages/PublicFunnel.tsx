/**
 * PublicFunnel — unauthenticated public funnel renderer for /f/:slug
 *
 * Loads the published funnel page via trpc.funnels.getPublicPage,
 * renders all section types (hero, benefits, about, form, results),
 * and submits the lead-capture form via trpc.funnels.submitForm.
 */
import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Section types ────────────────────────────────────────────────────────────

type Section = {
  type: string;
  content: Record<string, unknown>;
  styles?: Record<string, unknown>;
};

function HeroSection({ content }: { content: Record<string, unknown> }) {
  const c = content as any;
  return (
    <section
      className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-20"
      style={{
        background: "linear-gradient(135deg, #0d0d0d 0%, #1a1408 100%)",
      }}
    >
      {c.eyebrow && (
        <p
          className="text-xs tracking-[0.2em] uppercase mb-4"
          style={{ color: "rgba(212,168,83,0.7)", fontFamily: "Fira Code, monospace" }}
        >
          {c.eyebrow}
        </p>
      )}
      <h1
        className="text-4xl md:text-6xl font-bold mb-6 max-w-3xl leading-tight"
        style={{ color: "#f5f0e8", fontFamily: "Cormorant Garamond, serif" }}
      >
        {c.headline || "Welcome"}
      </h1>
      {c.subheadline && (
        <p className="text-lg md:text-xl mb-8 max-w-2xl" style={{ color: "rgba(245,240,232,0.65)" }}>
          {c.subheadline}
        </p>
      )}
      {c.cta && (
        <a
          href="#funnel-form"
          className="inline-block px-8 py-3 rounded-lg font-semibold text-black transition-opacity hover:opacity-90"
          style={{ background: "#d4a853" }}
        >
          {c.cta}
        </a>
      )}
    </section>
  );
}

function BenefitsSection({ content }: { content: Record<string, unknown> }) {
  const c = content as any;
  return (
    <section className="py-16 px-6 max-w-3xl mx-auto">
      {c.title && (
        <h2
          className="text-2xl md:text-3xl font-bold mb-8 text-center"
          style={{ color: "#f5f0e8", fontFamily: "Cormorant Garamond, serif" }}
        >
          {c.title}
        </h2>
      )}
      <ul className="space-y-4">
        {(c.items ?? []).map((item: string, i: number) => (
          <li key={i} className="flex items-start gap-3">
            <div
              className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: "#d4a853" }}
            />
            <span style={{ color: "rgba(245,240,232,0.8)" }}>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AboutSection({ content }: { content: Record<string, unknown> }) {
  const c = content as any;
  return (
    <section className="py-16 px-6 max-w-3xl mx-auto">
      {c.title && (
        <h2
          className="text-2xl md:text-3xl font-bold mb-6"
          style={{ color: "#f5f0e8", fontFamily: "Cormorant Garamond, serif" }}
        >
          {c.title}
        </h2>
      )}
      <p className="text-base leading-relaxed" style={{ color: "rgba(245,240,232,0.75)" }}>
        {c.body}
      </p>
    </section>
  );
}

function ResultsSection({ content }: { content: Record<string, unknown> }) {
  const c = content as any;
  return (
    <section className="py-16 px-6 max-w-4xl mx-auto">
      {c.title && (
        <h2
          className="text-2xl md:text-3xl font-bold mb-8 text-center"
          style={{ color: "#f5f0e8", fontFamily: "Cormorant Garamond, serif" }}
        >
          {c.title}
        </h2>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {(c.metrics ?? []).map((m: string, i: number) => (
          <div
            key={i}
            className="rounded-xl p-5 text-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(212,168,83,0.15)" }}
          >
            <div className="text-2xl font-bold" style={{ color: "#d4a853" }}>{m}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FormSection({
  content,
  formConfig,
  funnelSlug,
  pageSlug,
  onSubmitted,
}: {
  content: Record<string, unknown>;
  formConfig: any;
  funnelSlug: string;
  pageSlug: string;
  onSubmitted: (msg: string) => void;
}) {
  const c = content as any;
  const fields: string[] = formConfig?.fields ?? c.fields ?? ["name", "email"];
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f: string) => [f, ""]))
  );

  const submit = trpc.funnels.submitForm.useMutation({
    onSuccess: (data) => {
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        onSubmitted(data.thankYouMessage ?? "Thank you! We'll be in touch soon.");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Submission failed. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit.mutate({
      funnelSlug,
      pageSlug,
      formData: values,
      sourceUrl: window.location.href,
    });
  };

  return (
    <section id="funnel-form" className="py-16 px-6 max-w-lg mx-auto">
      {c.title && (
        <h2
          className="text-2xl md:text-3xl font-bold mb-8 text-center"
          style={{ color: "#f5f0e8", fontFamily: "Cormorant Garamond, serif" }}
        >
          {c.title}
        </h2>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field: string) => (
          <div key={field}>
            <Label
              htmlFor={`field-${field}`}
              className="text-sm capitalize mb-1.5 block"
              style={{ color: "rgba(245,240,232,0.6)" }}
            >
              {field}
            </Label>
            <Input
              id={`field-${field}`}
              type={field === "email" ? "email" : "text"}
              required
              value={values[field] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [field]: e.target.value }))}
              placeholder={`Your ${field}`}
              className="bg-white/5 border-white/10 text-ivory placeholder:text-ivory/30 focus:border-[#d4a853]/50"
            />
          </div>
        ))}
        <Button
          type="submit"
          disabled={submit.isPending}
          className="w-full py-3 font-semibold text-black mt-2"
          style={{ background: "#d4a853" }}
        >
          {submit.isPending ? (
            <Loader2 className="animate-spin mr-2 h-4 w-4 inline" />
          ) : null}
          {formConfig?.submitLabel ?? c.submitLabel ?? "Submit"}
        </Button>
      </form>
    </section>
  );
}

function SectionRenderer({
  section,
  funnelSlug,
  pageSlug,
  formConfig,
  onFormSubmitted,
}: {
  section: Section;
  funnelSlug: string;
  pageSlug: string;
  formConfig: any;
  onFormSubmitted: (msg: string) => void;
}) {
  switch (section.type) {
    case "hero":
      return <HeroSection content={section.content} />;
    case "benefits":
    case "agenda":
      return <BenefitsSection content={section.content} />;
    case "about":
      return <AboutSection content={section.content} />;
    case "results":
      return <ResultsSection content={section.content} />;
    case "form":
      return (
        <FormSection
          content={section.content}
          formConfig={formConfig}
          funnelSlug={funnelSlug}
          pageSlug={pageSlug}
          onSubmitted={onFormSubmitted}
        />
      );
    default:
      return null;
  }
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PublicFunnel() {
  const { slug } = useParams<{ slug: string }>();
  const [submitted, setSubmitted] = useState<string | null>(null);

  const { data, isLoading, error } = trpc.funnels.getPublicPage.useQuery(
    { funnelSlug: slug ?? "", pageSlug: "main" },
    { enabled: !!slug, retry: false }
  );

  // Track view once on mount (fire-and-forget, non-blocking)
  const trackView = trpc.funnels.trackView.useMutation();
  const trackedRef = useRef(false);
  useEffect(() => {
    if (!slug || trackedRef.current) return;
    trackedRef.current = true;
    trackView.mutate({ funnelSlug: slug, pageSlug: "main" });
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#0a0908" }}
      >
        <Loader2 className="animate-spin h-8 w-8" style={{ color: "#d4a853" }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center"
        style={{ background: "#0a0908" }}
      >
        <AlertCircle className="h-10 w-10" style={{ color: "rgba(245,240,232,0.3)" }} />
        <h1
          className="text-2xl font-bold"
          style={{ color: "#f5f0e8", fontFamily: "Cormorant Garamond, serif" }}
        >
          Page not found
        </h1>
        <p style={{ color: "rgba(245,240,232,0.5)" }}>
          This funnel page doesn't exist or is no longer published.
        </p>
      </div>
    );
  }

  const { funnel, page } = data;
  const sections: Section[] = (page.sections as Section[]) ?? [];
  const formConfig = page.formConfig as any;

  if (submitted) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center"
        style={{ background: "#0a0908" }}
      >
        <CheckCircle2 className="h-12 w-12" style={{ color: "#d4a853" }} />
        <h2
          className="text-3xl font-bold"
          style={{ color: "#f5f0e8", fontFamily: "Cormorant Garamond, serif" }}
        >
          You're in.
        </h2>
        <p className="max-w-sm text-base" style={{ color: "rgba(245,240,232,0.65)" }}>
          {submitted}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0a0908" }}>
      {/* Minimal branded header */}
      <header
        className="px-6 py-4 flex items-center justify-between border-b"
        style={{ borderColor: "rgba(212,168,83,0.1)" }}
      >
        <span
          className="text-sm tracking-[0.15em] uppercase"
          style={{ color: "rgba(212,168,83,0.6)", fontFamily: "Fira Code, monospace" }}
        >
          {funnel.name}
        </span>
        <span
          className="text-xs"
          style={{ color: "rgba(245,240,232,0.25)", fontFamily: "Fira Code, monospace" }}
        >
          Operator House
        </span>
      </header>

      {/* Sections */}
      <main>
        {sections.map((section, i) => (
          <SectionRenderer
            key={i}
            section={section}
            funnelSlug={slug ?? ""}
            pageSlug="main"
            formConfig={formConfig}
            onFormSubmitted={setSubmitted}
          />
        ))}
        {sections.length === 0 && (
          <div className="py-32 text-center" style={{ color: "rgba(245,240,232,0.3)" }}>
            This page has no content yet.
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className="px-6 py-8 text-center border-t mt-16"
        style={{ borderColor: "rgba(212,168,83,0.08)" }}
      >
        <p
          className="text-xs"
          style={{ color: "rgba(245,240,232,0.2)", fontFamily: "Fira Code, monospace" }}
        >
          Powered by Operator House
        </p>
      </footer>
    </div>
  );
}
