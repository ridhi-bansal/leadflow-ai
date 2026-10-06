import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSupabaseClient } from '@/lib/supabase/server';
import { generateFollowUpDraftWithGemini } from '@/lib/gemini/client';
import { AILeadAnalysis, Communication, Lead } from '@/types/lead';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const followUpDraftRequestSchema = z.object({
  follow_up_number: z.union([z.literal(1), z.literal(2)]).default(1),
  force: z.boolean().optional().default(false),
});

/**
 * GET /api/leads/[id]/followup-draft
 * Retrieves existing follow-up draft communications for this lead.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const numberParam = searchParams.get('number');
  const targetType = numberParam === '2' ? 'follow_up_2' : numberParam === '1' ? 'follow_up_1' : null;

  const supabase = getAdminSupabaseClient();

  let query = supabase
    .from('communications')
    .select('*')
    .eq('lead_id', id)
    .order('created_at', { ascending: false });

  if (targetType) {
    query = query.eq('type', targetType);
  } else {
    query = query.in('type', ['follow_up_1', 'follow_up_2']);
  }

  const { data: communications, error } = await query;

  if (error) {
    console.error('Error fetching follow-up drafts:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve follow-up draft communications.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ communications });
}

/**
 * POST /api/leads/[id]/followup-draft
 * Generates or regenerates a concise follow-up email draft using Gemini.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
  }

  let followUpNumber: 1 | 2 = 1;
  let force = false;

  try {
    const json = await request.json().catch(() => ({}));
    const parsed = followUpDraftRequestSchema.safeParse(json);
    if (parsed.success) {
      followUpNumber = parsed.data.follow_up_number;
      force = parsed.data.force;
    }
  } catch {
    // defaults
  }

  const supabase = getAdminSupabaseClient();

  // 1. Fetch Lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Lead not found or inaccessible' }, { status: 404 });
  }

  // 2. Safety Rule: Cannot generate follow-up draft for a replied lead
  if (lead.response_status === 'replied') {
    return NextResponse.json(
      { error: 'Cannot generate follow-up draft. This prospect has already replied.' },
      { status: 400 }
    );
  }

  const targetType = `follow_up_${followUpNumber}`;

  // 3. Check for existing communication of this type
  const { data: existingComm } = await supabase
    .from('communications')
    .select('*')
    .eq('lead_id', id)
    .eq('type', targetType)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingComm && existingComm.status === 'APPROVED' && !force) {
    return NextResponse.json({
      success: true,
      communication: existingComm,
      message: `Follow-up #${followUpNumber} draft is already approved. Use force: true to overwrite.`,
    });
  }

  // 4. Fetch previous communications for context
  const { data: previousComms } = await supabase
    .from('communications')
    .select('type, subject, body, status, created_at')
    .eq('lead_id', id)
    .order('created_at', { ascending: true });

  const aiAnalysis: AILeadAnalysis | null = lead.ai_summary
    ? {
        service: lead.service || '',
        budget: lead.budget !== null ? Number(lead.budget) : null,
        currency: lead.currency || 'USD',
        timeline: lead.timeline || '',
        intent: lead.intent || 'Medium',
        urgency: lead.urgency || 'Medium',
        company_identified: Boolean(lead.company),
        specific_requirements: [],
        summary: lead.ai_summary || '',
        reasoning: lead.ai_reasoning || '',
        missing_information: Array.isArray(lead.missing_information)
          ? (lead.missing_information as string[])
          : [],
        recommended_action: lead.recommended_action || '',
      }
    : null;

  try {
    // 5. Generate draft with Gemini
    const emailDraft = await generateFollowUpDraftWithGemini(
      lead as unknown as Lead,
      followUpNumber,
      (previousComms || []) as unknown as Communication[],
      aiAnalysis
    );

    let savedCommunication;

    if (existingComm) {
      const { data: updated, error: updateError } = await supabase
        .from('communications')
        .update({
          subject: emailDraft.subject,
          body: emailDraft.body,
          status: 'DRAFT',
          approved_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingComm.id)
        .select()
        .single();

      if (updateError || !updated) {
        throw new Error(updateError?.message || 'Failed to update follow-up draft in database');
      }
      savedCommunication = updated;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('communications')
        .insert({
          lead_id: id,
          type: targetType,
          subject: emailDraft.subject,
          body: emailDraft.body,
          status: 'DRAFT',
        })
        .select()
        .single();

      if (insertError || !inserted) {
        throw new Error(insertError?.message || 'Failed to save follow-up draft to database');
      }
      savedCommunication = inserted;
    }

    return NextResponse.json({
      success: true,
      communication: savedCommunication,
    });
  } catch (err) {
    console.error(`Follow-up #${followUpNumber} draft generation failed:`, err);
    return NextResponse.json(
      {
        error: `Failed to generate Follow-up #${followUpNumber} draft.`,
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 502 }
    );
  }
}
