/* =============================================================================
   CapabilityGate — shows a "service not connected" banner when a required
   external service (Twilio, VAPI, etc.) is not configured in env vars.
   Usage:
     <CapabilityGate capability="twilio" serviceName="Twilio" setupPath="/integrations">
       <YourPage />
     </CapabilityGate>
   ============================================================================= */
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowRight, Plug } from "lucide-react";
import { Link } from "wouter";

type CapabilityKey = "twilio" | "vapi" | "emailDispatch" | "stripe" | "socialLinkedIn" | "socialTwitter";

interface CapabilityGateProps {
  /** Which capability key to check from trpc.capabilities.check */
  capability: CapabilityKey;
  /** Human-readable service name shown in the banner */
  serviceName: string;
  /** Short description of what connecting enables */
  description?: string;
  /** Where to send the user to set it up (defaults to /integrations) */
  setupPath?: string;
  /** Content to render when capability IS available */
  children: React.ReactNode;
}

export function CapabilityGate({
  capability,
  serviceName,
  description,
  setupPath = "/integrations",
  children,
}: CapabilityGateProps) {
  const { data, isLoading } = trpc.capabilities.check.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  // While loading, render children optimistically (avoids flash of "not connected")
  if (isLoading || data === undefined) return <>{children}</>;

  const isConnected = data[capability];

  if (isConnected) return <>{children}</>;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: "3rem 1.5rem",
        textAlign: "center",
        animation: "oh-fade-up 350ms ease both",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "rgba(234,179,8,0.07)",
          border: "1px solid rgba(234,179,8,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1.25rem",
        }}
      >
        <Plug size={26} style={{ color: "rgba(234,179,8,0.8)" }} />
      </div>

      {/* Heading */}
      <h2
        style={{
          fontFamily: "Playfair Display, serif",
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "0.5rem",
        }}
      >
        {serviceName} not connected
      </h2>

      {/* Body */}
      <p
        style={{
          fontFamily: "DM Sans, sans-serif",
          fontSize: "0.9rem",
          color: "var(--text-muted)",
          maxWidth: 420,
          lineHeight: 1.65,
          marginBottom: "1.75rem",
        }}
      >
        {description ??
          `This feature requires ${serviceName} to be configured. Add your credentials in Settings to activate it.`}
      </p>

      {/* Warning pill */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.45rem 1rem",
          background: "rgba(234,179,8,0.06)",
          border: "1px solid rgba(234,179,8,0.18)",
          borderRadius: 999,
          fontFamily: "Fira Code, monospace",
          fontSize: "0.72rem",
          color: "rgba(234,179,8,0.75)",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          marginBottom: "1.5rem",
        }}
      >
        <AlertTriangle size={12} />
        Setup required
      </div>

      {/* CTA */}
      <Link href={setupPath}>
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
          Go to Integrations <ArrowRight size={14} />
        </button>
      </Link>
    </div>
  );
}
