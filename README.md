# LeadFlow AI 🚀

An AI-powered lead qualification and follow-up system built for small American digital marketing agencies.

> **Current Status: Milestone 2 (AI-Generated Email Draft & Human Approval)**  
> Complete implementation of: `Lead Intake Form` → `Supabase Database` → `Google Gemini AI Qualification` → `Deterministic Scoring` → `AI Email Reply Draft` → `Human Review & Edit` → `Explicit Human Approval`.

---

## 📖 Overview

**Northstar Studio** is a small American digital marketing agency offering:
- **Website Development**
- **Branding & Design**
- **Social Media Management**
- **Digital Advertising & PPC**

LeadFlow AI automates the lead analysis and sales reply drafting pipeline:
1. Ingests inquiries through a clean US-market-tailored lead intake form.
2. Persists leads securely in **Supabase PostgreSQL** with strict Row Level Security.
3. Sends inquiries to **Google Gemini API** (`@google/genai` structured JSON schema) to extract key business signals.
4. Deterministically evaluates signals using a 100-point agency heuristic scoring engine.
5. Generates a personalized initial reply draft tailored to the lead's exact scope, budget, and timeline.
6. **Human-in-the-Loop:** Agency staff reviews, edits subject/body in real-time, and explicitly approves the draft (`DRAFT` $\rightarrow$ `APPROVED`).

> ⚠️ **Note:** Email sending (Gmail/Resend/SMTP/n8n) is **NOT** implemented in Milestone 2. Approved emails are persisted with status `APPROVED` and `approved_at` timestamp ready for future automated dispatch.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 15 (App Router)](https://nextjs.org/) + React 19
- **Language:** TypeScript 5 (strict typing)
- **Styling:** Tailwind CSS + Lucide Icons
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security)
- **AI Engine:** Google Gemini (`@google/genai` SDK with Structured Outputs)
- **Validation:** Zod 3

---

## 🗄️ Database Architecture

### `leads` Table
Stores contact information, inquiry message, and qualification results.
- `id` (UUID, Primary Key)
- `name`, `email`, `company`, `message`, `source`, `service`, `budget`, `currency`, `timeline`
- `ai_score` (0–100), `qualification` (`HIGH` | `MEDIUM` | `LOW`), `intent`, `urgency`, `ai_summary`, `ai_reasoning`, `missing_information`, `recommended_action`
- `status` (`NEW` | `AI_ANALYZED` | `AI_ANALYSIS_FAILED` | `PENDING_APPROVAL` | `APPROVED`)
- `created_at`, `updated_at`

### `communications` Table (Milestone 2)
Stores AI-generated drafts and human approval records.
- `id` (UUID, Primary Key)
- `lead_id` (UUID, Foreign Key $\rightarrow$ `leads.id` ON DELETE CASCADE)
- `type` (e.g. `'initial_reply'`)
- `subject` (Text)
- `body` (Text)
- `status` (`DRAFT` | `APPROVED` | `REJECTED`)
- `created_at`, `updated_at`, `approved_at` (Timestamps)

---

## 🔌 API Routes

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/leads` | Ingests a new lead into Supabase (`status: NEW`). |
| `GET` | `/api/leads/[id]` | Server-side retrieval of a lead. |
| `POST` | `/api/leads/[id]/analyze` | Triggers Gemini AI qualification & deterministic scoring (`status: AI_ANALYZED`). |
| `POST` | `/api/leads/[id]/draft` | Generates or regenerates a personalized email draft (`status: PENDING_APPROVAL`). |
| `GET` | `/api/leads/[id]/draft` | Fetches the latest communication draft for a lead. |
| `PATCH` | `/api/communications/[id]` | Saves manual human edits to a draft's subject and body. |
| `POST` | `/api/communications/[id]/approve` | Explicitly approves the email draft (`status: APPROVED`, records `approved_at`). |

---

## 🎯 Deterministic Scoring System (Max 100)

| Factor | Points | Evaluation Heuristic |
|---|---|---|
| **Clear Service Requirement** | `+25` | Service explicitly chosen or extracted from inquiry |
| **Budget Provided** | `+20` | Numeric budget specified in form or message |
| **Realistic Budget** | `+15` | Budget meets configurable threshold for service (e.g. Website Development ≥ $2,500) |
| **Clear Timeline** | `+15` | Timeframe stated (e.g. "Within 1 month", "ASAP") |
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
GEMINI_MODEL=gemini-2.5-flash
```

### 3. Run Database Migrations

Execute the SQL files in `supabase/migrations/` inside your Supabase project:
1. `supabase/migrations/20261005000000_create_leads_table.sql`
2. `supabase/migrations/20261005000001_create_communications_table.sql`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🧪 Testing the Complete Workflow (Sarah Mitchell Test Lead)

1. Click **"Load Sarah Mitchell Example (US Lead)"** on the intake form:
   - **Name:** Sarah Mitchell
   - **Email:** `sarah@oakandthread.com`
   - **Company:** Oak & Thread Apparel
   - **Service:** Website Development
   - **Budget:** `$8,000` (USD)
   - **Timeline:** `Within 1 month`
   - **Message:** *"Hi, I'm launching a new clothing brand called Oak & Thread Apparel and I'm looking for someone to build an ecommerce website for us. We'd like to launch within the next month and have a budget of around $8,000. We're looking for a clean, modern site with product pages, checkout, and basic email signup. We'd love to know what the next steps would be."*
2. Click **Submit & Qualify Lead**.
3. View the qualification card: **HIGH (90+/100)** score with all 7 breakdown points.
4. Observe the **AI Generated Draft** section below:
   - Subject: Personalized Re: line.
   - Body: Warm, consultative message acknowledging Oak & Thread Apparel, ecommerce scope, and $8k budget.
5. Click **Edit Draft** to make adjustments and click **Save Edits**.
6. Click **Approve Email**:
   - Status updates to **HUMAN APPROVED**.
   - `approved_at` timestamp is recorded in Supabase.

---

## 🗺️ Roadmap & Milestones

- [x] **Milestone 1:** Lead Form → Supabase Storage → Gemini AI Extraction → Deterministic Scoring → Result UI
- [x] **Milestone 2:** AI Reply Draft Generation → In-App Editing → Explicit Human Approval (`communications` table)
- [ ] **Milestone 3:** Email Dispatch (Resend/Gmail integration) & Communication History
- [ ] **Milestone 4:** n8n Workflow Orchestration & Automated Follow-up Scheduling

---

## 🔒 Security & Privacy

- `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are server-side only and never exposed to the client bundle.
- Public anonymous users can only submit leads via `POST /api/leads`. All read, analysis, draft generation, editing, and approval actions are protected server-side with service-role credentials.
