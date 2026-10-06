import { NextRequest, NextResponse } from 'next/server';
import { leadInputSchema } from '@/lib/validations/lead';
import { getAdminSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parseResult = leadInputSchema.safeParse(json);

    if (!parseResult.success) {
      const fieldErrors = parseResult.error.flatten().fieldErrors;
      const errorSummary = Object.entries(fieldErrors)
        .map(([field, msgs]) => `${field}: ${msgs?.join(', ')}`)
        .join('; ');
      console.warn('Lead validation failed on:', fieldErrors);
      return NextResponse.json(
        {
          error: `Lead validation failed on: ${errorSummary}`,
          details: fieldErrors,
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
        source: leadData.source || 'form',
        service: leadData.service || null,
        budget: leadData.budget ?? null,
        currency: leadData.currency || 'USD',
        timeline: leadData.timeline || null,
        status: 'NEW',
      })
      .select(
        'id, name, email, company, service, budget, currency, timeline, message, source, status, created_at'
      )
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();
    const qualification = searchParams.get('qualification')?.trim();
    const status = searchParams.get('status')?.trim();
    const source = searchParams.get('source')?.trim();
    const service = searchParams.get('service')?.trim();
    const sort = searchParams.get('sort')?.trim() || 'newest';

    const supabase = getAdminSupabaseClient();
    let query = supabase.from('leads').select('*');

    // Filtering
    if (qualification && qualification !== 'ALL') {
      query = query.eq('qualification', qualification);
    }

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    if (source && source !== 'ALL') {
      query = query.eq('source', source);
    }

    if (service && service !== 'ALL') {
      query = query.eq('service', service);
    }

    if (q) {
      query = query.or(
        `name.ilike.%${q}%,email.ilike.%${q}%,company.ilike.%${q}%,service.ilike.%${q}%,message.ilike.%${q}%`
      );
    }

    // Sorting
    switch (sort) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'highest_score':
        query = query.order('ai_score', { ascending: false, nullsFirst: false });
        break;
      case 'lowest_score':
        query = query.order('ai_score', { ascending: true, nullsFirst: false });
        break;
      case 'highest_budget':
        query = query.order('budget', { ascending: false, nullsFirst: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const { data: leads, error } = await query;

    if (error) {
      console.error('Error fetching leads:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leads from database' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        leads: leads || [],
        total: leads?.length || 0,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Unexpected error in GET /api/leads:', err);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}
