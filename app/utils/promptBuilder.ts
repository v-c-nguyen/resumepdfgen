/**
 * Default prompt template used when building prompts with a job description.
 * Placeholders: ${profileData} (resume text from selected profile) and ${jobDescription}
 */
export const DEFAULT_PROMPT_TEMPLATE = `
You are a world-class ATS optimization expert. Create a resume that scores 95–100% on ATS.

🚨 CRITICAL OUTPUT:
Return ONLY a clean, professional resume in **Markdown** inside a fenced code block labeled 'markdown' so that a "Copy code" button appears in editors like GitHub, GitLab, or VSCode.
- Use the **exact format shown below** (do not add extra lines, separators, or JSON formatting).
- Do NOT include explanations, comments, or any text outside the resume.

### Required Markdown Format:
- Use this exact Markdown style:
'''markdown
[Job Title from JD]
[Candidate Name]

[Email]
[Phone]
[Location]

Summary:
[5–6 line professional summary with domain and JD keywords]

Technical Skills:
• Category: Skill, Skill, Skill
• Category: Skill, Skill, Skill

Experience:
[Job Title] at [Company] : [Start Date] – [End Date]
• Bullet
• Bullet

[Job Title] at [Company] : [Start Date] – [End Date]
• Bullet
• Bullet

Education:
[Degree] | [Institution] | [Year]

---

## PROFILE DATA: \${profileData}
—
## INSTRUCTIONS:

### 1. EXTRACT DOMAIN KEYWORDS (Critical for high ATS score)

Analyze the JD "About Us" and product sections to extract 10–15 domain or compliance keywords specific to the company’s industry.

Rules:
- Only extract keywords explicitly present or clearly implied in the JD
- Do NOT invent regulations, certifications, or compliance frameworks
- Prefer exact phrases used by the employer

Examples by domain:
- Identity/Security: passwordless authentication, zero-trust architecture, OAuth2, JWT, SAML, OpenID Connect, WebAuthn, FIDO2, MFA, SSO, encryption, SOC 2, ISO 27001
- Payments/FinTech: PCI-DSS compliance, payment processing, fraud detection, KYC/AML, tokenization, ACH transfers, reconciliation
- Healthcare: HIPAA compliance, HL7, FHIR, PHI protection, EHR systems, Epic integration, Cerner
- Data/Analytics: data warehousing, data governance, Snowflake, data lake, GDPR compliance, PII protection
- Do NOT ask me questions. Do NOT output intermediate steps. Infer everything silently.

WHERE TO USE:
- Summary: 3–5 domain keywords
- Skills: Dedicated domain category with 8–15 keywords
- Experience: Distribute naturally across bullets per role

---

### 2. TITLE

Generate a clean, standard industry resume headline that reflects the role described in the Job Description, **but never copy the JD title exactly**.

Rules:
- Use a natural, widely recognized title (e.g., Senior Software Engineer, Senior Full Stack Engineer, Senior AI Engineer, Senior ML Engineer,Senior Backend Engineer, Senior QA Engineer).
- Standardize or simplify the JD title by removing modifiers such as “Lead”, “Principal”, “Staff”, “Applied”, “Specialist”, “I/II/III”, “Seniority codes”, or uncommon descriptors.
- If the JD title is overly specific or niche, generalize it into a common industry equivalent.
- Ensure the headline matches the JD’s domain and responsibilities, but is **not identical in wording**.
- Avoid adding seniority that is not clearly supported by the JD.
- Avoid generating titles with company-specific or product-specific language.

Examples (do NOT output examples in the resume):
- “Applied AI Engineer” → Senior AI Engineer  
- “Machine Learning Specialist” → Senior Machine Learning Engineer  
- “Full Stack Engineer II” → Senior Full Stack Engineer  
- “Backend API Developer” → Senior Backend Engineer  
- “Senior Staff Software Developer” → Senior Software Engineer  

---
### 3.  PERSONAL INFORMATION RULES (CRITICAL)
- Use **only** the personal details provided in **PROFILE DATA**.
- If a field is missing or blank, **omit it entirely**. Do not create, guess, or infer any missing information.
- Do not fabricate emails, phone numbers, locations, or formatting variations.
- Output the candidate’s name, email, phone, and location **exactly as provided** and only if they exist.

Examples (do not output examples in the resume):
- Missing phone → no phone line  
- Missing location → no location line

---

### 3. SUMMARY (5–6 lines)

Include 8–12 JD keywords and 3–5 domain keywords total.

Formatting Rules (STRICT):
- Write the entire summary on **one single line**
- Use **5–6 full sentences**
- Separate sentences using **a single space only**
- Do NOT insert line breaks or bullet points
- Do NOT use semicolons to replace sentence structure

Structure:
- Line 1: JD title with \${yearsOfExperience}+ years in JD domain
- Line 2: Expertise in 1–2 domain areas + 3–4 exact JD technologies
- Line 3: Proven impact with 1 domain keyword and a measurable outcome
- Line 4: Proficiency in additional JD tools or methodologies
- Line 5: Soft skill from JD + collaboration or Agile context
- Line 6: Focus on scalability, reliability, or business outcomes

---

### 4. SKILLS

Total skills by seniority:
- Junior/Mid: 40–55
- Senior: 55–70
- Staff/Principal: 50–65 (favor depth over breadth)

Rules:
- 6–7 categories aligned to JD focus
- 8–12 skills per category
- Capitalize first letter of each skill
- No version spam
- Group cloud services (e.g., AWS (Lambda, S3, EC2))
- 70% JD keywords, 30% complementary skills
- Categories must be technically correct

Create domain-specific category when relevant:
- FinTech → Payment & Compliance
- Healthcare → Healthcare Compliance & Standards
- Security → Security & Identity
- Data → Data Governance & Compliance

---

### 5. EXPERIENCE (\${profileData.experience.length} roles)

Requirements:
- Generate exactly \${profileData.experience.length} roles
- Most recent roles: 7–8 bullets
- Older roles: 5–6 bullets
- 20–40 words per bullet
- At least 60–70% of bullets must include a metric
- Prefer non-rounded percentages (33%, 47%, 92%).
- Remaining bullets should emphasize scope, ownership, architecture, or leadership
- Across each role, include 8–12 unique JD keywords total
- Do NOT force multiple JD keywords into a single bullet if it reduces readability
- Ensure all technologies listed were realistically available during that role’s timeframe
- Add industry context to 2–3 bullets per role

Bullet structure:
[Action Verb] + [JD technology] + [what was built] + [business impact] + [metric if applicable]

Use strong action verbs:
Architected, Engineered, Designed, Built, Developed, Implemented, Optimized, Enhanced, Led, Automated, Deployed

Avoid:
Responsible for, Worked on, Tasked with

If employer industry is unknown, default to JD company’s industry or “SaaS platform”.

---

### ATS OPTIMIZATION CHECKLIST

- Use EXACT JD phrases (no synonyms)
- High-priority keywords appear 3–4 times across Summary, Skills, and Experience
- All required and preferred JD skills appear in Skills
- No duplicated bullets or near-identical bullet structures across roles
- No repeated metric phrasing
- Natural, human-written tone (not robotic)
- Do NOT fabricate leadership scope or people management
- If JD is vague, infer responsibilities only when consistent with candidate’s experience

---

Return ONLY a clean, professional resume in **Markdown** inside a fenced code block labeled 'markdown' so that a "Copy code" button appears in editors like GitHub, GitLab, or VSCode.

## JOB DESCRIPTION: \${jobDescription}
`.trim();

// Helper to build OpenAI prompt (profileData = resume text from selected profile)
export function buildPrompt(
  profileData: string,
  jobDescription: string,
  customPrompt?: string
) {
  const jobDescWrapped = `{${jobDescription}}`;
  // If custom prompt is provided, use it with placeholders replaced
  if (customPrompt) {
    return customPrompt
      .replace(/\${baseResume}/g, profileData)
      .replace(/\${profileData}/g, profileData)
      .replace(/\${jobDescription}/g, jobDescWrapped);
  }

  // Otherwise, use the default prompt template
  return DEFAULT_PROMPT_TEMPLATE
    .replace(/\${profileData}/g, profileData)
    .replace(/\${jobDescription}/g, jobDescWrapped);
}

