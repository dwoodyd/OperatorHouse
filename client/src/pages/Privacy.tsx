import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

const EFFECTIVE_DATE = "April 10, 2026";
const CONTACT_EMAIL = "privacy@operatorhousehq.com";
const APP_URL = "https://operatorhousehq.manus.space";

export default function Privacy() {
  return (
    <div className="min-h-screen" style={{ background: "var(--obsidian)", color: "var(--text-primary)" }}>
      {/* Nav */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-6 py-4" style={{ background: "var(--obsidian)", borderBottom: "1px solid var(--border-subtle)" }}>
        <Link href="/" className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
          <ArrowLeft size={14} />
          Back
        </Link>
        <span style={{ color: "var(--border-subtle)" }}>|</span>
        <span style={{ fontSize: "13px", fontFamily: "Fira Code, monospace", color: "var(--amber)" }}>Privacy Policy</span>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
        <div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: "32px", fontWeight: 700, color: "var(--ivory)" }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px", fontFamily: "DM Sans, sans-serif" }}>
            Effective date: {EFFECTIVE_DATE}
          </p>
        </div>

        {[
          {
            title: "1. Who We Are",
            body: `Operator House ("we," "us," or "our") is an AI-powered consulting command center available at ${APP_URL}. This Privacy Policy explains how we collect, use, and protect your personal information when you use our service.`,
          },
          {
            title: "2. Information We Collect",
            body: "We collect information you provide directly: your name, email address, and any content you enter into the application (leads, pipeline deals, vault items, strategies, tasks, and briefings). We also collect standard server logs including IP addresses, browser type, and usage timestamps for security and rate-limiting purposes.",
          },
          {
            title: "3. How We Use Your Information",
            body: "Your data is used exclusively to provide the Operator House service. Lead and vault data is passed to our AI provider (Manus AI) to generate audits, strategies, and briefings on your behalf. We do not sell your data, share it with third-party advertisers, or use it to train AI models without your explicit consent.",
          },
          {
            title: "4. AI Provider Disclosure",
            body: "Operator House uses Manus AI as its underlying AI provider for lead audits, strategy generation, briefings, and the Command Line chat. When you submit a prompt, the relevant context from your account (vault items, lead data) is sent to the Manus AI API over an encrypted connection. Manus AI processes this data to generate a response, which is then returned to your account.",
          },
          {
            title: "5. Data Storage and Security",
            body: "All user data is stored in an encrypted database hosted on TiDB Cloud. Session authentication uses signed JWT cookies. All data is scoped to your individual account — no user can access another user's data. We apply rate limiting on all AI endpoints to prevent abuse.",
          },
          {
            title: "6. Data Retention and Deletion",
            body: "You may delete your account and all associated data at any time from Settings → Danger Zone → Delete Account. This action permanently and irreversibly removes all your leads, deals, vault items, strategies, tasks, briefings, and your user record from our database. We do not retain backups of deleted accounts beyond 30 days.",
          },
          {
            title: "7. Cookies",
            body: "We use a single session cookie to maintain your authenticated state. This cookie is HttpOnly, Secure, and SameSite=Lax. We do not use tracking cookies, analytics cookies, or third-party advertising cookies.",
          },
          {
            title: "8. Third-Party Services",
            body: "We use Manus OAuth for authentication and Manus AI for AI inference. Both services are operated by Manus and subject to Manus's own privacy policy. We do not integrate with any other third-party data processors.",
          },
          {
            title: "9. Your Rights",
            body: "You have the right to access, correct, export, or delete your personal data at any time. To exercise these rights, use the in-app Settings page or contact us at the email below. We will respond to all requests within 30 days.",
          },
          {
            title: "10. Changes to This Policy",
            body: "We may update this Privacy Policy as the service evolves. We will notify you of material changes by updating the effective date at the top of this page. Continued use of the service after changes constitutes acceptance of the updated policy.",
          },
          {
            title: "11. Contact",
            body: `For privacy-related questions or requests, contact us at ${CONTACT_EMAIL}.`,
          },
        ].map(({ title, body }) => (
          <div key={title}>
            <h2 style={{ fontFamily: "DM Sans, sans-serif", fontSize: "15px", fontWeight: 700, color: "var(--ivory)", marginBottom: "8px" }}>
              {title}
            </h2>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
              {body}
            </p>
          </div>
        ))}

        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "24px" }}>
          <Link href="/terms" style={{ fontSize: "13px", color: "var(--amber)", textDecoration: "none", fontFamily: "DM Sans, sans-serif" }}>
            View Terms of Service →
          </Link>
        </div>
      </div>
    </div>
  );
}
