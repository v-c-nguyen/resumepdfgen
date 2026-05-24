import { prisma } from '@/lib/prisma';
import { DEFAULT_PROMPT_TEMPLATE } from '@/app/utils/promptBuilder';

export async function ensureDefaultPromptsExist() {
  const count = await prisma.defaultPrompt.count();
  if (count > 0) return;

  await prisma.defaultPrompt.create({
    data: {
      name: 'Standard',
      content: DEFAULT_PROMPT_TEMPLATE,
    },
  });
}

export async function listDefaultPrompts() {
  await ensureDefaultPromptsExist();
  return prisma.defaultPrompt.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, content: true },
  });
}

export async function createDefaultPrompt(name: string, content: string) {
  const trimmedName = name.trim();
  const existing = await prisma.defaultPrompt.findUnique({
    where: { name: trimmedName },
  });

  if (existing) {
    return { error: 'A default prompt with this name already exists' as const };
  }

  const defaultPrompt = await prisma.defaultPrompt.create({
    data: {
      name: trimmedName,
      content,
    },
    select: { id: true, name: true, content: true },
  });

  return { defaultPrompt };
}
