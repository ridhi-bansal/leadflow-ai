import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/supabase/server';
import { generateEmailDraftWithGemini } from '@/lib/gemini/client';
import { AILeadAnalysis, Lead } from '@/types/lead';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/leads/[id]/draft
 * Fetches the latest communication draft for the given lead.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
  }

  const supabase = getAdminSupabaseClient();

  const { data: communication, error } = await supabase
    .from('communications')
    .select('*')
    .eq('lead_id', id)
    .eq('type', 'initial_reply')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching draft communication:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve draft communication.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ communication });
}

/**
 * POST /api/leads/[id]/draft
 * Generates or regenerates a personalized email draft using Gemini.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
  }

  let force = false;
  try {
    const body = await request.json().catch(() => ({}));
    if (body && typeof body.force === 'boolean') {
      force = body.force;
    }
  } catch {
    // Body is optional
  }

  const supabase = getAdminSupabaseClient();

  // 1. Fetch lead from Supabase
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Lead not found or inaccessible' }, { status: 404 });
  }

  // 2. Check for existing communication
  const { data: existingComm } = await supabase
    .from('communications')
    .select('*')
    .eq('lead_id', id)
    .eq('type', 'initial_reply')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Safety: If already approved and not forced, return existing without overwriting
  if (existingComm && existingComm.status === 'APPROVED' && !force) {
    return NextResponse.json({
      success: true,
      communication: existingComm,
      message: 'Email draft is already approved. Use force: true to generate a new draft.',
    });
  }

  // 3. Prepare AI qualification context
  const aiAnalysis: AILeadAnalysis | null = lead.ai_summary
    ? {
        service: lead.service || '',
        budget: lead.budget !== null ? Number(lead.budget) : null,
        currency: lead.currency || 'USD',
        timeline: lead.timeline || '',
        intent: lead.intent || 'Medium',
        urgency: lead.urgency || 'Medium',
        company_identified: Boolean(lead.company),
        specific_requirements: Array.isArray(lead.missing_information)
          ? []
          : [],
        summary: lead.ai_summary || '',
        reasoning: lead.ai_reasoning || '',
        missing_information: Array.isArray(lead.missing_information)
          ? (lead.missing_information as string[])
          : [],
        recommended_action: lead.recommended_action || '',
      }
    : null;

  try {
    // 4. Generate structured email draft with Gemini
    const emailDraft = await generateEmailDraftWithGemini(lead as unknown as Lead, aiAnalysis);

    let savedCommunication;

    if (existingComm) {
      // Update existing draft record
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
        console.error('Failed to update communication record in Supabase:', updateError);
        throw new Error(updateError?.message || 'Failed to update existing communication record in Supabase');
      }
      savedCommunication = updated;
    } else {
      // Insert new communication record
      const { data: inserted, error: insertError } = await supabase
        .from('communications')
        .insert({
          lead_id: id,
          type: 'initial_reply',
          subject: emailDraft.subject,
          body: emailDraft.body,
          status: 'DRAFT',
        })
        .select()
        .single();

      if (insertError || !inserted) {
        console.error('Failed to insert communication record in Supabase:', insertError);
        throw new Error(insertError?.message || 'Failed to save generated email draft to Supabase');
      }
      savedCommunication = inserted;
    }

    // 5. Transition lead status to PENDING_APPROVAL
    await supabase
      .from('leads')
      .update({
        status: 'PENDING_APPROVAL',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      communication: savedCommunication,
    });
  } catch (err) {
    console.error(`Email draft generation failed for lead ${id}:`, err);
    return NextResponse.json(
      {
        error: 'Failed to generate email draft. You can retry generating the draft.',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 502 }
    );
  }
}
