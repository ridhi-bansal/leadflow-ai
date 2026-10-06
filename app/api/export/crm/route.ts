import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/supabase/server';
import { generateCrmExcelBuffer } from '@/lib/export/excel';
import { FollowUp, Lead } from '@/types/lead';

/**
 * GET /api/export/crm
 * Exports CRM Leads, Follow-Ups, and Summary into a downloadable .xlsx Excel workbook.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope')?.trim() || 'all';
    const q = searchParams.get('q')?.trim();
    const qualification = searchParams.get('qualification')?.trim();
    const status = searchParams.get('status')?.trim();
    const responseStatus = searchParams.get('response')?.trim();
    const source = searchParams.get('source')?.trim();
    const service = searchParams.get('service')?.trim();
    const sort = searchParams.get('sort')?.trim() || 'newest';

    const supabase = getAdminSupabaseClient();

    // 1. Query leads
    let leadsQuery = supabase.from('leads').select('*');

    if (scope === 'view') {
      if (qualification && qualification !== 'ALL') {
        leadsQuery = leadsQuery.eq('qualification', qualification);
      }
      if (status && status !== 'ALL') {
        leadsQuery = leadsQuery.eq('status', status);
      }
      if (responseStatus && responseStatus !== 'ALL') {
        leadsQuery = leadsQuery.eq('response_status', responseStatus);
      }
      if (source && source !== 'ALL') {
        leadsQuery = leadsQuery.eq('source', source);
      }
      if (service && service !== 'ALL') {
        leadsQuery = leadsQuery.eq('service', service);
      }
      if (q) {
        leadsQuery = leadsQuery.or(
          `name.ilike.%${q}%,email.ilike.%${q}%,company.ilike.%${q}%,service.ilike.%${q}%,message.ilike.%${q}%`
        );
      }

      switch (sort) {
        case 'oldest':
          leadsQuery = leadsQuery.order('created_at', { ascending: true });
          break;
        case 'highest_score':
          leadsQuery = leadsQuery.order('ai_score', { ascending: false, nullsFirst: false });
          break;
        case 'lowest_score':
          leadsQuery = leadsQuery.order('ai_score', { ascending: true, nullsFirst: false });
          break;
        case 'highest_budget':
          leadsQuery = leadsQuery.order('budget', { ascending: false, nullsFirst: false });
          break;
        case 'newest':
        default:
          leadsQuery = leadsQuery.order('created_at', { ascending: false });
          break;
      }
    } else {
      // Default: All leads ordered by created_at DESC
      leadsQuery = leadsQuery.order('created_at', { ascending: false });
    }

    const { data: leads, error: leadsError } = await leadsQuery;

    if (leadsError) {
      console.error('Error querying leads for export:', leadsError);
      return NextResponse.json(
        { error: 'Failed to retrieve CRM leads for export' },
        { status: 500 }
      );
    }

    // 2. Query follow-ups
    let followUps: FollowUp[] = [];
    try {
      const { data: fuData } = await supabase
        .from('follow_ups')
        .select('*')
        .order('created_at', { ascending: false });
      if (fuData) {
        followUps = fuData as unknown as FollowUp[];
      }
    } catch (fuErr) {
      console.warn('Note: follow_ups table query skipped or empty:', fuErr);
    }

    // 3. Generate Excel buffer
    const dateStr = new Date().toISOString().split('T')[0];
    const filename =
      scope === 'view'
        ? `LeadFlow_CRM_View_${dateStr}.xlsx`
        : `LeadFlow_CRM_${dateStr}.xlsx`;

    const scopeLabel = scope === 'view' ? 'Current Inbox Filtered View' : 'All CRM Leads';
    const excelBuffer = generateCrmExcelBuffer(
      (leads || []) as unknown as Lead[],
      followUps,
      {
        scopeName: scopeLabel,
        exportDate: new Date(),
      }
    );

    // 4. Return as downloadable file attachment
    return new NextResponse(excelBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    console.error('Unexpected error in GET /api/export/crm:', err);
    return NextResponse.json(
      { error: 'Could not export CRM data. Please try again.' },
      { status: 500 }
    );
  }
}
