import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSupabaseClient } from '@/lib/supabase/server';
import { getFollowUpRecommendation } from '@/lib/followups';
import { Communication, Lead, ResponseStatus } from '@/types/lead';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const responseStatusSchema = z.object({
  response_status: z.enum(['waiting', 'replied', 'no_response']),
});

/**
 * PATCH /api/leads/[id]/response
 * Manually updates the response status for a lead and recalculates follow-up recommendations.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
  }

  try {
    const json = await request.json();
    const parseResult = responseStatusSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid response status. Must be "waiting", "replied", or "no_response".' },
        { status: 400 }
      );
    }

    const { response_status } = parseResult.data;
    const supabase = getAdminSupabaseClient();

    console.log(`[response] Received request to update lead ${id} response_status to "${response_status}"`);

    // 1. Fetch current lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (leadError || !lead) {
      console.error(`[response] Lead ${id} lookup failed:`, {
        message: leadError?.message,
        code: leadError?.code,
        details: leadError?.details,
        hint: leadError?.hint,
      });
      return NextResponse.json({ error: 'Lead not found or inaccessible' }, { status: 404 });
    }

    console.log(`[response] Lead lookup succeeded for ${lead.name} (${id})`);

    // 2. Fetch all communications for this lead
    const { data: communications, error: commsError } = await supabase
      .from('communications')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: true });

    if (commsError) {
      console.warn('[response] Warning fetching communications history:', commsError);
    }

    // 3. Compute follow-up recommendation with the updated response status
    const updatedLeadMock: Lead = {
      ...(lead as unknown as Lead),
      response_status: response_status as ResponseStatus,
    };

    const recommendation = getFollowUpRecommendation(
      updatedLeadMock,
      (communications || []) as unknown as Communication[]
    );

    console.log(`[response] follow-up calculation succeeded: status=${recommendation.status}, shouldFollowUp=${recommendation.shouldFollowUp}, due=${recommendation.recommendedDateFormatted}`);

    // 4. Update leads table
    console.log(`[response] updating lead ${id} in Supabase leads table...`);
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update({
        response_status,
        next_follow_up_at: recommendation.recommendedDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedLead) {
      console.error(`[response] ❌ Supabase error updating leads table:`, {
        message: updateError?.message,
        code: updateError?.code,
        details: updateError?.details,
        hint: updateError?.hint,
      });
      return NextResponse.json(
        {
          error: updateError?.message || 'Failed to update response status in database',
          code: updateError?.code,
          details: updateError?.details,
          hint: updateError?.hint,
        },
        { status: 500 }
      );
    }

    console.log(`[response] lead update succeeded: id=${updatedLead.id}, response_status=${updatedLead.response_status}`);

    // 5. Update or insert follow_ups records if table is active
    try {
      if (response_status === 'replied') {
        // Cancel any scheduled follow-ups
        await supabase
          .from('follow_ups')
          .update({
            status: 'CANCELLED',
            completed_at: new Date().toISOString(),
          })
          .eq('lead_id', id)
          .eq('status', 'SCHEDULED');
        console.log(`[response] follow-up record update succeeded: scheduled follow-ups cancelled`);
      } else if (recommendation.shouldFollowUp && recommendation.recommendedDate && recommendation.followUpNumber) {
        // Create or update scheduled follow-up entry
        await supabase.from('follow_ups').insert({
          lead_id: id,
          follow_up_number: recommendation.followUpNumber,
          scheduled_for: recommendation.recommendedDate,
          status: 'SCHEDULED',
          reason: recommendation.reason,
        });
        console.log(`[response] follow-up record update succeeded: follow-up #${recommendation.followUpNumber} scheduled`);
      }
    } catch (fuErr) {
      console.warn('[response] Note: follow_ups table update skipped or not migrated yet:', fuErr);
    }

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      recommendation,
    });
  } catch (err) {
    console.error(`[response] Unexpected error in PATCH /api/leads/${id}/response:`, err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Internal server error while updating response tracking',
      },
      { status: 500 }
    );
  }
}
