import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createDefaultPrompt, listDefaultPrompts } from '@/lib/defaultPrompts';

function isAuthenticated(req: NextRequest): boolean {
  return !!req.cookies.get('admin_session');
}

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

export async function DELETE(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Default prompt id is required' }, { status: 400 });
    }

    const existing = await prisma.defaultPrompt.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Default prompt not found' }, { status: 404 });
    }

    await prisma.defaultPrompt.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to delete default prompt',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
