import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/supabase/server';
import { analyzeLeadWithGemini } from '@/lib/gemini/client';
import { calculateQualificationScore } from '@/lib/scoring';
import { Currency, LeadInput } from '@/types/lead';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
  }

  const supabase = getAdminSupabaseClient();

  // 1. Fetch lead from Supabase
  const { data: lead, error: fetchError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !lead) {
    console.error('Failed to fetch lead for analysis:', fetchError);
    return NextResponse.json(
      { error: 'Lead not found or inaccessible' },
      { status: 404 }
    );
  }

  const leadInput: LeadInput = {
    name: lead.name,
    email: lead.email,
    company: lead.company || undefined,
    service: lead.service || undefined,
    budget: lead.budget !== null ? Number(lead.budget) : undefined,
    currency: (lead.currency as Currency) || 'USD',
    timeline: lead.timeline || undefined,
    message: lead.message,
  };

  try {
    // 2. Perform Gemini AI analysis
    const aiAnalysis = await analyzeLeadWithGemini(leadInput);

    // 3. Compute deterministic qualification score
    const qualificationResult = calculateQualificationScore(leadInput, aiAnalysis);

    // 4. Update Supabase with AI analysis results & status
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update({
        ai_score: qualificationResult.score,
        qualification: qualificationResult.qualification,
        intent: aiAnalysis.intent,
        urgency: aiAnalysis.urgency,
        ai_summary: aiAnalysis.summary,
        ai_reasoning: aiAnalysis.reasoning,
        missing_information: aiAnalysis.missing_information,
        recommended_action: aiAnalysis.recommended_action,
        status: 'AI_ANALYZED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to save AI analysis to Supabase:', updateError);
      return NextResponse.json(
        {
          error: 'Analysis succeeded but failed to update record in database.',
          qualification: qualificationResult,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      qualification: qualificationResult,
    });
  } catch (error) {
    console.error(`AI analysis failed for lead ${id}:`, error);

    // Mark lead status as AI_ANALYSIS_FAILED in Supabase so lead is not lost
    await supabase
      .from('leads')
      .update({
        status: 'AI_ANALYSIS_FAILED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    return NextResponse.json(
      {
        error: 'The lead was saved, but AI analysis failed. You can retry the analysis.',
        leadId: id,
      },
      { status: 502 }
    );
  }
}
