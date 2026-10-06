import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/supabase/server';
import { getFollowUpRecommendation } from '@/lib/followups';
import { Communication, Lead } from '@/types/lead';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
  }

  const supabase = getAdminSupabaseClient();

  // 1. Fetch lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // 2. Fetch communications
  const { data: communications } = await supabase
    .from('communications')
    .select('*')
    .eq('lead_id', id)
    .order('created_at', { ascending: true });

  // 3. Fetch follow_ups
  const { data: followUps } = await supabase
    .from('follow_ups')
    .select('*')
    .eq('lead_id', id)
    .order('created_at', { ascending: true });

  // 4. Compute follow-up recommendation
  const recommendation = getFollowUpRecommendation(
    lead as unknown as Lead,
    (communications || []) as unknown as Communication[]
  );

  return NextResponse.json({
    lead: {
      ...lead,
      communications: communications || [],
      follow_ups: followUps || [],
    },
    communications: communications || [],
    follow_ups: followUps || [],
    recommendation,
  });
}

