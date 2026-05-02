import AppLayout from "@/components/AppLayout";
import { Telescope, Radar, Target, Zap, Mail, Phone, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const FEATURES = [
  {
    icon: Radar,
    title: "Signal Detection",
    body: "Monitor LinkedIn, job boards, and news feeds for buying signals — new hires, funding rounds, tech stack changes.",
  },
  {
    icon: Target,
    title: "ICP Scoring",
    body: "Automatically score every prospect against your ideal client profile. Surface the 20% worth your time.",
  },
  {
    icon: Zap,
    title: "One-Click Enrichment",
    body: "Pull contact info, company size, revenue, and tech stack from 30+ data sources in a single click.",
  },
  {
    icon: Mail,
    title: "Outreach Sequences",
    body: "Push qualified prospects directly into your Email Sequences or SMS Outreach with pre-filled context.",
  },
  {
    icon: Phone,
    title: "Call Priority Queue",
    body: "Hot prospects surface at the top of your Call Center queue — never let a warm lead go cold.",
  },
];

export default function Prospecting() {
  return (
    <AppLayout title="Prospecting Engine" subtitle="Identify and engage your next best clients">
      <div
        className="flex flex-col items-center justify-center"
        style={{ minHeight: "60vh", padding: "3rem 1.5rem", textAlign: "center" }}
      >
        {/* Icon */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "rgba(216,168,90,0.08)",
            border: "1px solid rgba(216,168,90,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1.5rem",
            animation: "oh-fade-up 400ms ease both",
          }}
        >
          <Telescope size={32} style={{ color: "var(--gold-bright)" }} />
        </div>

        {/* Heading */}
        <h1
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "0.75rem",
            animation: "oh-fade-up 400ms ease 60ms both",
          }}
        >
          Prospecting Engine
        </h1>
        <p
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: "1rem",
            color: "var(--text-muted)",
            maxWidth: 480,
            lineHeight: 1.6,
            marginBottom: "2.5rem",
            animation: "oh-fade-up 400ms ease 120ms both",
          }}
        >
          Automated prospect discovery, ICP scoring, and enrichment — so you spend time closing,
          not searching. Coming in the next release.
        </p>

        {/* Feature grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
            width: "100%",
            maxWidth: 860,
            marginBottom: "2.5rem",
            animation: "oh-fade-up 400ms ease 180ms both",
          }}
        >
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 12,
                padding: "1.25rem 1.1rem",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "rgba(216,168,90,0.07)",
                  border: "1px solid rgba(216,168,90,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "0.75rem",
                }}
              >
                <Icon size={16} style={{ color: "var(--gold-bright)" }} />
              </div>
              <p
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: "0.35rem",
                }}
              >
                {title}
              </p>
              <p
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  lineHeight: 1.5,
                }}
              >
                {body}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.75rem",
            animation: "oh-fade-up 400ms ease 240ms both",
          }}
        >
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "0.85rem",
              color: "var(--text-muted)",
            }}
          >
            In the meantime, use Lead Intelligence to audit individual prospects.
          </p>
          <Link href="/leads">
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.65rem 1.4rem",
                background: "rgba(216,168,90,0.1)",
                border: "1px solid rgba(216,168,90,0.3)",
                borderRadius: 8,
                fontFamily: "DM Sans, sans-serif",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--gold-bright)",
                cursor: "pointer",
                transition: "background 200ms, border-color 200ms",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(216,168,90,0.18)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(216,168,90,0.5)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(216,168,90,0.1)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(216,168,90,0.3)";
              }}
            >
              Open Lead Intelligence <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
