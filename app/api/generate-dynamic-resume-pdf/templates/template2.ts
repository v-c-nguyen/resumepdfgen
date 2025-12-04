import { PDFPage, rgb } from 'pdf-lib';
import { TemplateContext, wrapText, wrapTextWithIndent, formatDate, drawTextWithBold, COLORS } from '../utils';

// Template 2 Body Content Renderer - Modern two-column style with sidebar
function renderBodyContentTemplate2(
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
  const LIGHT_GRAY = COLORS.LIGHT_GRAY;
  const TEAL = rgb(0.0, 0.5, 0.5); // Teal accent color
  
  const bodyLines = body.split('\n');
  let firstJob = true;
  
  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i].trim();
    if (!line) {
      y -= 6;
      continue;
    }
    
    if (line.endsWith(':')) {
      y -= 16;
      const sectionHeader = line.slice(0, -1);
      const sectionLines = wrapText(sectionHeader, fontBold, sectionHeaderSize, contentWidth - 20);
      
      for (const sectionLine of sectionLines) {
        if (y < marginBottom) {
          context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          y = PAGE_HEIGHT - 72;
        }
        
        // Draw colored box background for section header
        const textWidth = fontBold.widthOfTextAtSize(sectionLine, sectionHeaderSize);
        const boxPadding = 4;
        const boxHeight = sectionHeaderSize + (boxPadding * 2);
        
        context.page.drawRectangle({
          x: left,
          y: y - boxPadding,
          width: textWidth + (boxPadding * 2),
          height: boxHeight,
          color: TEAL,
          borderColor: TEAL,
        });
        
        // Draw white text on colored box
        context.page.drawText(sectionLine, { 
          x: left + boxPadding, 
          y: y, 
          size: sectionHeaderSize, 
          font: fontBold, 
          color: rgb(1, 1, 1) 
        });
        
        y -= boxHeight + 8;
      }
    } else {
      const isJobExperience = / at .+:.+/.test(line);
      
      if (isJobExperience) {
        const match = line.match(/^(.+?) at (.+?):\s*(.+)$/);
        if (match) {
          const [, jobTitle, companyName, period] = match;
          
          if (!firstJob) {
            y -= 12;
          }
          firstJob = false;
          
          // Job title with teal accent dot (bold)
          const titleLines = wrapText(jobTitle.trim(), fontBold, bodySize + 3, contentWidth - 20);
          for (const titleLine of titleLines) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              y = PAGE_HEIGHT - 72;
            }
            // Draw teal dot before title
            context.page.drawCircle({
              x: left + 4,
              y: y + (bodySize + 3) / 2,
              size: 3,
              color: TEAL,
            });
            drawTextWithBold(context.page, titleLine, left + 12, y, font, fontBold, bodySize + 3, BLACK);
            y -= bodyLineHeight + 3;
          }
          
          // Company and period on same line with separator
          const formattedPeriod = formatDate(period.trim());
          const companyPeriodLine = `${companyName.trim()}  •  ${formattedPeriod}`;
          const companyPeriodLines = wrapText(companyPeriodLine, font, bodySize - 1, contentWidth - 20);
          for (const line of companyPeriodLines) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              y = PAGE_HEIGHT - 72;
            }
            drawTextWithBold(context.page, line, left + 12, y, font, fontBold, bodySize - 1, MEDIUM_GRAY);
            y -= bodyLineHeight - 2;
          }
          
          // Add visual separator line after job header
          y -= 5;
          if (y < marginBottom) {
            context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            y = PAGE_HEIGHT - 72;
          }
          y -= 10; // Extra spacing after separator line
        }
      } else {
        // Distinguish skill categories from experience bullets
        // Skill categories have pattern: "• Category Name: skills list"
        // Experience bullets are full sentences without this pattern
        const lineWithoutBullet = line.trim().replace(/^[·•]\s*/, '');
        const colonIndex = lineWithoutBullet.indexOf(':');
        // Consider it a skill category if it starts with bullet AND has a colon early in the line (within first 30 chars)
        // This distinguishes "• Programming Languages: JavaScript..." from "• Built Python microservices..."
        const isSkillsCategory = (line.startsWith('·') || line.startsWith('•')) && 
                                 colonIndex !== -1 && 
                                 colonIndex < 30 && 
                                 !lineWithoutBullet.substring(0, colonIndex).includes(' at ');
        
        if (isSkillsCategory) {
          // Extract category name (part before colon) and skills (part after colon)
          const bulletSymbol = '•';
          const bulletWidth = font.widthOfTextAtSize(bulletSymbol + ' ', bodySize);
          
          const categoryName = lineWithoutBullet.substring(0, colonIndex + 1).trim(); // Include the colon
          const skillsText = lineWithoutBullet.substring(colonIndex + 1).trim();
          
          // Calculate available width for skills (after category name and bullet)
          const categoryWidth = fontBold.widthOfTextAtSize(categoryName, bodySize);
          const spaceWidth = font.widthOfTextAtSize(' ', bodySize);
          const skillsAvailableWidth = contentWidth - 20 - bulletWidth - categoryWidth - spaceWidth;
          
          // Wrap skills text
          const wrappedSkills = wrapText(skillsText, font, bodySize, skillsAvailableWidth);
          
          // Draw bullet dot, category name in bold, and skills on same/next lines
          let currentX = left + 12;
          
          if (y < marginBottom) {
            context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            y = PAGE_HEIGHT - 72;
          }
          
          // Draw bullet dot (regular font, not bold)
          context.page.drawText(bulletSymbol, { 
            x: currentX, 
            y, 
            size: bodySize, 
            font, 
            color: BLACK 
          });
          
          // Draw category name in bold (after bullet)
          currentX += bulletWidth;
          context.page.drawText(categoryName, { 
            x: currentX, 
            y, 
            size: bodySize, 
            font: fontBold, 
            color: BLACK 
          });
          
          // Draw skills text on same line or wrapped to next lines
          if (wrappedSkills.length > 0 && wrappedSkills[0]) {
            currentX += categoryWidth + spaceWidth;
            context.page.drawText(wrappedSkills[0], {
              x: currentX,
              y,
              size: bodySize,
              font,
              color: BLACK
            });
            
            // Draw remaining wrapped lines (indented to align with skills, after bullet)
            for (let i = 1; i < wrappedSkills.length; i++) {
              y -= bodyLineHeight;
              if (y < marginBottom) {
                context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                y = PAGE_HEIGHT - 72;
              }
              context.page.drawText(wrappedSkills[i], {
                x: left + 12 + bulletWidth,
                y,
                size: bodySize,
                font,
                color: BLACK
              });
            }
          }
          y -= bodyLineHeight + 6;
        } else {
          const wrapped = wrapTextWithIndent(line, font, bodySize, contentWidth - 20);
          for (let i = 0; i < wrapped.lines.length; i++) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              y = PAGE_HEIGHT - 72;
            }
            const xPos = i === 0 ? left + 12 : left + 12 + wrapped.indentWidth;
            drawTextWithBold(context.page, wrapped.lines[i], xPos, y, font, fontBold, bodySize, BLACK);
            y -= bodyLineHeight;
          }
        }
      }
    }
    
    if (y < marginBottom) {
      context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - 72;
    }
  }
  
  return y;
}

// MODERN TWO-COLUMN TEMPLATE - Sidebar layout with teal accent
export async function renderTemplate2(context: TemplateContext): Promise<Uint8Array> {
  const { pdfDoc, page, font, fontBold, name, email, phone, location, PAGE_WIDTH, PAGE_HEIGHT } = context;
  const BLACK = COLORS.BLACK;
  const MEDIUM_GRAY = COLORS.MEDIUM_GRAY;
  const LIGHT_GRAY = COLORS.LIGHT_GRAY;
  const TEAL = rgb(0.0, 0.5, 0.5); // Teal accent color
  const LIGHT_TEAL = rgb(0.9, 0.95, 0.95); // Light teal for sidebar background
  
  const SIDEBAR_WIDTH = 180;
  const MARGIN_TOP = 50;
  const MARGIN_BOTTOM = 50;
  const MARGIN_LEFT = 0; // No left margin, sidebar starts at edge
  const MARGIN_RIGHT = 50;
  const CONTENT_LEFT = SIDEBAR_WIDTH + 40; // Content starts after sidebar + gap
  const CONTENT_WIDTH = PAGE_WIDTH - CONTENT_LEFT - MARGIN_RIGHT;
  
  const NAME_SIZE = 24;
  const CONTACT_SIZE = 10;
  const SECTION_HEADER_SIZE = 14;
  const BODY_SIZE = 10;
  
  // Draw sidebar background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: SIDEBAR_WIDTH,
    height: PAGE_HEIGHT,
    color: LIGHT_TEAL,
  });
  
  // Draw vertical accent line on right edge of sidebar
  page.drawLine({
    start: { x: SIDEBAR_WIDTH, y: 0 },
    end: { x: SIDEBAR_WIDTH, y: PAGE_HEIGHT },
    thickness: 3,
    color: TEAL,
  });
  
  let sidebarY = PAGE_HEIGHT - MARGIN_TOP;
  const sidebarLeft = 20;
  const sidebarRight = SIDEBAR_WIDTH - 20;
  
  // Name in sidebar (left-aligned, teal color)
  if (name) {
    const nameLines = wrapText(name, fontBold, NAME_SIZE, SIDEBAR_WIDTH - 40);
    for (const line of nameLines) {
      page.drawText(line, { 
        x: sidebarLeft, 
        y: sidebarY, 
        size: NAME_SIZE, 
        font: fontBold, 
        color: TEAL 
      });
      sidebarY -= NAME_SIZE * 1.1;
    }
    sidebarY -= 20;
  }
  
  // Contact info in sidebar (stacked vertically)
  const contactInfo = [
    { label: 'Location', value: location },
    { label: 'Phone', value: phone },
    { label: 'Email', value: email },
  ].filter(item => item.value);
  
  for (const item of contactInfo) {
    // Label in small caps, gray
    const labelText = item.label.toUpperCase();
    page.drawText(labelText, { 
      x: sidebarLeft, 
      y: sidebarY, 
      size: 8, 
      font: fontBold, 
      color: MEDIUM_GRAY 
    });
    sidebarY -= 10;
    
    // Value in regular font, black
    const valueLines = wrapText(item.value, font, CONTACT_SIZE, SIDEBAR_WIDTH - 40);
    for (const line of valueLines) {
      page.drawText(line, { 
        x: sidebarLeft, 
        y: sidebarY, 
        size: CONTACT_SIZE, 
        font, 
        color: BLACK 
      });
      sidebarY -= CONTACT_SIZE * 1.3;
    }
    sidebarY -= 12;
  }
  
  // Main content area
  let y = PAGE_HEIGHT - MARGIN_TOP;
  const left = CONTENT_LEFT;
  const right = PAGE_WIDTH - MARGIN_RIGHT;
  
  // Render body content
  y = renderBodyContentTemplate2(
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
