import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status')?.trim();
    const q = searchParams.get('q')?.trim();

    const supabase = getAdminSupabaseClient();

    let query = supabase
      .from('communications')
      .select(
        `
        id,
        lead_id,
        type,
        subject,
        body,
        status,
        created_at,
        updated_at,
        approved_at,
        sent_at,
        gmail_message_id,
        leads:lead_id (
          id,
          name,
          email,
          company,
          service,
          budget,
          currency,
          qualification,
          ai_score,
          status,
          created_at
        )
      `
      )
      .order('created_at', { ascending: false });

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    const { data: communications, error } = await query;

    if (error) {
      console.error('Error fetching drafts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch email drafts' },
        { status: 500 }
      );
    }

    let filtered = communications || [];

    if (q) {
      const lowerQ = q.toLowerCase();
      filtered = filtered.filter((c) => {
        const leadObj = Array.isArray(c.leads) ? c.leads[0] : c.leads;
        return (
          c.subject?.toLowerCase().includes(lowerQ) ||
          c.body?.toLowerCase().includes(lowerQ) ||
          leadObj?.name?.toLowerCase().includes(lowerQ) ||
          leadObj?.email?.toLowerCase().includes(lowerQ) ||
          leadObj?.company?.toLowerCase().includes(lowerQ)
        );
      });
    }

    return NextResponse.json(
      {
        drafts: filtered,
        total: filtered.length,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Unexpected error in GET /api/drafts:', err);
    return NextResponse.json(
      { error: 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}
