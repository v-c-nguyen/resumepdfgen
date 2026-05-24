import { NextRequest, NextResponse } from 'next/server';
import { createDefaultPrompt, listDefaultPrompts } from '@/lib/defaultPrompts';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const defaultPrompts = await listDefaultPrompts();
    return NextResponse.json({ defaultPrompts });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to read default prompts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, content } = await req.json();

    if (!name?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: 'Name and content are required' },
        { status: 400 }
      );
    }

    const result = await createDefaultPrompt(name, content);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, defaultPrompt: result.defaultPrompt });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to create default prompt',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
