import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  workflows,
  workflowNodes,
  workflowExecutions,
  workflowExecutionLogs,
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// ─── Trigger Types ────────────────────────────────────────────────────────────
export const TRIGGER_TYPES = [
  { id: "new_lead", label: "New Lead Added", category: "CRM" },
  { id: "deal_stage_changed", label: "Deal Stage Changed", category: "CRM" },
  { id: "contact_created", label: "Contact Created", category: "CRM" },
  { id: "invoice_paid", label: "Invoice Paid", category: "Billing" },
  { id: "invoice_overdue", label: "Invoice Overdue", category: "Billing" },
  { id: "booking_confirmed", label: "Booking Confirmed", category: "Scheduling" },
  { id: "funnel_submission", label: "Funnel Form Submitted", category: "Funnels" },
  { id: "manual", label: "Manual Trigger", category: "General" },
  { id: "schedule_daily", label: "Daily Schedule", category: "General" },
  { id: "schedule_weekly", label: "Weekly Schedule", category: "General" },
] as const;

// ─── Action Types ─────────────────────────────────────────────────────────────
export const ACTION_TYPES = [
  { id: "send_email", label: "Send Email", category: "Communication" },
  { id: "send_sms", label: "Send SMS", category: "Communication" },
  { id: "create_task", label: "Create Task", category: "CRM" },
  { id: "update_deal_stage", label: "Update Deal Stage", category: "CRM" },
  { id: "add_crm_note", label: "Add CRM Note", category: "CRM" },
  { id: "create_invoice", label: "Create Invoice", category: "Billing" },
  { id: "notify_owner", label: "Notify Owner", category: "Notifications" },
  { id: "add_to_email_sequence", label: "Add to Email Sequence", category: "Outreach" },
  { id: "generate_ai_content", label: "Generate AI Content", category: "AI" },
  { id: "wait_delay", label: "Wait / Delay", category: "Flow" },
  { id: "condition_check", label: "If/Else Condition", category: "Flow" },
] as const;

// ─── Workflow Templates ───────────────────────────────────────────────────────
const WORKFLOW_TEMPLATES = [
  {
    id: "new_lead_followup",
    name: "New Lead Follow-Up",
    description: "Automatically send a follow-up email when a new lead is added",
    triggerType: "new_lead",
    nodes: [
      { nodeType: "trigger", actionType: "new_lead", label: "New Lead Added", positionX: 100, positionY: 50 },
      { nodeType: "delay", actionType: "wait_delay", label: "Wait 1 Hour", positionX: 100, positionY: 180, config: { hours: 1 } },
      { nodeType: "action", actionType: "send_email", label: "Send Welcome Email", positionX: 100, positionY: 310 },
      { nodeType: "action", actionType: "create_task", label: "Create Follow-Up Task", positionX: 100, positionY: 440 },
    ],
  },
  {
    id: "invoice_reminder",
    name: "Invoice Overdue Reminder",
    description: "Send SMS and email when an invoice becomes overdue",
    triggerType: "invoice_overdue",
    nodes: [
      { nodeType: "trigger", actionType: "invoice_overdue", label: "Invoice Overdue", positionX: 100, positionY: 50 },
      { nodeType: "action", actionType: "send_email", label: "Send Overdue Email", positionX: 100, positionY: 180 },
      { nodeType: "action", actionType: "send_sms", label: "Send Overdue SMS", positionX: 100, positionY: 310 },
      { nodeType: "action", actionType: "notify_owner", label: "Notify Owner", positionX: 100, positionY: 440 },
    ],
  },
  {
    id: "booking_confirmation",
    name: "Booking Confirmation Flow",
    description: "Send confirmation email and create prep task when booking is confirmed",
    triggerType: "booking_confirmed",
    nodes: [
      { nodeType: "trigger", actionType: "booking_confirmed", label: "Booking Confirmed", positionX: 100, positionY: 50 },
      { nodeType: "action", actionType: "send_email", label: "Send Confirmation Email", positionX: 100, positionY: 180 },
      { nodeType: "action", actionType: "create_task", label: "Create Prep Task", positionX: 100, positionY: 310 },
    ],
  },
  {
    id: "funnel_lead_capture",
    name: "Funnel Lead Capture",
    description: "Add funnel submissions to email sequence and notify owner",
    triggerType: "funnel_submission",
    nodes: [
      { nodeType: "trigger", actionType: "funnel_submission", label: "Funnel Form Submitted", positionX: 100, positionY: 50 },
      { nodeType: "action", actionType: "add_to_email_sequence", label: "Add to Nurture Sequence", positionX: 100, positionY: 180 },
      { nodeType: "action", actionType: "notify_owner", label: "Notify Owner", positionX: 100, positionY: 310 },
    ],
  },
  {
    id: "deal_won_celebration",
    name: "Deal Won — Onboarding Kickoff",
    description: "When a deal moves to Closed, create onboarding tasks and send welcome email",
    triggerType: "deal_stage_changed",
    nodes: [
      { nodeType: "trigger", actionType: "deal_stage_changed", label: "Deal Moved to Closed", positionX: 100, positionY: 50, config: { stage: "Closed" } },
      { nodeType: "action", actionType: "send_email", label: "Send Welcome Email", positionX: 100, positionY: 180 },
      { nodeType: "action", actionType: "create_task", label: "Create Onboarding Tasks", positionX: 100, positionY: 310 },
      { nodeType: "action", actionType: "create_invoice", label: "Create First Invoice", positionX: 100, positionY: 440 },
    ],
  },
];

// ─── Router ───────────────────────────────────────────────────────────────────
export const automationsRouter = router({
  // Meta
  getTriggerTypes: protectedProcedure.query(() => TRIGGER_TYPES),
  getActionTypes: protectedProcedure.query(() => ACTION_TYPES),
  getTemplates: protectedProcedure.query(() => WORKFLOW_TEMPLATES),

  // Workflow CRUD
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    return db
      .select()
      .from(workflows)
      .where(eq(workflows.userId, ctx.user.id))
      .orderBy(desc(workflows.updatedAt));
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const rows = await db
        .select()
        .from(workflows)
        .where(and(eq(workflows.id, input.id), eq(workflows.userId, ctx.user.id)));
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND" });
      return rows[0];
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        triggerType: z.string().min(1),
        triggerConfig: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(workflows).values({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        triggerType: input.triggerType,
        triggerConfig: input.triggerConfig,
        status: "draft",
      });
      return { id: result.insertId };
    }),

  createFromTemplate: protectedProcedure
    .input(z.object({ templateId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const template = WORKFLOW_TEMPLATES.find((t) => t.id === input.templateId);
      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });

      const db = (await getDb())!;
      const [result] = await db.insert(workflows).values({
        userId: ctx.user.id,
        name: template.name,
        description: template.description,
        triggerType: template.triggerType,
        status: "draft",
      });

      const workflowId = result.insertId as number;

      // Insert nodes
      for (const node of template.nodes) {
        await db.insert(workflowNodes).values({
          workflowId,
          nodeType: node.nodeType as "trigger" | "action" | "condition" | "delay",
          actionType: node.actionType,
          label: node.label,
          positionX: node.positionX,
          positionY: node.positionY,
          config: (node as { config?: Record<string, unknown> }).config,
        });
      }

      return { id: workflowId };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        triggerType: z.string().optional(),
        triggerConfig: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const { id, ...rest } = input;
      await db
        .update(workflows)
        .set(rest)
        .where(and(eq(workflows.id, id), eq(workflows.userId, ctx.user.id)));
      return { success: true };
    }),

  setStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["active", "paused", "draft"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db
        .update(workflows)
        .set({ status: input.status })
        .where(and(eq(workflows.id, input.id), eq(workflows.userId, ctx.user.id)));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db
        .delete(workflowNodes)
        .where(eq(workflowNodes.workflowId, input.id));
      await db
        .delete(workflows)
        .where(and(eq(workflows.id, input.id), eq(workflows.userId, ctx.user.id)));
      return { success: true };
    }),

  // Nodes
  getNodes: protectedProcedure
    .input(z.object({ workflowId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      // Verify ownership
      const wf = await db
        .select()
        .from(workflows)
        .where(and(eq(workflows.id, input.workflowId), eq(workflows.userId, ctx.user.id)));
      if (!wf[0]) throw new TRPCError({ code: "NOT_FOUND" });

      return db
        .select()
        .from(workflowNodes)
        .where(eq(workflowNodes.workflowId, input.workflowId))
        .orderBy(workflowNodes.positionY);
    }),

  saveNodes: protectedProcedure
    .input(
      z.object({
        workflowId: z.number(),
        nodes: z.array(
          z.object({
            nodeType: z.enum(["trigger", "action", "condition", "delay"]),
            actionType: z.string().optional(),
            label: z.string().optional(),
            config: z.record(z.string(), z.unknown()).optional(),
            positionX: z.number().optional().default(0),
            positionY: z.number().optional().default(0),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      // Verify ownership
      const wf = await db
        .select()
        .from(workflows)
        .where(and(eq(workflows.id, input.workflowId), eq(workflows.userId, ctx.user.id)));
      if (!wf[0]) throw new TRPCError({ code: "NOT_FOUND" });

      // Replace all nodes
      await db.delete(workflowNodes).where(eq(workflowNodes.workflowId, input.workflowId));
      for (const node of input.nodes) {
        await db.insert(workflowNodes).values({
          workflowId: input.workflowId,
          ...node,
        });
      }
      return { success: true };
    }),

  // Executions
  triggerManual: protectedProcedure
    .input(z.object({ workflowId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const wf = await db
        .select()
        .from(workflows)
        .where(and(eq(workflows.id, input.workflowId), eq(workflows.userId, ctx.user.id)));
      if (!wf[0]) throw new TRPCError({ code: "NOT_FOUND" });

      // Create execution record
      const [result] = await db.insert(workflowExecutions).values({
        workflowId: input.workflowId,
        userId: ctx.user.id,
        status: "completed", // Simulated — real execution would be async
        triggerData: { triggeredBy: "manual", triggeredAt: new Date().toISOString() },
        completedAt: new Date(),
      });

      // Log the execution
      await db.insert(workflowExecutionLogs).values({
        executionId: result.insertId as number,
        actionType: "manual_trigger",
        result: "success",
        details: { message: "Manual trigger executed successfully" },
      });

      // Update workflow stats
      await db
        .update(workflows)
        .set({
          executionCount: (wf[0].executionCount ?? 0) + 1,
          successCount: (wf[0].successCount ?? 0) + 1,
          lastExecutedAt: new Date(),
        })
        .where(eq(workflows.id, input.workflowId));

      return { executionId: result.insertId };
    }),

  listExecutions: protectedProcedure
    .input(z.object({ workflowId: z.number(), limit: z.number().optional().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const wf = await db
        .select()
        .from(workflows)
        .where(and(eq(workflows.id, input.workflowId), eq(workflows.userId, ctx.user.id)));
      if (!wf[0]) throw new TRPCError({ code: "NOT_FOUND" });

      return db
        .select()
        .from(workflowExecutions)
        .where(eq(workflowExecutions.workflowId, input.workflowId))
        .orderBy(desc(workflowExecutions.startedAt))
        .limit(input.limit);
    }),

  getExecutionLogs: protectedProcedure
    .input(z.object({ executionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      return db
        .select()
        .from(workflowExecutionLogs)
        .where(eq(workflowExecutionLogs.executionId, input.executionId))
        .orderBy(workflowExecutionLogs.executedAt);
    }),
});
