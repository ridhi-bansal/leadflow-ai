-- LeadFlow AI: Communications Table Migration
-- Milestone 2: AI-Generated Email Draft & Human Approval

CREATE TABLE IF NOT EXISTS public.communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'initial_reply',
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  approved_at TIMESTAMPTZ
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_communications_lead_id ON public.communications(lead_id);
CREATE INDEX IF NOT EXISTS idx_communications_status ON public.communications(status);
CREATE INDEX IF NOT EXISTS idx_communications_type ON public.communications(type);

-- Enable Row Level Security (RLS)
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;

-- Security Policy: Strictly server-side / service-role access.
-- No public SELECT / INSERT / UPDATE / DELETE policies are created to preserve privacy.
-- All operations are performed server-side via SUPABASE_SERVICE_ROLE_KEY.
