/**
 * Phase 14: Contracts & E-Sign Router
 */
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { contracts, crmContacts, portalDocuments, clientPortals } from "../../drizzle/schema";

const resend = new Resend(ENV.resendApiKey);
const FROM = "Operator House <onboarding@resend.dev>";

export const contractsRouter = router({
  // List all contracts for the operator
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const rows = await db
      .select()
      .from(contracts)
      .where(eq(contracts.userId, ctx.user.id))
      .orderBy(desc(contracts.createdAt));

    const enriched = await Promise.all(
      rows.map(async (c) => {
        if (!c.contactId) return { ...c, contact: null };
        const [contact] = await db
          .select({ firstName: crmContacts.firstName, lastName: crmContacts.lastName, email: crmContacts.email })
          .from(crmContacts)
          .where(eq(crmContacts.id, c.contactId))
          .limit(1);
        return { ...c, contact: contact ?? null };
      })
    );
    return enriched;
  }),

  // Get single contract
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [c] = await db
        .select()
        .from(contracts)
        .where(and(eq(contracts.id, input.id), eq(contracts.userId, ctx.user.id)))
        .limit(1);
      if (!c) throw new Error("Contract not found");
      return c;
    }),

  // Create contract
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      body: z.string().min(1),
      contactId: z.number().optional(),
      signerName: z.string().optional(),
      signerEmail: z.string().email().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(contracts).values({
        userId: ctx.user.id,
        title: input.title,
        body: input.body,
        contactId: input.contactId,
        signerName: input.signerName,
        signerEmail: input.signerEmail,
      });
      return { id: (result as any).insertId as number };
    }),

  // Update contract (draft only)
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      body: z.string().min(1).optional(),
      signerName: z.string().optional(),
      signerEmail: z.string().email().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const { id, ...fields } = input;
      await db.update(contracts).set(fields).where(
        and(eq(contracts.id, id), eq(contracts.userId, ctx.user.id))
      );
      return { ok: true };
    }),

  // Send contract for signing (generates token + emails signer)
  send: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [c] = await db
        .select()
        .from(contracts)
        .where(and(eq(contracts.id, input.id), eq(contracts.userId, ctx.user.id)))
        .limit(1);
      if (!c) throw new Error("Contract not found");
      if (!c.signerEmail) throw new Error("No signer email set");

      const token = randomBytes(32).toString("hex");
      const signUrl = `${ENV.publicUrl}/sign/${token}`;

      await db.update(contracts).set({
        status: "sent",
        signToken: token,
        sentAt: new Date(),
      }).where(eq(contracts.id, c.id));

      // Email the signer
      try {
        await resend.emails.send({
          from: FROM,
          to: c.signerEmail,
          subject: `Please sign: ${c.title}`,
          text: `Hi ${c.signerName ?? "there"},\n\nYou have been sent a contract to review and sign.\n\nContract: ${c.title}\n\nSign here: ${signUrl}\n\nThis link is unique to you. Please do not share it.`,
        });
      } catch (err) {
        console.error("[Contracts] Email send error:", err);
      }

      return { ok: true, token };
    }),

  // Void contract
  void: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db.update(contracts).set({ status: "voided" }).where(
        and(eq(contracts.id, input.id), eq(contracts.userId, ctx.user.id))
      );
      return { ok: true };
    }),

  // ─── Public: get contract by sign token ────────────────────────────────────
  getByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const [c] = await db
        .select()
        .from(contracts)
        .where(eq(contracts.signToken, input.token))
        .limit(1);
      if (!c) throw new Error("Invalid or expired signing link");
      if (c.status === "voided") throw new Error("This contract has been voided");
      if (c.status === "signed") return { contract: c, alreadySigned: true };

      // Mark as viewed
      if (c.status === "sent") {
        await db.update(contracts).set({ status: "viewed", viewedAt: new Date() }).where(eq(contracts.id, c.id));
      }

      return { contract: { ...c, status: c.status === "sent" ? "viewed" : c.status }, alreadySigned: false };
    }),

  // ─── Public: sign contract ─────────────────────────────────────────────────
  sign: publicProcedure
    .input(z.object({
      token: z.string(),
      signerName: z.string().min(1),
      signatureData: z.string().min(1), // base64 canvas data
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const [c] = await db
        .select()
        .from(contracts)
        .where(eq(contracts.signToken, input.token))
        .limit(1);
      if (!c) throw new Error("Invalid signing link");
      if (c.status === "signed") throw new Error("Already signed");
      if (c.status === "voided") throw new Error("Contract voided");

      await db.update(contracts).set({
        status: "signed",
        signerName: input.signerName,
        signatureData: input.signatureData,
        signedAt: new Date(),
      }).where(eq(contracts.id, c.id));

       // Auto-attach to client portal if one exists for this contact
      try {
        if (c.contactId) {
          const [portal] = await db.select({ id: clientPortals.id })
            .from(clientPortals)
            .where(eq(clientPortals.contactId, c.contactId))
            .limit(1);
          if (portal) {
            await db.insert(portalDocuments).values({
              portalId: portal.id,
              userId: c.userId,
              title: c.title,
              type: "contract",
              status: "signed",
            });
          }
        }
        console.log(`[Contracts] Contract ${c.id} "${c.title}" signed by ${input.signerName}`);
      } catch (err) {
        console.error("[Contracts] Portal doc attach error:", err);
      }
      return { ok: true };
    }),

  // Templates
  getTemplates: protectedProcedure.query(() => {
    return [
      {
        id: "service-agreement",
        title: "Service Agreement",
        body: `SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into as of [DATE] between [OPERATOR NAME] ("Service Provider") and [CLIENT NAME] ("Client").

1. SERVICES
Service Provider agrees to provide the following services: [DESCRIBE SERVICES]

2. COMPENSATION
Client agrees to pay Service Provider [AMOUNT] per [PERIOD/PROJECT].

3. TERM
This Agreement begins on [START DATE] and continues until [END DATE] or until terminated.

4. TERMINATION
Either party may terminate this Agreement with [X] days written notice.

5. CONFIDENTIALITY
Both parties agree to keep all business information confidential.

6. INTELLECTUAL PROPERTY
All work product created under this Agreement belongs to Client upon full payment.

7. LIMITATION OF LIABILITY
Service Provider's liability is limited to the total fees paid under this Agreement.

IN WITNESS WHEREOF, the parties have executed this Agreement.

Service Provider: _______________________  Date: ___________

Client: _______________________  Date: ___________`,
      },
      {
        id: "nda",
        title: "Non-Disclosure Agreement",
        body: `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is made between [DISCLOSING PARTY] and [RECEIVING PARTY] as of [DATE].

1. CONFIDENTIAL INFORMATION
"Confidential Information" means any non-public information disclosed by either party.

2. OBLIGATIONS
The Receiving Party agrees to: (a) keep all Confidential Information strictly confidential; (b) not disclose it to third parties without prior written consent; (c) use it only for the purpose of evaluating a potential business relationship.

3. EXCLUSIONS
This Agreement does not apply to information that is publicly known, independently developed, or required by law to be disclosed.

4. TERM
This Agreement is effective for [X] years from the date above.

5. REMEDIES
Breach of this Agreement may cause irreparable harm, entitling the non-breaching party to seek injunctive relief.

Agreed and accepted:

Disclosing Party: _______________________  Date: ___________

Receiving Party: _______________________  Date: ___________`,
      },
      {
        id: "consulting",
        title: "Consulting Agreement",
        body: `CONSULTING AGREEMENT

This Consulting Agreement is entered into as of [DATE] between [CONSULTANT NAME] ("Consultant") and [CLIENT NAME] ("Client").

1. CONSULTING SERVICES
Consultant will provide: [DESCRIBE SCOPE OF WORK]

2. FEES AND PAYMENT
Client will pay Consultant [RATE] per [HOUR/PROJECT]. Invoices are due within [X] days.

3. INDEPENDENT CONTRACTOR
Consultant is an independent contractor, not an employee of Client.

4. WORK PRODUCT
Upon full payment, all deliverables become the exclusive property of Client.

5. NON-SOLICITATION
Client agrees not to solicit Consultant's employees or contractors for [X] months after termination.

6. GOVERNING LAW
This Agreement is governed by the laws of [STATE/JURISDICTION].

Consultant: _______________________  Date: ___________

Client: _______________________  Date: ___________`,
      },
      {
        id: "retainer",
        title: "Monthly Retainer Agreement",
        body: `MONTHLY RETAINER AGREEMENT

This Retainer Agreement ("Agreement") is between [PROVIDER NAME] ("Provider") and [CLIENT NAME] ("Client"), effective [DATE].

1. RETAINER SERVICES
Provider will make available up to [X] hours per month for: [DESCRIBE SERVICES]

2. RETAINER FEE
Client will pay a monthly retainer of $[AMOUNT], due on the [DAY] of each month.

3. UNUSED HOURS
Unused hours do not roll over to the following month.

4. ADDITIONAL WORK
Work beyond the retainer hours will be billed at $[RATE]/hour.

5. TERM AND RENEWAL
This Agreement renews automatically each month unless cancelled with [X] days notice.

6. TERMINATION
Either party may terminate with [X] days written notice.

Provider: _______________________  Date: ___________

Client: _______________________  Date: ___________`,
      },
    ];
  }),
});
