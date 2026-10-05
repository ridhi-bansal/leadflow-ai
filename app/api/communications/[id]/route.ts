import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/supabase/server';
import { updateCommunicationSchema } from '@/lib/validations/lead';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/communications/[id]
 * Retrieves a specific communication record.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Communication ID is required' }, { status: 400 });
  }

  const supabase = getAdminSupabaseClient();

  const { data: communication, error } = await supabase
    .from('communications')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !communication) {
    return NextResponse.json({ error: 'Communication not found' }, { status: 404 });
  }

  return NextResponse.json({ communication });
}

/**
 * PATCH /api/communications/[id]
 * Updates the subject and body of an editable (DRAFT) communication.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Communication ID is required' }, { status: 400 });
  }

  try {
    const json = await request.json();
    const parseResult = updateCommunicationSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { subject, body } = parseResult.data;
    const supabase = getAdminSupabaseClient();

    // 1. Fetch existing communication
    const { data: existing, error: fetchError } = await supabase
      .from('communications')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Communication record not found' }, { status: 404 });
    }

    // 2. Safety check: prevent direct editing of approved emails
    if (existing.status === 'APPROVED') {
      return NextResponse.json(
        {
          error:
            'Cannot directly edit an already approved email draft. Please generate a new draft if revisions are required.',
        },
        { status: 400 }
      );
    }

    // 3. Update communication
    const { data: updated, error: updateError } = await supabase
      .from('communications')
      .update({
        subject,
        body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updated) {
      console.error('Failed to update communication in Supabase:', updateError);
      return NextResponse.json(
        { error: 'Failed to save communication edits to database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      communication: updated,
    });
  } catch (err) {
    console.error(`Unexpected error in PATCH /api/communications/${id}:`, err);
    return NextResponse.json({ error: 'Internal server error while saving draft.' }, { status: 500 });
  }
}
