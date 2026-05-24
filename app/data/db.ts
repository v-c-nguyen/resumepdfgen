import { prisma } from '@/lib/prisma';
import { BaseResumeProfile } from './baseResumes';
import { mapProfileToBaseResume, profileIncludeDefaultPrompt } from '@/lib/mapProfile';

// Fetch all profiles from database
export async function getBaseResumes(): Promise<BaseResumeProfile[]> {
  const profiles = await prisma.profile.findMany({
    orderBy: { name: 'asc' },
    include: profileIncludeDefaultPrompt,
  });

  return profiles.map(mapProfileToBaseResume);
}

// Get a profile by name from database
export async function getBaseResumeByName(name: string | null | undefined): Promise<BaseResumeProfile | null> {
  if (!name) return null;

  const profile = await prisma.profile.findUnique({
    where: { name },
    include: profileIncludeDefaultPrompt,
  });

  if (!profile) return null;

  return mapProfileToBaseResume(profile);
}
