# Product Roadmap: LeadFlow AI

**Project:** LeadFlow AI  
**Context:** Portfolio Project for Northstar Studio (Fictional Agency)  

---

## Completed Milestones

### Milestone 1 — Lead Intake, Persistence & Heuristic Scoring
- [x] Structured intake form with Zod schema validation
- [x] Supabase PostgreSQL storage with Row Level Security
- [x] Google Gemini signal extraction
- [x] 100-point deterministic heuristic scoring engine
- [x] Lead Inbox with search, multi-filter, and sorting

### Milestone 2 — Human-in-the-Loop AI Email Drafting
- [x] Gemini plain-text response draft generation
- [x] Inline draft editing UI (subject & body)
- [x] Explicit human approval workflow (`DRAFT` $\rightarrow$ `APPROVED`)
- [x] Drafts Manager view

### Milestone 2.5 — Email Client (`mailto:`) Handoff
- [x] Removed external sending complexity in favor of reliable human email handoff
- [x] `mailto:` generator pre-filling recipient, subject, and approved body
- [x] Direct clipboard fallback
- [x] Unformatted email paste intake (Mode B) with interactive extraction review

### Milestone 3 — Response & Follow-Up Intelligence
- [x] Manual response logging (`Waiting for Response`, `Replied`, `No Response`)
- [x] Deterministic business-day calculator skipping Saturdays and Sundays
- [x] Follow-Up #1 recommendation (+2 business days)
- [x] Follow-Up #2 recommendation (+4 business days)
- [x] Automatic pause on prospect reply (`PAUSED_REPLIED`)
- [x] Automated sequence stop after 2 follow-ups (`STOPPED_MAX`)
- [x] Follow-up draft generation with human approval

### Milestone 4 — Multi-Sheet Excel CRM Export
- [x] Zero-dependency binary Excel export using `xlsx` (SheetJS)
- [x] Multi-sheet structure: `CRM Leads`, `Follow-Ups`, and `Summary` KPI dashboard
- [x] Dual export options: `Export All Leads` and `Export Current View`
- [x] Formatted columns, AutoFilters, and frozen header rows

### Production Readiness
- [x] Environment variable isolation and security audit
- [x] Automated test suites (`test-followups.mjs`, `test-excel-export.mjs`)
- [x] Production build validation for Vercel

---

## Next / Future Enhancements

The following roadmap items represent realistic future engineering phases:

### Phase 1: Direct Email Provider Integration
- Integration with transactional email delivery providers (e.g., Resend, SendGrid, Amazon SES)
- Custom agency domain verification (SPF/DKIM/DMARC)
- Outbound delivery status webhooks (Delivered, Bounced, Opened)

### Phase 2: Automated Inbound Reply Detection
- Inbound email webhook endpoints to automatically detect prospect responses
- Email thread stitching and automatic transition to `Replied` state
- AI sentiment analysis on incoming replies to flag urgent vs. standard questions

### Phase 3: External Workflow & CRM Integration
- Webhook events for n8n, Zapier, or Make integrations
- Two-way synchronization with HubSpot, Salesforce, or Close CRM
- Calendar booking integration (Cal.com / Calendly) directly in draft CTAs

### Phase 4: Pipeline Analytics & Insights
- Win/loss velocity reporting
- Average response time tracking
- Service category demand trends and revenue forecasting
