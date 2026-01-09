import { PDFDocument, PDFFont, PDFPage, RGB, rgb } from 'pdf-lib';

// Shared interface for template rendering
export interface TemplateContext {
  pdfDoc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  fontBold: PDFFont;
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
  // Matches various phone formats:
  // +1 415 966 0362, +1-415-966-0362, (415) 966-0362, 415-966-0362, 415.966.0362, etc.
  const phoneRegex = /^[\+]?[\d\s\-\(\)\.]{10,}$/;
  const cleaned = text.replace(/[\s\-\(\)\.]/g, '');
  // Should have at least 10 digits
  return phoneRegex.test(text) && /\d{10,}/.test(cleaned);
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
    
    if (!result.phone && isValidPhone(line)) {
      result.phone = line;
      continue;
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
  const words = text.split(' ');
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
  // Split by ** for bold
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
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

// Color constants
export const COLORS = {
  BLACK: rgb(0, 0, 0),
  MEDIUM_GRAY: rgb(0.4, 0.4, 0.4),
  LIGHT_GRAY: rgb(0.6, 0.6, 0.6),
  DARK_GRAY: rgb(0.3, 0.3, 0.3),
};

