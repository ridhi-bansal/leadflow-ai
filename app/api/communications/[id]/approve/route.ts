import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/supabase/server';
import { updateCommunicationSchema } from '@/lib/validations/lead';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/communications/[id]/approve
 * Explicit human approval of the email reply draft.
 * Transitions communication status to APPROVED and records approved_at timestamp.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Communication ID is required' }, { status: 400 });
  }

  const supabase = getAdminSupabaseClient();

  // 1. Fetch communication
  const { data: existing, error: fetchError } = await supabase
    .from('communications')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Communication record not found' }, { status: 404 });
  }

  // 2. Parse any optional final edits submitted with approval
  let finalSubject = existing.subject;
  let finalBody = existing.body;

  try {
    const json = await request.json().catch(() => ({}));
    if (json && (json.subject || json.body)) {
      const parseResult = updateCommunicationSchema.safeParse({
        subject: json.subject || existing.subject,
        body: json.body || existing.body,
      });
      if (parseResult.success) {
        finalSubject = parseResult.data.subject;
        finalBody = parseResult.data.body;
      }
    }
  } catch {
    // Body is optional
  }

  const approvedTimestamp = new Date().toISOString();

  // 3. Mark communication as APPROVED
  const { data: approvedComm, error: updateCommError } = await supabase
    .from('communications')
    .update({
      subject: finalSubject,
      body: finalBody,
      status: 'APPROVED',
      approved_at: approvedTimestamp,
      updated_at: approvedTimestamp,
    })
    .eq('id', id)
    .select()
    .single();

  if (updateCommError || !approvedComm) {
    console.error('Failed to approve communication in Supabase:', updateCommError);
    return NextResponse.json(
      { error: 'Failed to record approval in database' },
      { status: 500 }
    );
  }

  // 4. Update associated lead status to APPROVED
  await supabase
    .from('leads')
    .update({
      status: 'APPROVED',
      updated_at: approvedTimestamp,
    })
    .eq('id', existing.lead_id);

  return NextResponse.json({
    success: true,
    communication: approvedComm,
    message: 'Email draft has been successfully approved by human reviewer.',
  });
}
