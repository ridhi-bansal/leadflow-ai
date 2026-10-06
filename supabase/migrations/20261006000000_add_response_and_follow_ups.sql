-- LeadFlow AI: Milestone 3 - Response & Follow-Up Intelligence
-- Adds manual response tracking and follow-up recommendation structures

-- 1. Extend leads table with response tracking and follow-up tracking columns
ALTER TABLE public.leads 
  ADD COLUMN IF NOT EXISTS response_status TEXT NOT NULL DEFAULT 'waiting',
  ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS follow_up_count INTEGER NOT NULL DEFAULT 0;

-- Performance Indexes on leads for response and follow-up queries
CREATE INDEX IF NOT EXISTS idx_leads_response_status ON public.leads(response_status);
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up_at ON public.leads(next_follow_up_at);

-- 2. Create follow_ups table for historical tracking and recommendations
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  follow_up_number INTEGER NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'SCHEDULED', -- SCHEDULED, COMPLETED, CANCELLED, SKIPPED
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ
);

-- Performance Indexes on follow_ups
CREATE INDEX IF NOT EXISTS idx_follow_ups_lead_id ON public.follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON public.follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_scheduled_for ON public.follow_ups(scheduled_for);

-- Enable Row Level Security (RLS)
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

-- Protected server-side service role access only. No public policies.
