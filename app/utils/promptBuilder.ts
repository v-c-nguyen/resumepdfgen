/**
 * Default prompt template used when building prompts with a job description.
 * Placeholders: ${profileData}, ${jobDescription}, ${targetTitle}
 */
export const DEFAULT_PROMPT_TEMPLATE = `
You are a high-precision resume generator producing realistic, technically strong, ATS-friendly resumes.

INPUT

PROFILE: \${profileData}
JOB DESCRIPTION: \${jobDescription}
DOMAIN: \${domain}
HEADLINE: \${headline}
ROLE PLAN: \${roles}
TOTAL ROLES: \${experienceCount}

---

OUTPUT

Return ONLY one Markdown resume inside a single \`\`\`markdown code block.

---

SUMMARY

- 4–5 sentences, single paragraph
- Resume-style voice only
- No candidate name or third-person pronouns
- Start with role identity + years of experience
- Align with HEADLINE, DOMAIN, and JOB DESCRIPTION

Include:
- core technologies
- specialization
- systems/products/workflows
- business or user impact

Rules:
- Specific over generic
- Vary sentence structure
- Every sentence should include:
  - technology,
  - implementation context,
  - or engineering outcome
- Keep AI-tool mentions minimal and workflow-related

Avoid:
- biography tone
- vague claims
- corporate buzzwords
- repetitive openings

---

SKILLS

- 6–8 technical categories
- >=8 skills per category
- Prioritize JOB DESCRIPTION relevance without mirroring it too closely
- Include adjacent, foundational, and ecosystem technologies a senior engineer would realistically know
- Uneven category sizes allowed
- Order by strength/relevance

Include where relevant:
- testing
- CI/CD
- observability

Rules:
- Use specific technologies only
- Reflect realistic senior-engineer depth and accumulated experience
- Include adjacent/relevant technologies beyond the JD
- Historically plausible stacks only
- Avoid soft skills, fake tools, duplicates, generic concepts, and excessive JD keyword matching
- Keep AI-tool mentions minimal and natural

---

EXPERIENCE

- Reverse chronological order
- Use ROLE PLAN titles
- First 2 roles: 8–10 bullets
- Remaining roles: 6–8 bullets

Bullet Rules:
- 18–30 words
- Past tense
- Natural sentence ending with period
- Vary structure, density, and verbs

Each bullet should show:
- implementation detail
- technical context
- user/business/operational impact

Reference where relevant:
- APIs
- pipelines
- schemas
- queues
- caching
- auth
- CI/CD
- monitoring
- testing
- dashboards
- onboarding
- reporting
- integrations
- operational tooling

Realism:
- Use company/domain-specific language
- Include concrete implementation details
- Mix feature work with debugging, migration, scaling, reliability, optimization, refactoring, maintenance, incident prevention, and operational issues
- Include occasional edge cases or engineering quirks:
  - stale caches
  - retry handling
  - malformed payloads
  - flaky tests
  - async failures
  - webhook ordering
  - pagination bottlenecks
  - duplicate records
  - timeout spikes
  - state sync bugs
  - legacy compatibility
- Include realistic tradeoffs or temporary fixes where relevant
- Avoid over-packing technologies into single bullets
- Technologies must match historical timeframe
- AI-tool mentions must support real workflows
- Include 1–2 memorable engineering situations across the resume

Additional Rules:
- At least 30% of bullets should involve product features, workflows, customer-facing functionality, or cross-functional collaboration
- Use metrics sparingly and realistically
- Prefer operational scale/context over repeated percentages
- Earlier roles → implementation-heavy
- Later roles → ownership/architecture-heavy
- Allow occasional simpler bullets for realism

Avoid:
- generic SaaS bullets
- repetitive templates
- vague claims
- overly polished achievements
- repeated wording/buzzwords

---

EDUCATION

Include:
- degree
- institution
- graduation year

---

FORMATTING

- No markdown headings (#, ##, ###)
- No bold formatting
- Use plain section titles only:
  - Summary:
  - Technical Skills:
  - Experience:
  - Education:

Format:

\`\`\`markdown
[HEADLINE]
[Candidate Name]

[Contact Info]

Summary:
{summary}

Technical Skills:
• Category: skills

Experience:
[Title] at [Company] : [Dates]
• bullet

Education:
[Degree] | [Institution] | [Year]
\`\`\`

---

STRICT

- Output ONLY final resume
- No commentary or placeholders
- Preserve exact forms:
  - CI/CD
  - Node.js
  - C++
  - API Gateway
  - %
`.trim();

const DEFAULT_TARGET_TITLE = 'Senior Software Engineer';

/** Plain-text resume has no `.experience`; approximate role count for the prompt. */
function experienceCountFromResumeText(resumeText: string): number {
  const lines = resumeText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const roleLike = lines.filter(
    (l) => /\bat\b/i.test(l) && /(\d{4}|present|current)/i.test(l) && l.length > 12
  );
  const n = roleLike.length;
  return Math.min(Math.max(n || 1, 1), 20);
}

/** Split/join avoids RegExp replacement rules when `value` contains `$` or `&`. */
function substituteLiteral(haystack: string, needle: string, value: string): string {
  return haystack.split(needle).join(value);
}

function applyPromptPlaceholders(
  template: string,
  profileData: string,
  jobDescWrapped: string,
  titleForPrompt: string
): string {
  const expCount = String(experienceCountFromResumeText(profileData));
  let out = template;
  // Longer / more specific tokens first so `${profileData}` does not truncate `${profileData.experience.length}`
  out = substituteLiteral(out, '${profileData.experience.length}', expCount);
  out = substituteLiteral(out, '${jobDescription}', jobDescWrapped);
  out = substituteLiteral(out, '${targetTitle}', titleForPrompt);
  out = substituteLiteral(out, '${baseResume}', profileData);
  out = substituteLiteral(out, '${profileData}', profileData);
  return out;
}

// Helper to build OpenAI prompt (profileData = resume text from selected profile)
export function buildPrompt(
  profileData: string,
  jobDescription: string,
  customPrompt?: string,
  targetTitle?: string
) {
  const jobDescWrapped = `{${jobDescription}}`;
  const titleForPrompt = (targetTitle != null && String(targetTitle).trim() !== ''
    ? String(targetTitle).trim()
    : DEFAULT_TARGET_TITLE);

  if (customPrompt) {
    return applyPromptPlaceholders(customPrompt, profileData, jobDescWrapped, titleForPrompt);
  }

  return applyPromptPlaceholders(DEFAULT_PROMPT_TEMPLATE, profileData, jobDescWrapped, titleForPrompt);
}

