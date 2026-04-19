import { z } from "zod";

// Lead Intelligence
export const leadInputSchema = z.object({
  input: z.string().min(1, "Please enter a URL, email, or description").max(2000, "Input too long"),
});

// Pipeline
export const createDealSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  stage: z.enum(["Discovery", "Analysis", "Strategy", "Proposal", "Closed"]).optional(),
  value: z.number().min(0, "Value must be positive").optional(),
  notes: z.string().max(2000).optional(),
});

// Vault
export const createVaultItemSchema = z.object({
  title: z.string().min(1, "Title is required").max(300, "Title too long"),
  type: z.enum(["framework", "case_study", "voice_note", "template", "research", "note"]),
  textContent: z.string().min(1, "Content is required").max(50000, "Content too long").optional(),
});

// Tasks
export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(300, "Title too long"),
  description: z.string().max(2000).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

// Strategy
export const generateStrategySchema = z.object({
  clientName: z.string().min(1, "Client name is required").max(200),
  company: z.string().min(1, "Company is required").max(200),
  outputType: z.enum(["full", "quick", "deck", "email"]),
  dealId: z.number().optional(),
});

// Settings / Profile
export const profileSchema = z.object({
  companyName: z.string().max(200, "Company name too long").optional(),
  timezone: z.string().max(100).optional(),
});
