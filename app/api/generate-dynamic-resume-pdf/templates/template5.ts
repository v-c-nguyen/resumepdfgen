import { PDFPage, rgb } from 'pdf-lib';
import { TemplateContext, wrapText, wrapTextWithIndent, formatDate, drawTextWithBold, COLORS } from '../utils';

// Template 5 Body Content Renderer - Right-aligned header design
function renderBodyContentTemplate5(
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
  const SAGE = rgb(0.5, 0.6, 0.5);
  
  const bodyLines = body.split('\n');
  let firstJob = true;
  
  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i].trim();
    if (!line) {
      y -= 8;
      continue;
    }
    
    if (line.endsWith(':')) {
      y -= 10;
      const sectionHeader = line.slice(0, -1);
      const sectionLines = wrapText(sectionHeader, fontBold, sectionHeaderSize, contentWidth - 40);
      
      for (const sectionLine of sectionLines) {
        if (y < marginBottom) {
          context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          y = PAGE_HEIGHT - 80;
        }
        
        // Section header - simple, clean
        context.page.drawText(sectionLine, { 
          x: left, 
          y, 
          size: sectionHeaderSize, 
          font: fontBold, 
          color: BLACK 
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
            y -= 10;
          }
          firstJob = false;
          
          const titleLines = wrapText(jobTitle.trim(), fontBold, bodySize + 1.5, contentWidth - 20);
          for (const titleLine of titleLines) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              y = PAGE_HEIGHT - 80;
            }
            drawTextWithBold(context.page, titleLine, left + 15, y, font, fontBold, bodySize + 1.5, BLACK);
            y -= bodyLineHeight + 1;
          }
          
          const formattedPeriod = formatDate(period.trim());
          const companyPeriodLine = `${companyName.trim()}  |  ${formattedPeriod}`;
          const companyPeriodLines = wrapText(companyPeriodLine, font, bodySize, contentWidth - 20);
          for (const line of companyPeriodLines) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              y = PAGE_HEIGHT - 80;
            }
            drawTextWithBold(context.page, line, left + 15, y, font, fontBold, bodySize, MEDIUM_GRAY);
            y -= bodyLineHeight;
          }
          
          y -= 5;
        }
      } else {
        const lineWithoutBullet = line.trim().replace(/^[·•]\s*/, '');
        const colonIndex = lineWithoutBullet.indexOf(':');
        const isSkillsCategory = (line.startsWith('·') || line.startsWith('•')) && 
                                 colonIndex !== -1 && 
                                 colonIndex < 30 && 
                                 !lineWithoutBullet.substring(0, colonIndex).includes(' at ');
        
        if (isSkillsCategory) {
          const bulletSymbol = '•';
          const bulletWidth = font.widthOfTextAtSize(bulletSymbol + ' ', bodySize);
          
          const colonIndex = lineWithoutBullet.indexOf(':');
          if (colonIndex !== -1) {
            const categoryName = lineWithoutBullet.substring(0, colonIndex + 1).trim();
            const skillsText = lineWithoutBullet.substring(colonIndex + 1).trim();
            
            const categoryWidth = fontBold.widthOfTextAtSize(categoryName, bodySize);
            const spaceWidth = font.widthOfTextAtSize(' ', bodySize);
            const skillsAvailableWidth = contentWidth - 20 - bulletWidth - categoryWidth - spaceWidth;
            
            const wrappedSkills = wrapText(skillsText, font, bodySize, skillsAvailableWidth);
            
            let currentX = left + 15;
            
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              y = PAGE_HEIGHT - 80;
            }
            
            context.page.drawText(bulletSymbol, { 
              x: currentX, 
              y, 
              size: bodySize, 
              font, 
              color: BLACK 
            });
            
            currentX += bulletWidth;
            context.page.drawText(categoryName, { 
              x: currentX, 
              y, 
              size: bodySize, 
              font: fontBold, 
              color: BLACK 
            });
            
            if (wrappedSkills.length > 0 && wrappedSkills[0]) {
              currentX += categoryWidth + spaceWidth;
              context.page.drawText(wrappedSkills[0], {
                x: currentX,
                y,
                size: bodySize,
                font,
                color: BLACK
              });
              
              for (let i = 1; i < wrappedSkills.length; i++) {
                y -= bodyLineHeight;
                if (y < marginBottom) {
                  context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                  y = PAGE_HEIGHT - 80;
                }
                context.page.drawText(wrappedSkills[i], {
                  x: left + 15 + bulletWidth,
                  y,
                  size: bodySize,
                  font,
                  color: BLACK
                });
              }
            }
            y -= bodyLineHeight + 4;
          }
        } else {
          const hasBullet = /^[\-\·•]\s/.test(line);
          const bulletSymbol = '•';
          const bulletWidth = font.widthOfTextAtSize(bulletSymbol + ' ', bodySize);
          
          let textToWrap = line;
          if (!hasBullet) {
            textToWrap = bulletSymbol + ' ' + line;
          }
          
          const wrapped = wrapTextWithIndent(textToWrap, font, bodySize, contentWidth - 20);
          
          for (let i = 0; i < wrapped.lines.length; i++) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              y = PAGE_HEIGHT - 80;
            }
            
            const lineText = wrapped.lines[i];
            const xPos = i === 0 ? left + 15 : left + 15 + wrapped.indentWidth;
            
            if (i === 0 && (lineText.startsWith('•') || lineText.startsWith('·') || lineText.startsWith('-'))) {
              const bulletMatch = lineText.match(/^([\-\·•])\s*(.*)/);
              if (bulletMatch) {
                const [, bulletChar, content] = bulletMatch;
                context.page.drawText(bulletChar, {
                  x: xPos,
                  y,
                  size: bodySize,
                  font,
                  color: BLACK
                });
                const contentX = xPos + font.widthOfTextAtSize(bulletChar + ' ', bodySize);
                drawTextWithBold(context.page, content, contentX, y, font, fontBold, bodySize, BLACK);
              } else {
                drawTextWithBold(context.page, lineText, xPos, y, font, fontBold, bodySize, BLACK);
              }
            } else {
              drawTextWithBold(context.page, lineText, xPos, y, font, fontBold, bodySize, BLACK);
            }
            
            y -= bodyLineHeight;
          }
        }
      }
    }
    
    if (y < marginBottom) {
      context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - 80;
    }
  }
  
  return y;
}

// RIGHT-ALIGNED HEADER TEMPLATE - Name and contact right-aligned at top, content flows naturally
export async function renderTemplate5(context: TemplateContext): Promise<Uint8Array> {
  const { pdfDoc, page, font, fontBold, name, email, phone, location, PAGE_WIDTH, PAGE_HEIGHT } = context;
  const BLACK = COLORS.BLACK;
  const MEDIUM_GRAY = COLORS.MEDIUM_GRAY;
  const SAGE = rgb(0.5, 0.6, 0.5);
  
  const MARGIN_TOP = 55;
  const MARGIN_BOTTOM = 50;
  const MARGIN_LEFT = 40;
  const MARGIN_RIGHT = 40;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  
  const NAME_SIZE = 22;
  const CONTACT_SIZE = 9.5;
  const SECTION_HEADER_SIZE = 12;
  const BODY_SIZE = 10;
  
  let y = PAGE_HEIGHT - MARGIN_TOP;
  const left = MARGIN_LEFT;
  const right = PAGE_WIDTH - MARGIN_RIGHT;
  
  // Name (right-aligned, sage color)
  if (name) {
    const nameLines = wrapText(name, fontBold, NAME_SIZE, CONTENT_WIDTH * 0.7);
    for (const line of nameLines) {
      const textWidth = fontBold.widthOfTextAtSize(line, NAME_SIZE);
      const rightX = right - textWidth;
      page.drawText(line, { 
        x: MARGIN_LEFT, 
        y, 
        size: NAME_SIZE, 
        font: fontBold, 
        color: BLACK 
      });
      y -= NAME_SIZE * 1.0;
    }
    y -= 8;
  }
  
  // Contact info (right-aligned, below name)
  const contactParts = [location, phone, email].filter(Boolean);
  if (contactParts.length > 0) {
    const contactLine = contactParts.join('  |  ');
    const contactLines = wrapText(contactLine, font, CONTACT_SIZE, CONTENT_WIDTH * 0.7);
    for (const line of contactLines) {
      const textWidth = font.widthOfTextAtSize(line, CONTACT_SIZE);
      const rightX = right - textWidth;
      page.drawText(line, { 
        x: MARGIN_LEFT, 
        y, 
        size: CONTACT_SIZE, 
        font, 
        color: MEDIUM_GRAY 
      });
      y -= CONTACT_SIZE * 1.4;
    }
    y -= 12;
  }
  
  // No divider - clean transition to content
  
  // Render body content (starts from left)
  y = renderBodyContentTemplate5(
    context, 
    y, 
    left, 
    right, 
    CONTENT_WIDTH, 
    BODY_SIZE, 
    BODY_SIZE * 1.6, 
    SECTION_HEADER_SIZE, 
    SECTION_HEADER_SIZE * 1.5, 
    MARGIN_BOTTOM
  );
  
  return await pdfDoc.save();
}
