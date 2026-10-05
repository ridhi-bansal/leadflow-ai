-- LeadFlow AI: Leads Table Migration
-- Milestone 1: Lead Intake & Qualification

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  message TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'website',
  service TEXT,
  budget NUMERIC,
  currency TEXT NOT NULL DEFAULT 'USD',
  timeline TEXT,
  ai_score INTEGER,
  qualification TEXT,
  intent TEXT,
  urgency TEXT,
  ai_summary TEXT,
  ai_reasoning TEXT,
  missing_information JSONB,
  recommended_action TEXT,
  status TEXT NOT NULL DEFAULT 'NEW',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_qualification ON public.leads(qualification);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);

-- Enable Row Level Security (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public intake form can INSERT new leads
CREATE POLICY "Allow public lead submission" ON public.leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No public SELECT / UPDATE / DELETE policy is created.
-- All read, analysis, and update operations are conducted server-side using the service role key.
