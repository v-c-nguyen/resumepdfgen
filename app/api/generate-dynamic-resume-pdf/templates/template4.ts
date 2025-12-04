import { PDFPage, rgb } from 'pdf-lib';
import { TemplateContext, wrapText, wrapTextWithIndent, formatDate, drawTextWithBold, COLORS } from '../utils';

// Template 4 Body Content Renderer - Creative style with decorative elements
function renderBodyContentTemplate4(
  context: TemplateContext,
  y: number,
  left: number,
  right: number,
  contentWidth: number,
  bodySize: number,
  bodyLineHeight: number,
  sectionHeaderSize: number,
  sectionLineHeight: number,
  marginBottom: number
): number {
  const { font, fontBold, body, PAGE_HEIGHT, PAGE_WIDTH, pdfDoc } = context;
  const BLACK = COLORS.BLACK;
  const MEDIUM_GRAY = COLORS.MEDIUM_GRAY;
  const EMERALD = rgb(0.1, 0.6, 0.4); // Emerald green accent
  const LIGHT_EMERALD = rgb(0.95, 0.98, 0.96); // Light emerald background
  
  const bodyLines = body.split('\n');
  let firstJob = true;
  
  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i].trim();
    if (!line) {
      y -= 6;
      continue;
    }
    
    if (line.endsWith(':')) {
      y -= 20;
      const sectionHeader = line.slice(0, -1);
      const sectionLines = wrapText(sectionHeader, fontBold, sectionHeaderSize, contentWidth - 40);
      
      for (const sectionLine of sectionLines) {
        if (y < marginBottom) {
          context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          // Draw bottom accent bar on new pages
          context.page.drawRectangle({
            x: 0,
            y: 0,
            width: PAGE_WIDTH,
            height: 20,
            color: EMERALD,
          });
          y = PAGE_HEIGHT - 72;
        }
        
        // Draw decorative left border line
        context.page.drawLine({
          start: { x: left, y: y + sectionHeaderSize },
          end: { x: left, y: y - 4 },
          thickness: 3,
          color: EMERALD,
        });
        
        // Section header text with decorative underline
        context.page.drawText(sectionLine, { 
          x: left + 12, 
          y, 
          size: sectionHeaderSize, 
          font: fontBold, 
          color: BLACK 
        });
        
        // Decorative underline (not full width)
        const textWidth = fontBold.widthOfTextAtSize(sectionLine, sectionHeaderSize);
        context.page.drawLine({
          start: { x: left + 12, y: y - 6 },
          end: { x: left + 12 + textWidth, y: y - 6 },
          thickness: 2,
          color: EMERALD,
        });
        
        y -= sectionLineHeight + 4;
      }
    } else {
      // Check for job experience line - handle both formats: with/without colon, with/without asterisks
      // Format 1: "Job Title at Company: Period"
      // Format 2: "*Job Title at Company, Location**" (period on next line)
      const isJobExperience = / at .+/.test(line);
      
      if (isJobExperience) {
        // Strip leading/trailing asterisks from the line
        const cleanLine = line.replace(/^\*+/, '').replace(/\*+$/, '');
        
        // Try to match format with colon (period on same line)
        let match = cleanLine.match(/^(.+?) at (.+?):\s*(.+)$/);
        let jobTitle: string;
        let companyName: string;
        let period: string;
        
        if (match) {
          // Format with colon - period on same line
          [, jobTitle, companyName, period] = match;
        } else {
          // Format without colon - period might be on next line
          match = cleanLine.match(/^(.+?) at (.+)$/);
          if (match) {
            [, jobTitle, companyName] = match;
            // Check next line for period
            if (i + 1 < bodyLines.length) {
              const nextLine = bodyLines[i + 1].trim();
              // Check if next line looks like a date period
              if (/^\d{2}\/\d{4}/.test(nextLine) || /^\d{4}/.test(nextLine) || nextLine.includes('–') || nextLine.includes('-')) {
                period = nextLine;
                i++; // Skip the next line since we've consumed it
              } else {
                period = '';
              }
            } else {
              period = '';
            }
          } else {
            // Couldn't parse, skip this line
            continue;
          }
        }
        
        // Clean up any remaining asterisks from jobTitle and companyName
        jobTitle = jobTitle.trim().replace(/^\*+/, '').replace(/\*+$/, '');
        companyName = companyName.trim().replace(/^\*+/, '').replace(/\*+$/, '');
        
        if (!firstJob) {
          y -= 16;
        }
        firstJob = false;
        
        // Job title with emerald accent dot
        const titleLines = wrapText(jobTitle, fontBold, bodySize + 2, contentWidth - 30);
        for (const titleLine of titleLines) {
          if (y < marginBottom) {
            context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            context.page.drawRectangle({
              x: 0,
              y: 0,
              width: PAGE_WIDTH,
              height: 20,
              color: EMERALD,
            });
            y = PAGE_HEIGHT - 72;
          }
          // Draw emerald circle before title
          context.page.drawCircle({
            x: left + 20,
            y: y + (bodySize + 2) / 2,
            size: 4,
            color: EMERALD,
          });
          drawTextWithBold(context.page, titleLine, left + 32, y, font, fontBold, bodySize + 2, BLACK);
          y -= bodyLineHeight + 3;
        }
        
        // Company and period with emerald separator
        if (period) {
          const formattedPeriod = formatDate(period.trim());
          const companyPeriodLine = `${companyName}  •  ${formattedPeriod}`;
          const companyPeriodLines = wrapText(companyPeriodLine, font, bodySize, contentWidth - 30);
          for (const line of companyPeriodLines) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              context.page.drawRectangle({
                x: 0,
                y: 0,
                width: PAGE_WIDTH,
                height: 20,
                color: EMERALD,
              });
              y = PAGE_HEIGHT - 72;
            }
            drawTextWithBold(context.page, line, left + 32, y, font, fontBold, bodySize, MEDIUM_GRAY);
            y -= bodyLineHeight;
          }
        } else {
          // Just company name if no period
          const companyLines = wrapText(companyName, font, bodySize, contentWidth - 30);
          for (const line of companyLines) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              context.page.drawRectangle({
                x: 0,
                y: 0,
                width: PAGE_WIDTH,
                height: 20,
                color: EMERALD,
              });
              y = PAGE_HEIGHT - 72;
            }
            drawTextWithBold(context.page, line, left + 32, y, font, fontBold, bodySize, MEDIUM_GRAY);
            y -= bodyLineHeight;
          }
        }
        
        y -= 8;
      } else {
        const isSkillsCategory = line.startsWith('·');
        if (isSkillsCategory) {
          const categoryName = line.trim();
          const categoryLines = wrapText(categoryName, fontBold, bodySize + 1, contentWidth - 30);
          for (const categoryLine of categoryLines) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              context.page.drawRectangle({
                x: 0,
                y: 0,
                width: PAGE_WIDTH,
                height: 20,
                color: EMERALD,
              });
              y = PAGE_HEIGHT - 72;
            }
            context.page.drawText(categoryLine, { 
              x: left + 32, 
              y, 
              size: bodySize + 1, 
              font: fontBold, 
              color: BLACK 
            });
            y -= bodyLineHeight + 2;
          }
        } else {
          const wrapped = wrapTextWithIndent(line, font, bodySize, contentWidth - 30);
          for (let i = 0; i < wrapped.lines.length; i++) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              context.page.drawRectangle({
                x: 0,
                y: 0,
                width: PAGE_WIDTH,
                height: 20,
                color: EMERALD,
              });
              y = PAGE_HEIGHT - 72;
            }
            const xPos = i === 0 ? left + 32 : left + 32 + wrapped.indentWidth;
            drawTextWithBold(context.page, wrapped.lines[i], xPos, y, font, fontBold, bodySize, BLACK);
            y -= bodyLineHeight;
          }
        }
      }
    }
    
    if (y < marginBottom) {
      context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      context.page.drawRectangle({
        x: 0,
        y: 0,
        width: PAGE_WIDTH,
        height: 20,
        color: EMERALD,
      });
      y = PAGE_HEIGHT - 72;
    }
  }
  
  return y;
}

// CREATIVE TEMPLATE - Centered layout with bottom accent bar and decorative elements
export async function renderTemplate4(context: TemplateContext): Promise<Uint8Array> {
  const { pdfDoc, page, font, fontBold, name, email, phone, location, PAGE_WIDTH, PAGE_HEIGHT } = context;
  const BLACK = COLORS.BLACK;
  const MEDIUM_GRAY = COLORS.MEDIUM_GRAY;
  const EMERALD = rgb(0.1, 0.6, 0.4); // Emerald green accent color
  const LIGHT_EMERALD = rgb(0.95, 0.98, 0.96); // Light emerald background
  
  const MARGIN_TOP = 80;
  const MARGIN_BOTTOM = 70; // Extra space for bottom bar
  const MARGIN_LEFT = 70;
  const MARGIN_RIGHT = 70;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  
  const NAME_SIZE = 30;
  const CONTACT_SIZE = 9.5;
  const SECTION_HEADER_SIZE = 14;
  const BODY_SIZE = 10;
  
  // Draw bottom accent bar
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: 20,
    color: EMERALD,
  });
  
  let y = PAGE_HEIGHT - MARGIN_TOP;
  const left = MARGIN_LEFT;
  const right = PAGE_WIDTH - MARGIN_RIGHT;
  
  // Name (centered, emerald color, larger)
  if (name) {
    const nameLines = wrapText(name, fontBold, NAME_SIZE, CONTENT_WIDTH);
    for (const line of nameLines) {
      const textWidth = fontBold.widthOfTextAtSize(line, NAME_SIZE);
      const centerX = (PAGE_WIDTH - textWidth) / 2;
      page.drawText(line, { 
        x: centerX, 
        y, 
        size: NAME_SIZE, 
        font: fontBold, 
        color: EMERALD 
      });
      y -= NAME_SIZE * 0.9;
    }
    y -= 16;
  }
  
  // Contact info (centered, with decorative emerald dots)
  const contactParts = [location, phone, email].filter(Boolean);
  if (contactParts.length > 0) {
    const contactLine = contactParts.join('  •  ');
    const contactLines = wrapText(contactLine, font, CONTACT_SIZE, CONTENT_WIDTH);
    for (const line of contactLines) {
      const textWidth = font.widthOfTextAtSize(line, CONTACT_SIZE);
      const centerX = (PAGE_WIDTH - textWidth) / 2;
      page.drawText(line, { 
        x: centerX, 
        y, 
        size: CONTACT_SIZE, 
        font, 
        color: MEDIUM_GRAY 
      });
      y -= CONTACT_SIZE * 1.4;
    }
    y -= 24;
  }
  
  // Decorative horizontal line with emerald accents
  const lineY = y;
  const lineStartX = left + 50;
  const lineEndX = right - 50;
  
  // Left emerald dot
  page.drawCircle({
    x: lineStartX,
    y: lineY,
    size: 3,
    color: EMERALD,
  });
  
  // Center line
  page.drawLine({
    start: { x: lineStartX + 8, y: lineY },
    end: { x: lineEndX - 8, y: lineY },
    thickness: 1,
    color: MEDIUM_GRAY,
  });
  
  // Right emerald dot
  page.drawCircle({
    x: lineEndX,
    y: lineY,
    size: 3,
    color: EMERALD,
  });
  
  y -= 28;
  
  // Render body content
  y = renderBodyContentTemplate4(
    context, 
    y, 
    left, 
    right, 
    CONTENT_WIDTH, 
    BODY_SIZE, 
    BODY_SIZE * 1.5, 
    SECTION_HEADER_SIZE, 
    SECTION_HEADER_SIZE * 1.4, 
    MARGIN_BOTTOM
  );
  
  return await pdfDoc.save();
}
