# LeadFlow AI

An AI-assisted CRM that qualifies inbound leads, scores and prioritizes opportunities, generates personalized email drafts, tracks responses, recommends follow-ups, and exports the pipeline to Excel.

> **Portfolio Project for Northstar Studio**
> *Northstar Studio and all lead data used in this project are fictional.*

---

## Overview

Small digital marketing agencies frequently lose high-value deals due to slow intake, inconsistent lead qualification, and delayed follow-ups. Inquiries arrive through disparate channels with varying levels of detail—from comprehensive budget specifications to vague one-line emails.

**LeadFlow AI** solves this by combining natural language processing with deterministic business logic:
1. **Intake & Signal Extraction:** Ingests structured form submissions or unformatted raw prospect emails using Google Gemini to extract key parameters (service, budget, currency, timeline, intent, requirements).
2. **Objective Qualification & Scoring:** Evaluates inquiries against a transparent 100-point agency rubric to assign objective qualification tiers (High, Medium, Low).
3. **Operational Prioritization:** Categorizes opportunities into actionable operational queues (🔴 Act Today, 🟢 Replied / Needs Review, 🟡 Review & Scope, ⚪ Low / Dormant).
4. **Assisted Communication:** Crafts tailored, plain-text response drafts referencing specific client deliverables and timelines for human review and approval.
5. **Email Client Handoff:** Hands approved drafts directly to the user's default email client (`mailto:`) or clipboard.
6. **Follow-Up Intelligence:** Tracks response states manually and calculates business-day follow-up schedules.
7. **CRM Data Export:** Produces multi-sheet Excel workbooks (`.xlsx`) capturing leads, follow-up logs, and pipeline summaries.

---

## Workflow Architecture

```text
Inbound Inquiry (Form / Paste Email)
               │
               ▼
   Supabase PostgreSQL Storage
               │
               ▼
      Google Gemini API
  (Structured Parameter Extraction)
               │
               ▼
Deterministic Scoring Engine (0–100)
               │
               ▼
  Operational Priority Assignment
  (Act Today / Scope / Dormant / Replied)
               │
               ▼
   AI Email Draft Generation
               │
               ▼
  Human Review, Edit & Approval
               │
               ▼
 Email Client Handoff (mailto:)
               │
               ▼
   Manual Response Tracking
   (Waiting / Replied / No Response)
               │
               ▼
Deterministic Follow-Up Scheduling
   (+2 / +4 Business Day Cadence)
               │
               ▼
    Multi-Sheet Excel Export
```

---

## Key Features

### 1. Lead Intelligence & Flexible Intake
- **Structured Intake Form (Mode A):** Standard form capturing contact info, service type, budget, currency, timeline, and project description.
- **Unformatted Email Extraction (Mode B):** Paste raw incoming prospect emails. Gemini parses sender details, company name, scope, budget figures (e.g., "$8k", "around 10,000 EUR"), natural-language timelines (e.g., "November 15", "Before holiday launch"), intent, and specific deliverables into an interactive review form before saving.
- **Normalization Engine:** Deterministically normalizes services into five core agency categories (*Website Development*, *Branding & Design*, *Social Media*, *Digital Advertising*, *Other*) and maps currencies (*USD, EUR, GBP, CAD, AUD*).

### 2. Qualification & Scoring Model
The system uses a deterministic, rule-based 100-point scoring algorithm rather than relying on ungrounded AI scores.

| Factor | Max Points | Evaluation Logic |
|---|---|---|
| **Clear Service Requirement** | 25 | Explicit, recognized service category identified |
| **Budget Provided** | 20 | Numeric budget figure specified |
| **Realistic Budget** | 15 | Budget meets configured agency minimums for the service |
| **Clear Timeline** | 15 | Specific timeframe or deadline stated |
| **Strong Buying Intent** | 15 | Purchase-ready language, active RFP, or request for next steps |
| **Business / Company Identified** | 5 | Verifiable company or brand name |
| **Specific Requirements** | 5 | Concrete technical features or deliverables requested |
| **Total Possible** | **100** | |

#### Qualification Thresholds
- **HIGH (80–100 points):** Strong buying intent, verified budget, clear scope, and defined timeline.
- **MEDIUM (50–79 points):** Qualified opportunity requiring scope or budget clarification.
- **LOW (0–49 points):** Exploratory inquiry, unstated budget, or undefined scope.

> [!NOTE]
> **Configurable Heuristics:** The "Realistic Budget" factor evaluates budgets against baseline agency ranges (e.g., Website Development: $2,500–$150,000; Branding: $1,500–$60,000). These thresholds reflect typical agency baselines and can be tailored per agency.

### 3. Operational Priority Matrix
Leads are categorized into operational action buckets:
- **🔴 A — Act Today:** High-qualification leads awaiting initial outreach approval OR active leads with follow-ups due today.
- **🟢 Replied (Needs Review):** Prospects who replied to outreach; automated follow-up recommendations are paused for sales conversation.
- **🟡 B — Review & Scope:** Medium-tier inquiries or leads with missing information requiring scope definition.
- **⚪ C — Low / Dormant:** Low-score inquiries or leads where follow-up sequences have concluded.

### 4. Human-in-the-Loop Communication
- **AI Initial Reply Drafts:** Generates personalized plain-text responses addressing the prospect's exact requirements without hallucinated promises or robotic phrasing.
- **Inline Editing & Approval:** Agency staff can review, edit subject/body in real time, and explicitly mark drafts as `APPROVED`.
- **Email Client Handoff:** Clicking **"Open Email Composer"** triggers a `mailto:` link pre-populating recipient, subject line, and the approved body in the user's default desktop or web email client. A **"Copy Email"** fallback is provided for manual pasting.
- **Safety Boundary:** LeadFlow AI does **not** send emails autonomously. Email delivery occurs through the user's authorized email client.

### 5. Follow-Up Intelligence
Tracks conversation progress through manual response logging:
- **`Waiting for Response`:** Outreach completed; waiting for prospect response.
- **`Replied`:** Prospect responded; follow-ups are automatically paused (`PAUSED_REPLIED`).
- **`No Response`:** Triggers deterministic business-day follow-up recommendations:
  - **Follow-Up #1:** Recommended after **2 business days** (skipping weekends).
  - **Follow-Up #2:** Recommended after **4 business days** (skipping weekends).
  - **Sequence End:** After Follow-Up #2 with no response, recommendations stop (`STOPPED_MAX`) and the lead transitions to dormant.
- **Follow-Up Drafts:** Generates concise, stage-appropriate follow-up email drafts for human approval before handoff.

### 6. Multi-Sheet Excel CRM Export
Generates zero-dependency `.xlsx` workbooks directly in-memory:
- **Dual Export Scope:**
  - **Export All Leads:** Full database snapshot (`LeadFlow_CRM_YYYY-MM-DD.xlsx`).
  - **Export Current View:** Filtered subset based on active inbox filters and search query (`LeadFlow_CRM_View_YYYY-MM-DD.xlsx`).
- **Workbook Structure:**
  1. **`CRM Leads` Sheet:** 20 data columns (contact details, qualification score, priority tier, response status, follow-up schedule, timestamps, AI summary, recommended action), styled column widths, frozen header row, and AutoFilters.
  2. **`Follow-Ups` Sheet:** Complete chronological log of scheduled and completed follow-ups.
  3. **`Summary` Sheet:** Pipeline KPI overview including total lead volume, pipeline value, priority breakdown, and response status counts.

---

## Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) | Full-stack React 19 framework with server routes and SSR |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | Strict type checking across API, database, and UI |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/) | Modern utility-first interface design |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) | Cloud relational database with Row Level Security (RLS) |
| **AI Integration** | [Google Gen AI SDK](https://github.com/google-gemini/gemini-js) (`@google/genai`) | Structured output extraction and contextual drafting |
| **Spreadsheet Engine** | [XLSX (SheetJS)](https://sheetjs.com/) | Binary Excel workbook generation |
| **Validation** | [Zod 4](https://zod.dev/) | Runtime request schema validation |

---

## Database Architecture

### `leads` Table
Stores contact information, qualification results, heuristic scoring, and response tracking state.
- `id` (UUID, Primary Key)
- `name`, `email`, `company`, `message`, `source` (`'form'` | `'email'`), `service`, `budget`, `currency`, `timeline`
- `ai_score` (Integer, 0–100), `qualification` (`HIGH` | `MEDIUM` | `LOW`), `intent`, `urgency`, `ai_summary`, `ai_reasoning`, `missing_information`, `recommended_action`
- `status` (`NEW` | `AI_ANALYZED` | `AI_ANALYSIS_FAILED` | `PENDING_APPROVAL` | `APPROVED` | `CONTACTED` | `CLOSED`)
- `response_status` (`waiting` | `replied` | `no_response`)
- `last_contacted_at`, `next_follow_up_at` (Timestamps)
- `follow_up_count` (Integer)
- `created_at`, `updated_at`

### `communications` Table
Stores AI-generated drafts, editing history, and approval records.
- `id` (UUID, Primary Key)
- `lead_id` (UUID, Foreign Key $\rightarrow$ `leads.id` ON DELETE CASCADE)
- `type` (`'initial_reply'` | `'follow_up_1'` | `'follow_up_2'`)
- `subject`, `body` (Text)
- `status` (`DRAFT` | `APPROVED` | `REJECTED` | `SENT`)
- `created_at`, `updated_at`, `approved_at`, `sent_at` (Timestamps)

### `follow_ups` Table
Tracks scheduled and completed follow-up events.
- `id` (UUID, Primary Key)
- `lead_id` (UUID, Foreign Key $\rightarrow$ `leads.id` ON DELETE CASCADE)
- `follow_up_number` (Integer: 1, 2)
- `scheduled_for` (Timestamp)
- `status` (`SCHEDULED` | `COMPLETED` | `CANCELLED` | `SKIPPED`)
- `reason` (Text)
- `created_at`, `completed_at` (Timestamps)

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/leads` | Creates a new lead in Supabase (`status: NEW`). |
| `GET` | `/api/leads` | Lists leads with search query, filters (tier, status, response, source, service), and sorting. |
| `GET` | `/api/leads/[id]` | Retrieves a single lead with communications history and follow-up recommendation. |
| `PATCH` | `/api/leads/[id]/response` | Updates response status (`waiting`, `replied`, `no_response`) & recalculates follow-up timing. |
| `POST` | `/api/leads/extract-email` | Extracts structured lead fields from raw pasted email text using Gemini. |
| `POST` | `/api/leads/[id]/analyze` | Runs Gemini analysis & executes deterministic scoring. |
| `POST` | `/api/leads/[id]/draft` | Generates initial email reply draft. |
| `GET` | `/api/leads/[id]/draft` | Fetches the initial communication draft for a lead. |
| `POST` | `/api/leads/[id]/followup-draft` | Generates follow-up draft (`follow_up_1` or `follow_up_2`). |
| `GET` | `/api/leads/[id]/followup-draft` | Fetches follow-up communication drafts for a lead. |
| `GET` | `/api/drafts` | Lists communication drafts joined with lead metadata. |
| `PATCH` | `/api/communications/[id]` | Saves edits to draft subject and body. |
| `POST` | `/api/communications/[id]/approve` | Approves draft (`status: APPROVED`, sets `approved_at`). |
| `GET` | `/api/export/crm` | Generates and downloads multi-sheet `.xlsx` workbook (`scope=all` or `scope=view`). |

---

## Security & Data Integrity

- **Server-Side API Key Isolation:** `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are executed exclusively within server route handlers and are never exposed to browser bundles.
- **Row Level Security (RLS):** Supabase tables enforce RLS policies. Direct browser operations use the public anonymous client, while privileged state transitions occur via protected server routes.
- **Input Sanitization:** All inbound payloads are validated using Zod schemas before database insertion or AI processing.
- **No Secret Leakage:** Environment secrets are managed via `.env.local` (gitignored), with template references provided in `.env.example`.

---

## Testing & Verification

The repository includes automated verification suites for critical business logic:

```bash
# 1. Verify deterministic follow-up scheduling & business-day calculation
node scripts/test-followups.mjs

# 2. Verify multi-sheet Excel generation, schema, and calculations
node scripts/test-excel-export.mjs

# 3. Static type checking
npm run typecheck

# 4. Code quality & linting
npm run lint

# 5. Production build compilation
npm run build
```

---

## Getting Started Locally

### 1. Prerequisites
- Node.js 18.18+ or 20+
- Supabase project (PostgreSQL)
- Google Gemini API key

### 2. Environment Configuration
Create a `.env.local` file modeled after `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.1-flash-lite
```

### 3. Database Setup
Apply migrations located in `supabase/migrations/` in sequential order via the Supabase SQL Editor or CLI:
1. `20261005000000_create_leads_table.sql`
2. `20261005000001_create_communications_table.sql`
3. `20261006000000_add_response_and_follow_ups.sql`

### 4. Run Development Server

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to interact with the application.

---

## Project Status

LeadFlow AI is a completed portfolio project with persistent Supabase storage and a full lead qualification, operational prioritization, AI drafting, response tracking, follow-up scheduling, and Excel export workflow.

All demo lead records represent **Northstar Studio** (a fictional agency) and contain fictional sample data.

---

## Roadmap

Planned future enhancements:
1. **Email Provider Integration:** Direct outbound delivery via transactional email providers (e.g., Resend, SendGrid) with DKIM/SPF domain verification.
2. **Inbound Reply Detection:** Webhook listeners for automated response detection and automatic reply-thread parsing.
3. **Automated CRM Sync:** Bi-directional synchronization with external CRM platforms (HubSpot, Salesforce).
4. **Pipeline Analytics:** Advanced reporting dashboards for conversion velocity, win rates, and service demand analytics.
