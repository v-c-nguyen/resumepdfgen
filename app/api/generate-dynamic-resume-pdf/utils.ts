import { PDFArray, PDFDocument, PDFFont, PDFName, PDFPage, PDFString, RGB, rgb } from 'pdf-lib';

// Shared interface for template rendering
export interface TemplateContext {
  pdfDoc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  fontBold: PDFFont;
  headline: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  body: string;
  PAGE_WIDTH: number;
  PAGE_HEIGHT: number;
}

// Validation helpers
function isValidEmail(text: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(text.trim());
}

function isValidPhone(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  // Matches various phone formats:
  // +1 415 966 0362, +1-415-966-0362, (415) 966-0362, 415-966-0362, 415.966.0362, etc.
  const phoneRegex = /^[\+]?[\d\s\-\(\)\.]{10,}$/;
  const cleaned = t.replace(/[\s\-\(\)\.]/g, '');
  // Should have at least 10 digits
  return phoneRegex.test(t) && /\d{10,}/.test(cleaned);
}

/** Extract a phone substring from a line (e.g. "Phone: 415-966-0362" or segment from "a | 415-966-0362 | b"). */
function extractPhoneFromLine(line: string): string | null {
  const trimmed = line.trim();
  // Label prefix: "Phone:", "phone:", "Tel:", "Mobile:", etc.
  const withLabel = trimmed.replace(/^(phone|tel|mobile|cell|fax)\s*:\s*/i, '').trim();
  if (withLabel !== trimmed && isValidPhone(withLabel)) return withLabel;
  if (isValidPhone(trimmed)) return trimmed;
  // Try to find a phone-like substring (e.g. in "Contact: 415-966-0362" or "Email | 415-966-0362 | City")
  const phoneLike = trimmed.match(/[\+]?[\d\s\-\(\)\.]{10,}/g);
  if (phoneLike) {
    for (const part of phoneLike) {
      if (isValidPhone(part)) return part.trim();
    }
  }
  return null;
}

function isValidLinkedIn(text: string): boolean {
  const linkedinRegex = /^(https?:\/\/)?(www\.)?linkedin\.com\/.+/i;
  return linkedinRegex.test(text.trim());
}

function stripFieldLabel(line: string): string {
  return line
    .replace(/^(contact|email|e-mail|phone|tel|mobile|cell|fax|location|address|linkedin)\s*:\s*/i, '')
    .trim();
}

function extractEmailFromLine(line: string): string | null {
  const trimmed = stripFieldLabel(line);
  if (isValidEmail(trimmed)) return trimmed;
  const emailMatch = trimmed.match(/[^\s@|]+@[^\s@|]+\.[^\s@|]+/);
  if (emailMatch && isValidEmail(emailMatch[0])) return emailMatch[0];
  return null;
}

function extractLinkedInFromLine(line: string): string | null {
  const trimmed = stripFieldLabel(line);
  if (isValidLinkedIn(trimmed)) return trimmed;
  const match = trimmed.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/\S+/i);
  return match ? match[0].trim() : null;
}

type ParsedContactFields = {
  email: string;
  phone: string;
  location: string;
  linkedin: string;
};

/** Extract contact fields from a line, including pipe-separated "Contact: a | b | c" rows. */
function applyContactFromLine(line: string, result: ParsedContactFields): void {
  const withoutContactPrefix = line.replace(/^contact\s*:\s*/i, '').trim();
  const segments = withoutContactPrefix.includes('|')
    ? withoutContactPrefix.split('|').map((s) => s.trim())
    : [withoutContactPrefix];

  for (const segment of segments) {
    if (!segment) continue;

    if (!result.email) {
      const email = extractEmailFromLine(segment);
      if (email) {
        result.email = email;
        continue;
      }
    }

    if (!result.phone) {
      const phone = extractPhoneFromLine(segment);
      if (phone) {
        result.phone = phone;
        continue;
      }
    }

    if (!result.linkedin) {
      const linkedin = extractLinkedInFromLine(segment);
      if (linkedin) {
        result.linkedin = linkedin;
        continue;
      }
    }

    if (!result.location && isValidLocation(stripFieldLabel(segment))) {
      result.location = stripFieldLabel(segment);
    }
  }
}

function isValidLocation(text: string): boolean {
  // Location typically has city, state or city, country format
  // Should not be an email, phone, or URL
  if (isValidEmail(text) || isValidPhone(text) || isValidLinkedIn(text)) {
    return false;
  }
  // Should contain letters and possibly commas, spaces, hyphens
  return /^[a-zA-Z\s,\-]+$/.test(text.trim()) && text.trim().length > 2;
}

/**
 * Sanitize string for PDF WinAnsi encoding. Standard fonts (Helvetica, etc.) only support
 * WinAnsi (Latin-1–like). Removes Unicode format/control chars (e.g. U+202A LEFT-TO-RIGHT
 * EMBEDDING) and replaces or strips others that would cause "WinAnsi cannot encode" errors.
 */
export function sanitizeForPdfText(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069]/g, '') // bidirectional/format controls
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u2013|\u2014/g, '-')
    .replace(/\u2022/g, '\u00B7') // bullet • → middle dot · (in WinAnsi)
    .replace(/[^\x00-\xFF]/g, ''); // remove any remaining non–Latin-1
}

// Helper to parse resume text with validation
export function parseResume(resumeText: string): {
  headline: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  body: string;
} {
  const lines = resumeText.split('\n');
  const result = {
    headline: '',
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    body: ''
  };
  
  // Get first two non-empty lines as headline and name
  const nonEmptyLines: Array<{ line: string; index: number }> = [];
  for (let idx = 0; idx < lines.length; idx++) {
    const trimmed = lines[idx].trim();
    if (trimmed) {
      nonEmptyLines.push({ line: trimmed, index: idx });
    }
  }
  
  // First line = headline, Second line = name
  if (nonEmptyLines.length > 0) {
    result.headline = nonEmptyLines[0].line;
  }
  if (nonEmptyLines.length > 1) {
    result.name = nonEmptyLines[1].line;
  }
  
  // Extract and validate email, phone, location, linkedin from remaining lines
  const maxFieldsToCheck = 15; // Check up to 15 lines for personal info
  let bodyStart = 0;
  
  for (let idx = 2; idx < Math.min(nonEmptyLines.length, maxFieldsToCheck + 2); idx++) {
    const { line, index } = nonEmptyLines[idx];
    
    // Section header (but not "Contact: email | ..." composite rows)
    if (line.endsWith(':') && !/^contact\s*:/i.test(line) && !line.includes('|')) {
      bodyStart = index;
      break;
    }

    applyContactFromLine(line, result);
    if (result.email && result.phone && result.location && result.linkedin) continue;
    
    // If we hit body content markers, stop
    if (line.startsWith('•') || line.startsWith('·') || line.startsWith('-')) {
      bodyStart = index;
      break;
    }
  }
  
  // If we didn't find a section header, find the first line that looks like body content
  if (bodyStart === 0) {
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx].trim();
      if (line && (line.endsWith(':') || line.startsWith('•') || line.startsWith('·') || line.startsWith('-'))) {
        bodyStart = idx;
        break;
      }
    }
    // If still no body start found, start after reasonable number of header lines
    if (bodyStart === 0) {
      bodyStart = Math.min(maxFieldsToCheck + 2, lines.length);
    }
  }
  
  // Skip empty lines at the start of body
  while (bodyStart < lines.length && !lines[bodyStart].trim()) {
    bodyStart++;
  }
  
  result.body = lines.slice(bodyStart).join('\n');

  // Sanitize all fields for PDF WinAnsi encoding (avoids "WinAnsi cannot encode" errors)
  result.headline = sanitizeForPdfText(result.headline);
  result.name = sanitizeForPdfText(result.name);
  result.email = sanitizeForPdfText(result.email);
  result.phone = sanitizeForPdfText(result.phone);
  result.location = sanitizeForPdfText(result.location);
  result.linkedin = sanitizeForPdfText(result.linkedin);
  result.body = sanitizeForPdfText(result.body);

  return result;
}

// Helper to convert date format from MM/YYYY to MMM YYYY
export function formatDate(dateStr: string): string {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Handle different date formats
  if (dateStr.includes('–') || dateStr.includes('-')) {
    // Split by dash and format each part
    const parts = dateStr.split(/[–-]/).map(part => part.trim());
    return parts.map(part => {
      if (part.match(/^\d{2}\/\d{4}$/)) {
        const [month, year] = part.split('/');
        const monthIndex = parseInt(month) - 1;
        return `${monthNames[monthIndex]} ${year}`;
      }
      return part; // Return as-is if not in MM/YYYY format
    }).join(' – ');
  } else if (dateStr.match(/^\d{2}\/\d{4}$/)) {
    // Single date in MM/YYYY format
    const [month, year] = dateStr.split('/');
    const monthIndex = parseInt(month) - 1;
    return `${monthNames[monthIndex]} ${year}`;
  }

  return dateStr; // Return as-is if not in expected format
}

// Helper to wrap text within a max width
export function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const safe = sanitizeForPdfText(text);
  const words = safe.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';
  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
    const testWidth = font.widthOfTextAtSize(testLine, size);
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Slack so skills lines do not wrap when widthOfTextAtSize is slightly stricter than visible fit
 * (e.g. after a bold category prefix on the same row).
 */
export const PDF_SKILLS_WRAP_TOLERANCE_PT = 2.5;

/**
 * Word wrap with a narrower first line and wider continuation lines (skills share row with label).
 */
export function wrapTextWithLineWidths(
  text: string,
  font: PDFFont,
  size: number,
  firstLineMaxWidth: number,
  continuationMaxWidth: number,
  tolerancePt: number = PDF_SKILLS_WRAP_TOLERANCE_PT
): string[] {
  const safe = sanitizeForPdfText(text);
  const words = safe.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';
  let lineIndex = 0;

  const widthLimit = (idx: number) =>
    (idx === 0 ? firstLineMaxWidth : continuationMaxWidth) + tolerancePt;

  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word;
    const testWidth = font.widthOfTextAtSize(testLine, size);
    if (testWidth <= widthLimit(lineIndex) || !currentLine) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      lineIndex++;
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/** Wrap skills text after "Category:" using the same geometry as draw positions. */
export function wrapSkillsAfterCategory(
  skillsText: string,
  font: PDFFont,
  bodySize: number,
  layout: {
    left: number;
    bodyInsetLeft: number;
    contentWidth: number;
    bodyInnerSubtract: number;
    bulletWidth: number;
    categoryWidth: number;
    spaceWidth: number;
  }
): string[] {
  const {
    left,
    bodyInsetLeft,
    contentWidth,
    bodyInnerSubtract,
    bulletWidth,
    categoryWidth,
    spaceWidth,
  } = layout;
  const bodyTextRight = left + bodyInsetLeft + (contentWidth - bodyInnerSubtract);
  const skillsFirstLineStartX =
    left + bodyInsetLeft + bulletWidth + categoryWidth + spaceWidth;
  const firstLineWidth = bodyTextRight - skillsFirstLineStartX;
  const continuationStartX = left + bodyInsetLeft + bulletWidth;
  const continuationWidth = bodyTextRight - continuationStartX;
  return wrapTextWithLineWidths(
    skillsText,
    font,
    bodySize,
    firstLineWidth,
    continuationWidth
  );
}

// Helper to wrap text with proper indentation for lines starting with prefixes (like '- ' or '· ')
export function wrapTextWithIndent(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): { lines: string[]; prefix: string; indentWidth: number } {
  // Convert '-' to '•' (bullet) for consistency
  const normalizedText = text.replace(/^(-\s+)/, '• ');
  
  // Detect common prefixes
  const prefixMatch = normalizedText.match(/^([\-\·•]\s+)/);
  const prefix = prefixMatch ? prefixMatch[1] : '';
  const content = prefix ? normalizedText.slice(prefix.length) : normalizedText;
  
  // Calculate prefix width for indentation
  const prefixWidth = prefix ? font.widthOfTextAtSize(prefix, size) : 0;
  
  // Wrap the content part
  const wrappedContent = wrapText(content, font, size, maxWidth - prefixWidth);
  
  // Build lines with prefix on first line only
  const lines: string[] = [];
  wrappedContent.forEach((line, index) => {
    if (index === 0) {
      lines.push(prefix + line);
    } else {
      lines.push(line);
    }
  });
  
  return {
    lines,
    prefix,
    indentWidth: prefixWidth
  };
}

// Helper to draw text with bold segments (markdown **bold**)
export function drawTextWithBold(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  fontBold: PDFFont,
  size: number,
  color: RGB
) {
  const safe = sanitizeForPdfText(text);
  const parts = safe.split(/(\*\*[^*]+\*\*)/g);
  let offsetX = x;
  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      const content = part.slice(2, -2);
      page.drawText(content, { x: offsetX, y, size, font: fontBold, color });
      offsetX += fontBold.widthOfTextAtSize(content, size);
    } else {
      page.drawText(part, { x: offsetX, y, size, font, color });
      offsetX += font.widthOfTextAtSize(part, size);
    }
  }
}

/** WinAnsi-safe bullet for PDF (middle dot ·). Use instead of Unicode • to avoid encoding errors. */
export const PDF_BULLET = '\u00B7';

/** Slight size multiplier to make bullets visually a bit larger than body text. */
export const PDF_BULLET_SIZE_MULTIPLIER = 1.5;

// Color constants
export const COLORS = {
  BLACK: rgb(0, 0, 0),
  MEDIUM_GRAY: rgb(0.4, 0.4, 0.4),
  LIGHT_GRAY: rgb(0.6, 0.6, 0.6),
  DARK_GRAY: rgb(0.3, 0.3, 0.3),
};

export const LINKEDIN_LABEL = 'LinkedIn';
export const PDF_LINK_COLOR = rgb(0.05, 0.25, 0.75);

export type LinkedInContactAlign = 'left' | 'center' | 'right';

export function normalizeLinkedInUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function appendUriLinkAnnotation(
  pdfDoc: PDFDocument,
  page: PDFPage,
  rect: [number, number, number, number],
  url: string
): void {
  const linkAnnotation = pdfDoc.context.register(
    pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: rect,
      Border: [0, 0, 0],
      A: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of(url),
      },
    })
  );

  const existingAnnots = page.node.lookup(PDFName.of('Annots'), PDFArray);
  if (existingAnnots) {
    existingAnnots.push(linkAnnotation);
  } else {
    page.node.set(PDFName.of('Annots'), pdfDoc.context.obj([linkAnnotation]));
  }
}

function linkRectForText(x: number, y: number, width: number, size: number): [number, number, number, number] {
  const padding = 2;
  return [x, y - padding, x + width, y + size + padding];
}

function resolveAlignedX(
  align: LinkedInContactAlign,
  textWidth: number,
  left: number,
  right: number,
  pageWidth?: number,
  blockWidth?: number
): number {
  if (align === 'left') return left;
  if (align === 'right') return right - textWidth;
  if (blockWidth !== undefined) {
    const blockStartX = pageWidth !== undefined
      ? (pageWidth - blockWidth) / 2
      : left + (right - left - blockWidth) / 2;
    return blockStartX + (blockWidth - textWidth) / 2;
  }
  if (pageWidth !== undefined) return (pageWidth - textWidth) / 2;
  return left + (right - left - textWidth) / 2;
}

function measureTextLineWidth(line: string, font: PDFFont, size: number): number {
  return font.widthOfTextAtSize(line, size);
}

export interface DrawContactInfoOptions {
  pdfDoc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  location?: string;
  phone?: string;
  email?: string;
  linkedinUrl?: string;
  y: number;
  size: number;
  separator: string;
  align: LinkedInContactAlign;
  layout?: 'inline' | 'stacked';
  left?: number;
  right?: number;
  pageWidth?: number;
  maxWidth?: number;
  textColor?: RGB;
  linkColor?: RGB;
  lineGapMultiplier?: number;
}

function drawClickableLinkedInLabel(
  pdfDoc: PDFDocument,
  page: PDFPage,
  font: PDFFont,
  x: number,
  y: number,
  size: number,
  linkColor: RGB,
  href: string
): void {
  const labelWidth = font.widthOfTextAtSize(LINKEDIN_LABEL, size);
  page.drawText(LINKEDIN_LABEL, { x, y, size, font, color: linkColor });
  appendUriLinkAnnotation(pdfDoc, page, linkRectForText(x, y, labelWidth, size), href);
}

function drawContactTextLine(
  page: PDFPage,
  font: PDFFont,
  line: string,
  x: number,
  y: number,
  size: number,
  textColor: RGB,
  linkColor: RGB,
  pdfDoc: PDFDocument,
  linkedinUrl?: string
): void {
  const href = linkedinUrl ? normalizeLinkedInUrl(linkedinUrl) : '';
  const linkedinIndex = href ? line.indexOf(LINKEDIN_LABEL) : -1;

  if (linkedinIndex >= 0) {
    let cursorX = x;
    const before = line.slice(0, linkedinIndex);
    const after = line.slice(linkedinIndex + LINKEDIN_LABEL.length);
    if (before) {
      page.drawText(before, { x: cursorX, y, size, font, color: textColor });
      cursorX += font.widthOfTextAtSize(before, size);
    }
    drawClickableLinkedInLabel(pdfDoc, page, font, cursorX, y, size, linkColor, href);
    cursorX += font.widthOfTextAtSize(LINKEDIN_LABEL, size);
    if (after) {
      page.drawText(after, { x: cursorX, y, size, font, color: textColor });
    }
    return;
  }

  page.drawText(line, { x, y, size, font, color: textColor });
}

/**
 * Draw contact row(s) with location, phone, email, and an inline clickable "LinkedIn" label.
 * Returns y below the last drawn line.
 */
export function drawContactInfo(options: DrawContactInfoOptions): number {
  const {
    pdfDoc,
    page,
    font,
    location,
    phone,
    email,
    linkedinUrl,
    y: startY,
    size,
    separator,
    align,
    layout = 'inline',
    left = 0,
    right = options.pageWidth ?? 595,
    pageWidth,
    maxWidth,
    textColor = COLORS.MEDIUM_GRAY,
    linkColor = PDF_LINK_COLOR,
    lineGapMultiplier = 1.3,
  } = options;

  const parts = [location, phone, email].filter((part): part is string => Boolean(part));
  const href = linkedinUrl ? normalizeLinkedInUrl(linkedinUrl) : '';
  if (parts.length === 0 && !href) return startY;

  if (layout === 'stacked') {
    let y = startY;
    for (const part of parts) {
      const textWidth = font.widthOfTextAtSize(part, size);
      const x = resolveAlignedX('right', textWidth, left, right, pageWidth);
      page.drawText(part, { x, y, size, font, color: textColor });
      y -= size * lineGapMultiplier;
    }
    if (href) {
      const labelWidth = font.widthOfTextAtSize(LINKEDIN_LABEL, size);
      const x = resolveAlignedX('right', labelWidth, left, right, pageWidth);
      drawClickableLinkedInLabel(pdfDoc, page, font, x, y, size, linkColor, href);
    }
    return startY;
  }

  const textOnlyLine = parts.join(separator);
  const linkedinSuffix = href ? (parts.length > 0 ? separator : '') + LINKEDIN_LABEL : '';
  const fullLine = textOnlyLine + linkedinSuffix;
  const wrapWidth = maxWidth ?? right - left;
  const lines = wrapText(fullLine, font, size, wrapWidth);
  const lineWidths = lines.map((line) => measureTextLineWidth(line, font, size));
  const blockWidth = align === 'center' ? Math.max(...lineWidths, 0) : undefined;

  let y = startY;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineWidth = lineWidths[i];
    const startX = resolveAlignedX(align, lineWidth, left, right, pageWidth, blockWidth);
    const lineHasLinkedIn = href ? line.includes(LINKEDIN_LABEL) : false;
    drawContactTextLine(
      page,
      font,
      line,
      startX,
      y,
      size,
      textColor,
      linkColor,
      pdfDoc,
      lineHasLinkedIn ? linkedinUrl : undefined
    );
    y -= size * lineGapMultiplier;
  }

  return y;
}

