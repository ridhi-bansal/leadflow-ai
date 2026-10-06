import { NextRequest, NextResponse } from 'next/server';
import { extractEmailInputSchema } from '@/lib/validations/lead';
import { extractLeadFromPastedEmail } from '@/lib/gemini/client';

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parseResult = extractEmailInputSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { rawEmail } = parseResult.data;
    const extracted = await extractLeadFromPastedEmail(rawEmail);

    return NextResponse.json(
      {
        success: true,
        extracted,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Unexpected error in POST /api/leads/extract-email:', err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Failed to extract structured lead details from email.',
      },
      { status: 500 }
    );
  }
}
