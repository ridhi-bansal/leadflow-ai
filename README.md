# LeadFlow AI 🚀

An AI-powered lead qualification and human-in-the-loop sales follow-up system built for small American digital marketing agencies.

> **Architecture:** Complete implementation of: `Flexible Lead Intake (Structured Form & Paste Email)` → `Supabase Database` → `Google Gemini AI Qualification` → `Deterministic Heuristic Scoring` → `Priority Matrix (A/B/C)` → `AI Email Reply Draft` → `Human Review & Edit` → `Human Approval` → `Human-in-the-Loop mailto: Email Composer Handoff` → `Copy Email Fallback`.

---

## 📖 Overview

**Northstar Studio** is a small American digital marketing agency offering:
- **Website Development**
- **Branding & Design**
- **Social Media Management**
- **Digital Advertising & PPC**

LeadFlow AI automates the lead analysis, reply drafting, and delivery workflow:
1. **Flexible Intake:** Ingests inquiries through a clean structured form (Mode A) or raw unformatted email paste with instant Gemini field extraction and interactive review (Mode B).
2. **Secure Persistence:** Persists leads securely in **Supabase PostgreSQL** with strict Row Level Security.
3. **AI Signal Extraction:** Sends inquiries to **Google Gemini API** (`@google/genai` structured JSON schema) to extract key business signals, intent, and requirements.
4. **Deterministic Heuristic Scoring:** Deterministically evaluates signals using a transparent 100-point agency scoring engine across 7 objective factors.
5. **Priority Action Matrix:** Categorizes leads into actionable tiers: **A — Respond Now**, **B — Review & Scope**, and **C — Low / Exploratory**.
6. **AI Email Draft Generation:** Crafts a personalized, professional plain-text response referencing the prospect's exact deliverables, timeline, and budget.
7. **Human-in-the-Loop Review:** Agency staff reviews, edits subject/body in real-time, and explicitly approves the draft (`DRAFT` $\rightarrow$ `APPROVED`).
8. **Email Client Handoff:** Click **"Open Email Composer"** to open the user's default email client (`mailto:`) with recipient, subject, and approved body pre-filled. LeadFlow AI does not falsely claim automated delivery; the user reviews and clicks Send manually. A **"Copy Email"** fallback is provided for maximum compatibility.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 15/16 (App Router)](https://nextjs.org/) + React 19
- **Language:** TypeScript 5 (strict typing)
- **Styling:** Tailwind CSS + Lucide Icons
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security)
- **AI Engine:** Google Gemini (`@google/genai` SDK with Structured Outputs & Resilient Fallback)
- **Email Handoff:** Human-approved `mailto:` email composer handoff + clipboard fallback
- **Validation:** Zod 3

---

## 🗄️ Database Architecture

### `leads` Table
Stores contact information, inquiry message, and qualification results.
- `id` (UUID, Primary Key)
- `name`, `email`, `company`, `message`, `source` (`'form'` | `'email'`), `service`, `budget`, `currency`, `timeline`
- `ai_score` (0–100), `qualification` (`HIGH` | `MEDIUM` | `LOW`), `intent`, `urgency`, `ai_summary`, `ai_reasoning`, `missing_information`, `recommended_action`
- `status` (`NEW` | `AI_ANALYZED` | `AI_ANALYSIS_FAILED` | `PENDING_APPROVAL` | `APPROVED`)
- `created_at`, `updated_at`

### `communications` Table
Stores AI-generated drafts, human editing history, and approval timestamps.
- `id` (UUID, Primary Key)
- `lead_id` (UUID, Foreign Key $\rightarrow$ `leads.id` ON DELETE CASCADE)
- `type` (e.g. `'initial_reply'`)
- `subject` (Text)
- `body` (Text)
- `status` (`DRAFT` | `APPROVED` | `REJECTED` | `SENT`)
- `created_at`, `updated_at`, `approved_at`, `sent_at` (Timestamps)
- `gmail_message_id` (Text, optional historical field)

---

## 🔌 API Routes

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/leads` | Ingests a new lead into Supabase (`status: NEW`). |
| `GET` | `/api/leads` | Lists leads with keyword search (`q`), tier/status/source/service filters, and sorting. |
| `GET` | `/api/leads/[id]` | Server-side retrieval of a specific lead record. |
| `POST` | `/api/leads/extract-email` | Extracts structured lead fields from raw pasted email using Gemini. |
| `POST` | `/api/leads/[id]/analyze` | Triggers Gemini AI qualification & deterministic scoring (`status: AI_ANALYZED`). |
| `POST` | `/api/leads/[id]/draft` | Generates or regenerates a personalized email draft (`status: PENDING_APPROVAL`). |
| `GET` | `/api/leads/[id]/draft` | Fetches the communication draft for a lead. |
| `GET` | `/api/drafts` | Lists all communication drafts joined with lead metadata for Drafts view. |
| `PATCH` | `/api/communications/[id]` | Saves manual human edits to a draft's subject and body. |
| `POST` | `/api/communications/[id]/approve` | Approves email draft (`status: APPROVED`, records `approved_at`). |

---

## 🎯 Deterministic Scoring System (Max 100)

| Factor | Points | Evaluation Heuristic |
|---|---|---|
| **Clear Service Requirement** | `+25` | Service explicitly chosen or extracted from inquiry |
| **Budget Provided** | `+20` | Numeric budget specified in form or message |
| **Realistic Budget** | `+15` | Budget meets configurable threshold for service (e.g. Website Development ≥ $2,500) |
| **Clear Timeline** | `+15` | Timeframe stated (e.g. "Within 1 month", "November 15", "ASAP") |
| **Strong Buying Intent** | `+15` | High purchase signal / ready-to-hire intent detected |
| **Business / Company Identified** | `+5` | Legitimate business/brand identified |
| **Specific Requirements** | `+5` | Clear deliverables / feature specifications listed |
| **Total** | `100` | **Tiers:** `80–100 HIGH` \| `50–79 MEDIUM` \| `0–49 LOW` |

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/ridhi-bansal/leadflow-ai.git
cd leadflow-ai
npm install
```

### 2. Environment Variables

Create `.env.local` based on `.env.example`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Gemini API Configuration
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.8-flash
```

### 3. Database Migrations

Run the SQL migration scripts in your Supabase project SQL Editor:
1. `supabase/migrations/20261005000000_create_leads_table.sql`
2. `supabase/migrations/20261005000001_create_communications_table.sql`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🔒 Security & Privacy

- All Gemini API calls and Supabase admin operations run **strictly server-side**.
- No API keys or service role secrets are ever exposed to the client.
- RLS protects all tables; communication records are accessible only server-side via `SUPABASE_SERVICE_ROLE_KEY`.
- The human-in-the-loop email handoff generates client-side `mailto:` links directly from the approved database record, ensuring complete user visibility and manual control before sending.
