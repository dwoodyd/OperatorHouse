import { Link } from "wouter";
import { ArrowLeft, ExternalLink } from "lucide-react";

const EFFECTIVE_DATE = "August 16, 2026";
const CONTACT_EMAIL = "hello@mail.operatorhouse.click";

const sections = [
  ["1. Scope and contact", "This Privacy Policy explains how Operator House handles personal information when you use our website, application, booking pages, emails, and support channels. For privacy questions or a data request, email hello@mail.operatorhouse.click."],
  ["2. Information we process", "We process account information such as your name and email address; workspace content such as leads, clients, pipeline records, tasks, strategies, briefings, Vault entries, and outreach settings; payment and subscription status; support or application-form messages; device and session information used to provide secure access; and operational records such as notification preferences and email-send history."],
  ["3. How we use information", "We use this information to authenticate you, operate your workspace, generate requested AI-assisted work, provide account and billing support, deliver requested notifications and email sequences, protect the service from abuse, and improve reliability. We do not sell personal information or use it for third-party advertising."],
  ["4. AI-assisted features", "When you ask Specter to analyze a lead, generate a strategy, prepare a briefing, or answer a workspace question, the application sends the relevant prompt and selected workspace context to the Manus AI service to produce that response. Vault-grounded workflows may include relevant Vault and lead content so the result can be specific to your workspace. You should review AI-generated output before acting on it or sharing it externally."],
  ["5. Service providers", "We use service providers to operate specific functions: Manus for application infrastructure, OAuth authentication, storage, and AI capabilities; PayPal for subscription setup and payment processing; Resend for application email delivery; and Calendly when you choose to book a public audit. These providers process information under their own terms and privacy notices. Optional privacy analytics are inactive unless configured for the relevant deployment."],
  ["6. Cookies and local storage", "We use signed session cookies to keep you authenticated. The app may also use browser session or local storage for non-sensitive experience state such as restoring an intended post-login destination, remembering whether onboarding was completed, and supporting the installed web-app experience. We do not use advertising cookies."],
  ["7. Security and access controls", "We use account-scoped data access controls, signed session cookies, transport security provided by the application platform, rate limiting for sensitive endpoints, and operational monitoring to help protect the service. No internet service can guarantee absolute security; protect your sign-in credentials and notify us promptly if you suspect unauthorized access."],
  ["8. Retention and deletion", "You can request account deletion from Settings. The application removes associated workspace records through its account-deletion workflow. Limited records may remain temporarily in security logs, payment-provider records, or provider backups where necessary for fraud prevention, legal obligations, or normal backup rotation. We will explain any material limitation when responding to a deletion request."],
  ["9. Your choices and rights", "You can update workspace information, manage browser notifications, cancel an eligible subscription through the available billing controls, and request access, correction, export, or deletion of personal information by contacting us. Depending on your location, you may have additional privacy rights; we will evaluate requests under applicable law."],
  ["10. Changes", "We may update this Policy as the product or its providers change. We will post the revised effective date here and, where required, provide additional notice for material changes."],
] as const;

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[var(--obsidian)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--obsidian)]/95 px-6 py-4 backdrop-blur">
        <Link href="/" className="flex items-center gap-2 text-sm text-[var(--text-muted)] no-underline hover:text-[var(--ivory)]"><ArrowLeft size={14} />Back</Link>
        <span className="text-[var(--border-subtle)]">|</span><span className="font-mono text-xs text-[var(--amber)]">Privacy Policy</span>
      </header>
      <main className="mx-auto max-w-3xl space-y-8 px-6 py-12">
        <div>
          <h1 className="font-serif text-4xl font-bold text-[var(--ivory)]">Privacy Policy</h1>
          <p className="mt-2 font-mono text-xs text-[var(--text-muted)]">Effective date: {EFFECTIVE_DATE}</p>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">This is a product-facing privacy notice for Operator House. It is intended to describe the service as currently implemented and should be reviewed by counsel before a public legal launch.</p>
        </div>
        {sections.map(([title, body]) => <section key={title}><h2 className="mb-2 text-[15px] font-bold text-[var(--ivory)]">{title}</h2><p className="text-sm leading-7 text-[var(--text-secondary)]">{body}</p></section>)}
        <div className="border-t border-[var(--border-subtle)] pt-6 text-sm"><Link href="/terms" className="text-[var(--amber)] no-underline">View Terms of Service →</Link><a href={`mailto:${CONTACT_EMAIL}`} className="ml-6 inline-flex items-center gap-1 text-[var(--text-secondary)] no-underline hover:text-[var(--ivory)]">Contact privacy <ExternalLink size={12} /></a></div>
      </main>
    </div>
  );
}
