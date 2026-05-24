import { Prisma } from '@prisma/client';
import { BaseResumeProfile } from '@/app/data/baseResumes';

type ProfileWithDefaultPrompt = Prisma.ProfileGetPayload<{
  include: { defaultPrompt: true };
}>;

export function mapProfileToBaseResume(profile: ProfileWithDefaultPrompt): BaseResumeProfile {
  return {
    name: profile.name,
    resumeText: profile.resumeText,
    customPrompt: profile.customPrompt || undefined,
    defaultPromptId: profile.defaultPromptId || undefined,
    defaultPromptText: profile.defaultPrompt?.content || undefined,
    pdfTemplate: profile.pdfTemplate,
    email: profile.email || undefined,
    phoneNumber: profile.phoneNumber || undefined,
    fullAddress: profile.fullAddress || undefined,
    linkedinUrl: profile.linkedinUrl || undefined,
    jobDescription: profile.jobDescription || undefined,
    targetTitle: profile.targetTitle || undefined,
    logGenerations: profile.logGenerations ?? false,
  };
}

export const profileIncludeDefaultPrompt = {
  defaultPrompt: true,
} as const;
