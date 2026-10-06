# LeadFlow AI 🚀

An AI-powered lead qualification and human-in-the-loop sales follow-up system built for small American digital marketing agencies.

> **Architecture:** Complete implementation of: `Flexible Lead Intake (Structured Form & Paste Email)` → `Supabase Database` → `Google Gemini AI Qualification` → `Deterministic Heuristic Scoring` → `Operational Priority Matrix` → `AI Email Reply Draft` → `Human Review & Edit` → `Human Approval` → `mailto: Email Composer Handoff` → `Manual Response Tracking` → `Deterministic Follow-Up Recommendations` → `Human-Approved Follow-Up Drafts`.

---

## 📖 Overview

**Northstar Studio** is a small American digital marketing agency offering:
- **Website Development**
- **Branding & Design**
- **Social Media Management**
- **Digital Advertising & PPC**

LeadFlow AI orchestrates the entire inbound sales pipeline with complete human oversight:
1. **Flexible Intake:** Ingests inquiries through a clean structured form (Mode A) or raw unformatted email paste with instant Gemini field extraction and interactive review (Mode B).
2. **Secure Persistence:** Persists leads securely in **Supabase PostgreSQL** with strict Row Level Security.
3. **AI Signal Extraction:** Sends inquiries to **Google Gemini API** (`@google/genai` structured JSON schema) to extract key business signals, intent, and requirements.
4. **Deterministic Heuristic Scoring:** Deterministically evaluates signals using a transparent 100-point agency scoring engine across 7 objective factors.
5. **Operational Priority & Action Center:** Categorizes leads into actionable operational buckets: **🔴 Act / Follow Up Today**, **🟢 Needs Response Review (Replied)**, **🟡 Review & Scope**, and **⚪ Low / Dormant**.
6. **AI Email Draft Generation:** Crafts personalized, professional plain-text responses referencing the prospect's exact deliverables, timeline, and budget.
7. **Human-in-the-Loop Review:** Agency staff reviews, edits subject/body in real-time, and explicitly approves the draft (`DRAFT` $\rightarrow$ `APPROVED`).
8. **Email Client Handoff:** Click **"Open Email Composer"** to open the user's default email client (`mailto:`) with recipient, subject, and approved body pre-filled. A **"Copy Email"** fallback is provided for maximum compatibility.
9. **Manual Response Tracking:** Agency staff explicitly marks whether a prospect is `Waiting for Response`, has `Replied`, or resulted in `No Response`.
10. **Deterministic Follow-Up Intelligence:** Deterministically calculates business-day follow-up schedules (skipping weekends) and generates contextual follow-up drafts for human approval.

> [!NOTE]
> **Portfolio Transparency:** LeadFlow uses AI for natural language analysis and draft composition. All business-state transitions (scoring, priority tiering, follow-up timing, and response tracking) are handled deterministically or by direct human action. Automated inbox monitoring and automated background email sending are intentionally excluded.

---

## 🔁 Lead & Follow-Up Operational Lifecycle

```text
Lead Submitted / Pasted
         ↓
Gemini AI Analysis
         ↓
Deterministic Scoring (0–100) & Priority Tiering
         ↓
AI Initial Reply Draft Generated
         ↓
Human Review, Edit & Approval
         ↓
Open in Email Composer (mailto:)
         ↓
Waiting for Response (Manual Tracking)
         ├─────────────────────────────────────────┐
         ↓                                         ↓
   Mark as Replied                         Mark as No Response
         ↓                                         ↓
  Follow-ups Paused                         Follow-Up #1 Recommended (2 Business Days)
         ↓                                         ↓
Human Conversation Review                   AI Draft → Human Approval → Compose
                                                   ↓
                                           Waiting for Response
                                                   ├─────────────────────────┐
                                                   ↓                         ↓
                                             Mark as Replied         Mark as No Response
                                                   ↓                         ↓
                                            Follow-ups Paused         Follow-Up #2 Recommended (4 Business Days)
                                                                             ↓
                                                                      AI Draft → Human Approval → Compose
                                                                             ↓
                                                                      Sequence Stopped / Dormant
```

---

## 🎯 Deterministic Follow-Up Rules

| Stage | Trigger | Timing Rule | Status | Next Action |
|---|---|---|---|---|
| **Replied** | Prospect replies | N/A | `PAUSED_REPLIED` | Follow-ups paused; prioritize for sales conversation |
| **Pending Initial** | Draft not yet approved | N/A | `PENDING_INITIAL` | Review and approve initial email draft |
| **Follow-Up #1** | No response after initial email | +2 Business Days (skips weekends) | `DUE` / `UPCOMING` | Brief check-in referencing scope & timeline |
| **Follow-Up #2** | No response after Follow-up #1 | +4 Business Days (skips weekends) | `DUE` / `UPCOMING` | Final check-in to close the loop |
| **Sequence End** | No response after Follow-up #2 | N/A | `STOPPED_MAX` | Automated recommendations stop; mark Dormant |

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 15/16 (App Router)](https://nextjs.org/) + React 19
- **Language:** TypeScript 5 (strict typing)
- **Styling:** Tailwind CSS + Lucide Icons
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security)
- **AI Engine:** Google Gemini (`@google/genai` SDK with Structured Outputs & Model Fallbacks)
- **Email Handoff:** Human-approved `mailto:` email composer handoff + clipboard fallback
- **Validation:** Zod 3

---

## 🗄️ Database Architecture

### `leads` Table
Stores contact information, inquiry message, qualification results, and response state.
- `id` (UUID, Primary Key)
- `name`, `email`, `company`, `message`, `source` (`'form'` | `'email'`), `service`, `budget`, `currency`, `timeline`
- `ai_score` (0–100), `qualification` (`HIGH` | `MEDIUM` | `LOW`), `intent`, `urgency`, `ai_summary`, `ai_reasoning`, `missing_information`, `recommended_action`
- `status` (`NEW` | `AI_ANALYZED` | `AI_ANALYSIS_FAILED` | `PENDING_APPROVAL` | `APPROVED` | `CONTACTED` | `CLOSED`)
- `response_status` (`waiting` | `replied` | `no_response`)
- `last_contacted_at`, `next_follow_up_at` (Timestamps)
- `follow_up_count` (Integer)
- `created_at`, `updated_at`

### `communications` Table
Stores AI-generated drafts, human editing history, and approval records.
- `id` (UUID, Primary Key)
- `lead_id` (UUID, Foreign Key $\rightarrow$ `leads.id` ON DELETE CASCADE)
- `type` (`'initial_reply'` | `'follow_up_1'` | `'follow_up_2'`)
- `subject` (Text)
- `body` (Text)
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

## 🔌 API Routes

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/leads` | Ingests a new lead into Supabase (`status: NEW`). |
| `GET` | `/api/leads` | Lists leads with search, filters (tier, status, response, source, service), and sorting. |
| `GET` | `/api/leads/[id]` | Retrieves single lead with full communications history and follow-up recommendation. |
| `PATCH` | `/api/leads/[id]/response` | Manually updates response status (`waiting`, `replied`, `no_response`) & recalculates follow-ups. |
| `POST` | `/api/leads/extract-email` | Extracts structured lead fields from raw pasted email using Gemini. |
| `POST` | `/api/leads/[id]/analyze` | Triggers Gemini AI qualification & deterministic scoring. |
| `POST` | `/api/leads/[id]/draft` | Generates or regenerates an initial email reply draft. |
| `GET` | `/api/leads/[id]/draft` | Fetches the initial communication draft for a lead. |
| `POST` | `/api/leads/[id]/followup-draft` | Generates a concise follow-up email draft (`follow_up_1` or `follow_up_2`). |
| `GET` | `/api/leads/[id]/followup-draft` | Fetches follow-up communication drafts for a lead. |
| `GET` | `/api/drafts` | Lists all communication drafts joined with lead metadata for Drafts view. |
| `PATCH` | `/api/communications/[id]` | Saves manual human edits to a draft's subject and body. |
| `POST` | `/api/communications/[id]/approve` | Approves email draft (`status: APPROVED`, records `approved_at`). |

---

## 🚀 Getting Started

### 1. Configure Environment

Create `.env.local` based on `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.1-flash-lite
```

### 2. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000`.
