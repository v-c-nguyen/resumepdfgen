import { PrismaClient } from '@prisma/client';
import { baseResumes } from '../app/data/baseResumes';
import { DEFAULT_PROMPT_TEMPLATE } from '../app/utils/promptBuilder';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  const standardPrompt = await prisma.defaultPrompt.upsert({
    where: { name: 'Standard' },
    update: {},
    create: {
      name: 'Standard',
      content: DEFAULT_PROMPT_TEMPLATE,
    },
  });
  console.log(`Ensured default prompt: ${standardPrompt.name}`);

  // Clear existing profiles
  await prisma.profile.deleteMany({});
  console.log('Cleared existing profiles');

  // Seed profiles from baseResumes
  for (const profile of baseResumes) {
    await prisma.profile.create({
      data: {
        name: profile.name,
        resumeText: profile.resumeText,
        customPrompt: profile.customPrompt || null,
        defaultPromptId: profile.customPrompt ? null : standardPrompt.id,
        pdfTemplate: profile.pdfTemplate || 1,
      },
    });
    console.log(`Seeded profile: ${profile.name}`);
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
