import { PDFPage, rgb } from 'pdf-lib';
import { TemplateContext, wrapText, wrapTextWithIndent, formatDate, drawTextWithBold, COLORS } from '../utils';

// Template 6 Body Content Renderer - Full-width header banner
function renderBodyContentTemplate6(
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
  const DARK_TEAL = rgb(0.15, 0.4, 0.4);
  
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
          y = PAGE_HEIGHT - 72;
        }
        
        // Section header with full-width background bar
        const barHeight = sectionHeaderSize + 8;
        context.page.drawRectangle({
          x: 0,
          y: y - 4,
          width: PAGE_WIDTH,
          height: barHeight,
          color: rgb(0.96, 0.98, 0.98),
        });
        
        context.page.drawText(sectionLine, { 
          x: left, 
          y, 
          size: sectionHeaderSize, 
          font: fontBold, 
          color: DARK_TEAL 
        });
        
        y -= sectionLineHeight + 12;
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
          
          const titleLines = wrapText(jobTitle.trim(), fontBold, bodySize + 2, contentWidth - 20);
          for (const titleLine of titleLines) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              y = PAGE_HEIGHT - 72;
            }
            drawTextWithBold(context.page, titleLine, left + 20, y, font, fontBold, bodySize + 2, DARK_TEAL);
            y -= bodyLineHeight + 2;
          }
          
          const formattedPeriod = formatDate(period.trim());
          const companyPeriodLine = `${companyName.trim()}  •  ${formattedPeriod}`;
          const companyPeriodLines = wrapText(companyPeriodLine, font, bodySize, contentWidth - 20);
          for (const line of companyPeriodLines) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              y = PAGE_HEIGHT - 72;
            }
            drawTextWithBold(context.page, line, left + 20, y, font, fontBold, bodySize, MEDIUM_GRAY);
            y -= bodyLineHeight;
          }
          
          y -= 10;
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
            
            let currentX = left + 20;
            
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              y = PAGE_HEIGHT - 72;
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
                  y = PAGE_HEIGHT - 72;
                }
                context.page.drawText(wrappedSkills[i], {
                  x: left + 20 + bulletWidth,
                  y,
                  size: bodySize,
                  font,
                  color: BLACK
                });
              }
            }
            y -= bodyLineHeight + 2;
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
              y = PAGE_HEIGHT - 72;
            }
            
            const lineText = wrapped.lines[i];
            const xPos = i === 0 ? left + 20 : left + 20 + wrapped.indentWidth;
            
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
      y = PAGE_HEIGHT - 72;
    }
  }
  
  return y;
}

// FULL-WIDTH HEADER BANNER TEMPLATE - Large header banner with content below
export async function renderTemplate6(context: TemplateContext): Promise<Uint8Array> {
  const { pdfDoc, page, font, fontBold, name, email, phone, location, PAGE_WIDTH, PAGE_HEIGHT } = context;
  const BLACK = COLORS.BLACK;
  const MEDIUM_GRAY = COLORS.MEDIUM_GRAY;
  const DARK_TEAL = rgb(0.15, 0.4, 0.4);
  const LIGHT_TEAL = rgb(0.96, 0.98, 0.98);
  
  const HEADER_HEIGHT = 120;
  const MARGIN_TOP = 80;
  const MARGIN_BOTTOM = 50;
  const MARGIN_LEFT = 40;
  const MARGIN_RIGHT = 40;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  
  const NAME_SIZE = 32;
  const CONTACT_SIZE = 10;
  const SECTION_HEADER_SIZE = 13;
  const BODY_SIZE = 9.5;
  
  // Draw full-width header banner
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - HEADER_HEIGHT,
    width: PAGE_WIDTH,
    height: HEADER_HEIGHT,
    color: DARK_TEAL,
  });
  
  // Name in header (white text on dark background)
  if (name) {
    const nameLines = wrapText(name, fontBold, NAME_SIZE, CONTENT_WIDTH);
    let nameY = PAGE_HEIGHT - 50;
    for (const line of nameLines) {
      const textWidth = fontBold.widthOfTextAtSize(line, NAME_SIZE);
      const centerX = (PAGE_WIDTH - textWidth) / 2;
      page.drawText(line, { 
        x: centerX, 
        y: nameY, 
        size: NAME_SIZE, 
        font: fontBold, 
        color: rgb(1, 1, 1) // White
      });
      nameY -= NAME_SIZE * 0.8;
    }
  }
  
  // Contact info in header (white text)
  const contactParts = [location, phone, email].filter(Boolean);
  if (contactParts.length > 0) {
    const contactLine = contactParts.join('  •  ');
    const contactLines = wrapText(contactLine, font, CONTACT_SIZE, CONTENT_WIDTH);
    let contactY = PAGE_HEIGHT - HEADER_HEIGHT + 20;
    for (const line of contactLines) {
      const textWidth = font.widthOfTextAtSize(line, CONTACT_SIZE);
      const centerX = (PAGE_WIDTH - textWidth) / 2;
      page.drawText(line, { 
        x: centerX, 
        y: contactY, 
        size: CONTACT_SIZE, 
        font, 
        color: rgb(0.95, 0.95, 0.95) // Light gray
      });
      contactY -= CONTACT_SIZE * 1.3;
    }
  }
  
  // Start body content below header
  let y = PAGE_HEIGHT - HEADER_HEIGHT - 30;
  const left = MARGIN_LEFT;
  const right = PAGE_WIDTH - MARGIN_RIGHT;
  
  // Render body content
  y = renderBodyContentTemplate6(
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
