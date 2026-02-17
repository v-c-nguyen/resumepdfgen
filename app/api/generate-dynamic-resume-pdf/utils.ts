import { PDFDocument, PDFFont, PDFPage, RGB, rgb } from 'pdf-lib';

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
    
    // If we hit a section header, this is where body starts
    if (line.endsWith(':')) {
      bodyStart = index;
      break;
    }
    
    // Check for clearly identifiable fields (only if not already found)
    if (!result.email && isValidEmail(line)) {
      result.email = line;
      continue;
    }
    
    if (!result.phone) {
      const extracted = extractPhoneFromLine(line);
      if (extracted) {
        result.phone = extracted;
        continue;
      }
      // Composite line (e.g. "Email | City | 415-966-0362"): split by | and check each segment
      if (line.includes('|')) {
        for (const segment of line.split('|').map((s) => s.trim())) {
          if (isValidPhone(segment)) {
            result.phone = segment;
            break;
          }
        }
      }
      if (result.phone) continue;
    }
    
    if (!result.linkedin && isValidLinkedIn(line)) {
      result.linkedin = line;
      continue;
    }
    
    if (!result.location && isValidLocation(line)) {
      result.location = line;
      continue;
    }
    
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
  const words = safe.split(' ');
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

