import { NextRequest, NextResponse } from 'next/server';
import { leadInputSchema } from '@/lib/validations/lead';
import { getAdminSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parseResult = leadInputSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const leadData = parseResult.data;
    const supabase = getAdminSupabaseClient();

    const { data, error } = await supabase
      .from('leads')
      .insert({
        name: leadData.name,
        email: leadData.email,
        company: leadData.company || null,
        message: leadData.message,
        source: 'website',
        service: leadData.service || null,
        budget: leadData.budget ?? null,
        currency: leadData.currency || 'USD',
        timeline: leadData.timeline || null,
        status: 'NEW',
      })
      .select('id, name, email, company, service, budget, currency, timeline, message, status, created_at')
      .single();

    if (error || !data) {
      console.error('Supabase lead insertion error:', error);
      return NextResponse.json(
        { error: "We couldn't save this lead. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        id: data.id,
        lead: data,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Unexpected error in POST /api/leads:', err);
    return NextResponse.json(
      { error: "We couldn't save this lead. Please try again." },
      { status: 500 }
    );
  }
}
