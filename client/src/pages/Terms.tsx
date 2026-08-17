import { Link } from "wouter";
import { ArrowLeft, ExternalLink } from "lucide-react";

const EFFECTIVE_DATE = "August 16, 2026";
const CONTACT_EMAIL = "hello@mail.operatorhouse.click";

const sections = [
  ["1. Agreement", "These Terms govern your use of Operator House. By creating an account, accessing the application, or using a booking or billing flow, you agree to these Terms. If you do not agree, do not use the service."],
  ["2. The service", "Operator House provides software for sales operations, including lead intelligence, pipeline management, Vault-grounded strategy work, client briefings, outreach tools, and related features. Features may change as the product evolves, and some features may be marked beta or require an external provider to be configured."],
  ["3. Accounts and eligibility", "You must be at least 18 and able to enter into a binding agreement. You are responsible for activity under your account and for keeping your access credentials secure. Do not share access in a way that bypasses the plan, permission, or invitation controls made available to you."],
  ["4. Your content and permissions", "You retain your rights in content you submit, including lead records, client information, Vault entries, strategies, and outreach drafts. You grant Operator House the limited permission needed to store, process, transmit to the configured service providers, and display that content solely to operate and support the service."],
  ["5. AI-assisted output and outreach", "Specter’s audits, strategies, briefings, and drafts are productivity tools, not legal, financial, tax, employment, or other professional advice. You are responsible for reviewing output, validating claims, securing required permissions, and deciding whether to send any outreach. Operator House does not automatically send LinkedIn connection requests or messages on your behalf."],
  ["6. Acceptable use", "Do not use the service to break the law, infringe others’ rights, transmit malicious code, access another account without permission, misrepresent AI output as verified fact, scrape or overload the service, or send unlawful, deceptive, or unsolicited communications. You must comply with applicable privacy, marketing, and communications laws when using outreach features."],
  ["7. Trials, subscriptions, and billing", "Where offered, a founding subscription may include a 90-day no-charge trial followed by the plan and price displayed in the billing flow. Subscription setup and payment processing are handled by PayPal under its terms. You can review plan details before approval and manage or cancel an eligible subscription through the billing controls. Taxes, refunds, and payment disputes are handled according to the applicable billing terms and law."],
  ["8. Availability and support", "We work to provide a reliable service but do not promise uninterrupted or error-free availability. We may maintain, modify, suspend, or retire features when reasonably necessary for security, reliability, legal compliance, or product operations."],
  ["9. Disclaimers and liability", "The service is provided on an “as available” basis. To the extent permitted by law, Operator House disclaims implied warranties and is not liable for indirect, incidental, special, consequential, or punitive losses arising from use of the service. Nothing in these Terms limits liability that cannot lawfully be limited."],
  ["10. Termination and deletion", "You may stop using the service or request account deletion through Settings. We may suspend or terminate access for a material breach, security risk, or legal requirement. The privacy notice explains how application data is handled after a deletion request."],
  ["11. Governing law and updates", "These Terms are governed by the laws of California, excluding conflict-of-law rules, unless applicable law requires otherwise. We may update these Terms by posting a revised effective date and providing additional notice when required for a material change."],
  ["12. Contact", "For questions about these Terms, email hello@mail.operatorhouse.click."],
] as const;

export default function Terms() {
  return (
    <div className="min-h-screen bg-[var(--obsidian)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--obsidian)]/95 px-6 py-4 backdrop-blur">
        <Link href="/" className="flex items-center gap-2 text-sm text-[var(--text-muted)] no-underline hover:text-[var(--ivory)]"><ArrowLeft size={14} />Back</Link>
        <span className="text-[var(--border-subtle)]">|</span><span className="font-mono text-xs text-[var(--amber)]">Terms of Service</span>
      </header>
      <main className="mx-auto max-w-3xl space-y-8 px-6 py-12">
        <div><h1 className="font-serif text-4xl font-bold text-[var(--ivory)]">Terms of Service</h1><p className="mt-2 font-mono text-xs text-[var(--text-muted)]">Effective date: {EFFECTIVE_DATE}</p><p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">This is a product-facing working draft that should be reviewed by California-qualified counsel before public legal reliance.</p></div>
        {sections.map(([title, body]) => <section key={title}><h2 className="mb-2 text-[15px] font-bold text-[var(--ivory)]">{title}</h2><p className="text-sm leading-7 text-[var(--text-secondary)]">{body}</p></section>)}
        <div className="border-t border-[var(--border-subtle)] pt-6 text-sm"><Link href="/privacy" className="text-[var(--amber)] no-underline">View Privacy Policy →</Link><a href={`mailto:${CONTACT_EMAIL}`} className="ml-6 inline-flex items-center gap-1 text-[var(--text-secondary)] no-underline hover:text-[var(--ivory)]">Contact us <ExternalLink size={12} /></a></div>
      </main>
    </div>
  );
}
