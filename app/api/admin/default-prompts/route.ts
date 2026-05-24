import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_PROMPT_TEMPLATE } from '@/app/utils/promptBuilder';

async function ensureDefaultPromptsExist() {
  const count = await prisma.defaultPrompt.count();
  if (count > 0) return;

  await prisma.defaultPrompt.create({
    data: {
      name: 'Standard',
      content: DEFAULT_PROMPT_TEMPLATE,
    },
  });
}

function isAuthenticated(req: NextRequest): boolean {
  return !!req.cookies.get('admin_session');
}

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureDefaultPromptsExist();
    const defaultPrompts = await prisma.defaultPrompt.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, content: true },
    });
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

    const trimmedName = name.trim();
    const existing = await prisma.defaultPrompt.findUnique({
      where: { name: trimmedName },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A default prompt with this name already exists' },
        { status: 400 }
      );
    }

    const defaultPrompt = await prisma.defaultPrompt.create({
      data: {
        name: trimmedName,
        content: content,
      },
      select: { id: true, name: true, content: true },
    });

    return NextResponse.json({ success: true, defaultPrompt });
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
