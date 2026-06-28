# Email Sequences & Resend Integration Setup

## Overview

This document outlines the complete email sequence system for Operator House, including the Soul Engineer AI services templates and Resend integration.

## Features Implemented

### 1. Soul Engineer AI Services Email Templates (5 Templates)

#### AI Services — Initial Outreach
- **Purpose**: First contact for AI consulting and automation services
- **Trigger**: Manual
- **Steps**: 1 email
- **Tone**: Personal, authentic, anti-salesy
- **Key Message**: "I help high-capacity leaders reclaim 10+ hours a week"

#### AI Services — 3-Touch Follow-Up
- **Purpose**: Gentle follow-up for prospects who didn't respond
- **Trigger**: Manual
- **Steps**: 3 emails (Day 0, Day 4, Day 7)
- **Tone**: Respectful, value-focused, human
- **Key Message**: Specific value proposition with real examples

#### AI Services — Value-Add Nurture
- **Purpose**: Provide ongoing value to warm prospects
- **Trigger**: Manual
- **Steps**: 2 emails (Day 0, Day 14)
- **Tone**: Educational, generous, no pitch
- **Key Message**: Sharing frameworks and insights freely

#### AI Services — Breakup / Last Chance
- **Purpose**: Final outreach to cold prospects
- **Trigger**: Deal stale (auto)
- **Steps**: 2 emails (Day 0, Day 30)
- **Tone**: Direct, respectful, seeking feedback
- **Key Message**: Clean close with option to reconnect

#### AI Services — Post-Strategy Proposal
- **Purpose**: Follow-up after delivering strategy/proposal
- **Trigger**: Manual
- **Steps**: 5 emails (Day 0, 3, 7, 14, 21)
- **Tone**: Professional, helpful, persistent but not pushy
- **Key Message**: Concrete next steps and addressing concerns

### 2. Pipeline Integration

Auto-enrollment when deals move stages:
- `pipeline_stage_change` trigger type
- Matches stage transitions to sequence triggers
- Automatically enrolls clients when they enter specific pipeline stages
- Integration added to `server/routers.ts` pipeline.update mutation

### 3. Scheduled Email Processing

Hourly cron job (`server/emailCron.ts`):
- Checks for emails due based on `delayDays` and `lastEmailSentAt`
- Respects `sendTimePreference` (morning/afternoon)
- Sends via Resend API
- Updates enrollment status (active → completed)
- Logs all sends to `emailSends` table

### 4. Test Endpoint

`emailSequences.testSend` mutation:
- Send test emails via Resend
- Three test types: plain text, HTML, Soul Engineer template
- Verifies Resend configuration and delivery

## Database Schema

### Tables

#### email_sequences
- `id`, `userId`, `name`, `description`
- `triggerType`: manual, pipeline_stage_change, deal_closed, deal_stale, scheduled
- `triggerConfig`: JSON configuration for triggers
- `status`: active, paused, draft
- `isBuiltIn`: boolean

#### email_sequence_steps
- `id`, `sequenceId`, `stepOrder`
- `delayDays`: Days to wait after previous step
- `subjectTemplate`: Email subject with {{variables}}
- `bodyTemplate`: Email body with {{variables}}
- `sendTimePreference`: morning, afternoon, best_time

#### email_sequence_enrollments
- `id`, `sequenceId`, `clientId`, `userId`
- `currentStep`: Index of next step to send
- `status`: active, completed, paused, unsubscribed
- `enrolledAt`, `lastEmailSentAt`

#### email_sends
- `id`, `enrollmentId`, `stepId`, `userId`
- `subject`, `body`, `toEmail`
- `resendId`: Resend message ID
- `status`: queued, sent, delivered, opened, clicked, replied, bounced, failed
- `sentAt`, `openedAt`, `clickedAt`

## Template Variables

Available in all templates:
- `{{clientName}}` - Client's name
- `{{senderName}}` - DeWayne Woods (or user's name)
- `{{clientEmail}}` - Client's email address
- `{{companyName}}` - Client's company name

Additional variables for proposal templates:
- `{{coreInsight}}` - Main strategic insight
- `{{benefit1}}`, `{{benefit2}}`, `{{benefit3}}` - Key benefits
- `{{timeline}}` - Project timeline
- `{{investment}}` - Cost/investment
- `{{forgottenDetail}}` - Additional point to mention

## Environment Variables

Required in `.env`:
```
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM="DeWayne Woods <dewayne@operatorhouse.click>"
PUBLIC_URL=https://app.operatorhouse.click
```

## Usage

### Creating a Sequence

1. Go to Email Sequences page
2. Click "New" or "Load Template"
3. Select a Soul Engineer template or create from scratch
4. Customize steps with your messaging
5. Set trigger type (manual or pipeline-based)
6. Activate the sequence

### Enrolling Clients

**Manual Enrollment:**
1. Select an active sequence
2. Go to "Enrolled" tab
3. Click "Enroll Client"
4. Select client from dropdown

**Auto-Enrollment:**
1. Set sequence trigger type to "Pipeline Stage Change"
2. Configure trigger config with target stage
3. When deals move to that stage, clients auto-enroll

### Testing Resend

1. Click the test tube icon in the header
2. Enter recipient email address
3. Select test type (text/HTML/template)
4. Click "Send Test"
5. Check recipient inbox for delivery

## Cron Jobs

Two cron jobs run via `server/emailCron.ts`:

1. **Daily at 8:00 AM UTC**: Onboarding emails (Templates 5-8)
2. **Hourly**: Process scheduled sequence emails

To start the cron jobs:
```javascript
import { startEmailCron } from './emailCron';
startEmailCron();
```

## API Endpoints (tRPC)

### Queries
- `emailSequences.list` - List all sequences
- `emailSequences.getWithSteps` - Get sequence with steps
- `emailSequences.listEnrollments` - List enrollments for a sequence
- `emailSequences.getSendHistory` - Get send history
- `emailSequences.getTemplates` - Get all built-in templates
- `emailSequences.getPendingEmails` - Get pending scheduled emails

### Mutations
- `emailSequences.create` - Create new sequence
- `emailSequences.update` - Update sequence
- `emailSequences.delete` - Delete sequence
- `emailSequences.addStep` - Add step to sequence
- `emailSequences.updateStep` - Update step
- `emailSequences.deleteStep` - Delete step
- `emailSequences.seedTemplate` - Load built-in template
- `emailSequences.enroll` - Enroll client in sequence
- `emailSequences.unenroll` - Unenroll client
- `emailSequences.sendNextStep` - Send next email for enrollment
- `emailSequences.testSend` - Send test email
- `emailSequences.autoEnrollOnPipelineChange` - Auto-enroll on stage change
- `emailSequences.processScheduledSends` - Process all pending emails

## Files Modified/Created

1. `server/routers/emailSequences.ts` - Main router with Soul Engineer templates
2. `server/routers.ts` - Added pipeline stage change trigger
3. `server/emailCron.ts` - Added scheduled sequence processing
4. `client/src/pages/EmailSequences.tsx` - Updated UI with Soul Engineer templates and test dialog

## Testing Checklist

- [ ] Resend API key configured in environment
- [ ] Send test email via UI (test tube icon)
- [ ] Create sequence from Soul Engineer template
- [ ] Enroll test client manually
- [ ] Send next step email manually
- [ ] Verify email appears in send history
- [ ] Move deal to trigger stage (if using pipeline triggers)
- [ ] Verify auto-enrollment works
- [ ] Check cron job processes scheduled emails

## Anti-Patterns Avoided

1. **No generic AI language** - Templates use DeWayne's authentic voice
2. **No contrastive "not X, it's Y" structures** - Direct statements only
3. **No buzzwords** - No "leverage", "synergy", "seamless", etc.
4. **No fake urgency** - No "limited time" or "act now" language
5. **No robotic formatting** - Natural paragraph flow, not AI-style bullets
6. **Personal sign-off** - Every email from DeWayne Woods, not "The Team"

## Voice Guidelines

- Authentic and witty
- Forward-thinking but grounded
- Empathetic and emotionally intelligent
- Disciplined and practical language
- Specific, real-world examples
- Progressive unfolding rather than contrast declarations
