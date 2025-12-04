import { PDFPage, rgb } from 'pdf-lib';
import { TemplateContext, wrapText, wrapTextWithIndent, formatDate, drawTextWithBold, COLORS } from '../utils';

// Template 7 Body Content Renderer - Refined style with corner accents
function renderBodyContentTemplate8(
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
  const FOREST_GREEN = rgb(0.2, 0.4, 0.3); // Forest green accent color
  
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
      const sectionLines = wrapText(sectionHeader, fontBold, sectionHeaderSize, contentWidth - 50);
      
      for (const sectionLine of sectionLines) {
        if (y < marginBottom) {
          context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          // Draw corner accents on new pages
          const cornerSize = 30;
          // Top-left corner
          context.page.drawRectangle({
            x: 0,
            y: PAGE_HEIGHT - cornerSize,
            width: cornerSize,
            height: cornerSize,
            color: FOREST_GREEN,
          });
          // Top-right corner
          context.page.drawRectangle({
            x: PAGE_WIDTH - cornerSize,
            y: PAGE_HEIGHT - cornerSize,
            width: cornerSize,
            height: cornerSize,
            color: FOREST_GREEN,
          });
          y = PAGE_HEIGHT - 72;
        }
        
        // Section header with elegant underline
        context.page.drawText(sectionLine, { 
          x: left, 
          y, 
          size: sectionHeaderSize, 
          font: fontBold, 
          color: BLACK 
        });
        
        // Elegant underline
        const textWidth = fontBold.widthOfTextAtSize(sectionLine, sectionHeaderSize);
        context.page.drawLine({
          start: { x: left, y: y - 8 },
          end: { x: left + textWidth, y: y - 8 },
          thickness: 2,
          color: FOREST_GREEN,
        });
        
        y -= sectionLineHeight + 8;
      }
    } else {
      const isJobExperience = / at .+:.+/.test(line);
      
      if (isJobExperience) {
        const match = line.match(/^(.+?) at (.+?):\s*(.+)$/);
        if (match) {
          const [, jobTitle, companyName, period] = match;
          
          if (!firstJob) {
            y -= 16;
          }
          firstJob = false;
          
          // Job title (bold, forest green)
          const titleLines = wrapText(jobTitle.trim(), fontBold, bodySize + 1, contentWidth - 20);
          for (const titleLine of titleLines) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              const cornerSize = 30;
              context.page.drawRectangle({
                x: 0,
                y: PAGE_HEIGHT - cornerSize,
                width: cornerSize,
                height: cornerSize,
                color: FOREST_GREEN,
              });
              context.page.drawRectangle({
                x: PAGE_WIDTH - cornerSize,
                y: PAGE_HEIGHT - cornerSize,
                width: cornerSize,
                height: cornerSize,
                color: FOREST_GREEN,
              });
              y = PAGE_HEIGHT - 72;
            }
            context.page.drawText(titleLine, { 
              x: left + 20, 
              y, 
              size: bodySize + 1, 
              font: fontBold, 
              color: FOREST_GREEN 
            });
            y -= bodyLineHeight + 2;
          }
          
          // Company and period
          const formattedPeriod = formatDate(period.trim());
          const companyPeriodLine = `${companyName.trim()}  •  ${formattedPeriod}`;
          const companyPeriodLines = wrapText(companyPeriodLine, font, bodySize, contentWidth - 20);
          for (const line of companyPeriodLines) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              const cornerSize = 30;
              context.page.drawRectangle({
                x: 0,
                y: PAGE_HEIGHT - cornerSize,
                width: cornerSize,
                height: cornerSize,
                color: FOREST_GREEN,
              });
              context.page.drawRectangle({
                x: PAGE_WIDTH - cornerSize,
                y: PAGE_HEIGHT - cornerSize,
                width: cornerSize,
                height: cornerSize,
                color: FOREST_GREEN,
              });
              y = PAGE_HEIGHT - 72;
            }
            context.page.drawText(line, { 
              x: left + 20, 
              y, 
              size: bodySize, 
              font, 
              color: MEDIUM_GRAY 
            });
            y -= bodyLineHeight;
          }
          
          y -= 10;
        }
      } else {
        const isSkillsCategory = line.startsWith('·');
        if (isSkillsCategory) {
          const categoryName = line.trim();
          const categoryLines = wrapText(categoryName, fontBold, bodySize + 1, contentWidth - 20);
          for (const categoryLine of categoryLines) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              const cornerSize = 30;
              context.page.drawRectangle({
                x: 0,
                y: PAGE_HEIGHT - cornerSize,
                width: cornerSize,
                height: cornerSize,
                color: FOREST_GREEN,
              });
              context.page.drawRectangle({
                x: PAGE_WIDTH - cornerSize,
                y: PAGE_HEIGHT - cornerSize,
                width: cornerSize,
                height: cornerSize,
                color: FOREST_GREEN,
              });
              y = PAGE_HEIGHT - 72;
            }
            context.page.drawText(categoryLine, { 
              x: left + 20, 
              y, 
              size: bodySize + 1, 
              font: fontBold, 
              color: BLACK 
            });
            y -= bodyLineHeight + 2;
          }
        } else {
          const wrapped = wrapTextWithIndent(line, font, bodySize, contentWidth - 20);
          for (let i = 0; i < wrapped.lines.length; i++) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              const cornerSize = 30;
              context.page.drawRectangle({
                x: 0,
                y: PAGE_HEIGHT - cornerSize,
                width: cornerSize,
                height: cornerSize,
                color: FOREST_GREEN,
              });
              context.page.drawRectangle({
                x: PAGE_WIDTH - cornerSize,
                y: PAGE_HEIGHT - cornerSize,
                width: cornerSize,
                height: cornerSize,
                color: FOREST_GREEN,
              });
              y = PAGE_HEIGHT - 72;
            }
            const xPos = i === 0 ? left + 20 : left + 20 + wrapped.indentWidth;
            drawTextWithBold(context.page, wrapped.lines[i], xPos, y, font, fontBold, bodySize, BLACK);
            y -= bodyLineHeight;
          }
        }
      }
    }
    
    if (y < marginBottom) {
      context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      const cornerSize = 30;
      context.page.drawRectangle({
        x: 0,
        y: PAGE_HEIGHT - cornerSize,
        width: cornerSize,
        height: cornerSize,
        color: FOREST_GREEN,
      });
      context.page.drawRectangle({
        x: PAGE_WIDTH - cornerSize,
        y: PAGE_HEIGHT - cornerSize,
        width: cornerSize,
        height: cornerSize,
        color: FOREST_GREEN,
      });
      y = PAGE_HEIGHT - 72;
    }
  }
  
  return y;
}

// REFINED CORNER ACCENT TEMPLATE - Elegant design with corner accents and forest green
export async function renderTemplate8(context: TemplateContext): Promise<Uint8Array> {
  const { pdfDoc, page, font, fontBold, name, email, phone, location, PAGE_WIDTH, PAGE_HEIGHT } = context;
  const BLACK = COLORS.BLACK;
  const MEDIUM_GRAY = COLORS.MEDIUM_GRAY;
  const FOREST_GREEN = rgb(0.2, 0.4, 0.3); // Forest green accent color
  
  const MARGIN_TOP = 80;
  const MARGIN_BOTTOM = 50;
  const MARGIN_LEFT = 50;
  const MARGIN_RIGHT = 50;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  
  const NAME_SIZE = 30;
  const CONTACT_SIZE = 9.5;
  const SECTION_HEADER_SIZE = 14;
  const BODY_SIZE = 9.5;
  
  // Draw corner accents (top-left and top-right)
  const cornerSize = 30;
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - cornerSize,
    width: cornerSize,
    height: cornerSize,
    color: FOREST_GREEN,
  });
  page.drawRectangle({
    x: PAGE_WIDTH - cornerSize,
    y: PAGE_HEIGHT - cornerSize,
    width: cornerSize,
    height: cornerSize,
    color: FOREST_GREEN,
  });
  
  let y = PAGE_HEIGHT - MARGIN_TOP;
  const left = MARGIN_LEFT;
  const right = PAGE_WIDTH - MARGIN_RIGHT;
  
  // Name (centered, forest green, elegant)
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
        color: FOREST_GREEN 
      });
      y -= NAME_SIZE * 0.9;
    }
    y -= 16;
  }
  
  // Contact info (centered, elegant spacing)
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
  
  // Elegant divider line
  page.drawLine({
    start: { x: left + 40, y: y },
    end: { x: right - 40, y: y },
    thickness: 1,
    color: FOREST_GREEN,
  });
  y -= 28;
  
  // Render body content
  y = renderBodyContentTemplate8(
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
