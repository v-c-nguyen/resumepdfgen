import { PDFPage, rgb } from 'pdf-lib';
import { TemplateContext, wrapText, wrapTextWithIndent, formatDate, drawTextWithBold, COLORS } from '../utils';

// Template 1 Body Content Renderer - Elegant top accent bar design
function renderBodyContentTemplate1(
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
  const DEEP_BLUE = rgb(0.2, 0.35, 0.55);
  
  const bodyLines = body.split('\n');
  let firstJob = true;
  
  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i].trim();
    if (!line) {
      y -= 8;
      continue;
    }
    
    if (line.endsWith(':')) {
      y -= 24;
      const sectionHeader = line.slice(0, -1);
      const sectionLines = wrapText(sectionHeader, fontBold, sectionHeaderSize, contentWidth - 40);
      
      for (const sectionLine of sectionLines) {
        if (y < marginBottom) {
          context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          // Redraw top accent bar on new page
          const accentBarHeight = 8;
          context.page.drawRectangle({
            x: 0,
            y: PAGE_HEIGHT - accentBarHeight,
            width: PAGE_WIDTH,
            height: accentBarHeight,
            color: DEEP_BLUE,
          });
          y = PAGE_HEIGHT;
        }
        
        // Section header with elegant styling
        context.page.drawText(sectionLine, { 
          x: left, 
          y, 
          size: sectionHeaderSize, 
          font: fontBold, 
          color: DEEP_BLUE 
        });
        
        y -= sectionLineHeight + 5;
      }
    } else {
      const isJobExperience = / at .+:.+/.test(line);
      
      if (isJobExperience) {
        const match = line.match(/^(.+?) at (.+?):\s*(.+)$/);
        if (match) {
          const [, jobTitle, companyName, period] = match;
          
          if (!firstJob) {
            y -= 20;
          }
          firstJob = false;
          
          const titleLines = wrapText(jobTitle.trim(), fontBold, bodySize + 1.5, contentWidth - 20);
          for (const titleLine of titleLines) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              const accentBarHeight = 8;
              context.page.drawRectangle({
                x: 0,
                y: PAGE_HEIGHT - accentBarHeight,
                width: PAGE_WIDTH,
                height: accentBarHeight,
                color: DEEP_BLUE,
              });
              y = PAGE_HEIGHT - 80;
            }
            drawTextWithBold(context.page, titleLine, left + 15, y, font, fontBold, bodySize + 1.5, BLACK);
            y -= bodyLineHeight + 1;
          }
          
          const formattedPeriod = formatDate(period.trim());
          const companyPeriodLine = `${companyName.trim()}  •  ${formattedPeriod}`;
          const companyPeriodLines = wrapText(companyPeriodLine, font, bodySize, contentWidth - 20);
          for (const line of companyPeriodLines) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              const accentBarHeight = 8;
              context.page.drawRectangle({
                x: 0,
                y: PAGE_HEIGHT - accentBarHeight,
                width: PAGE_WIDTH,
                height: accentBarHeight,
                color: DEEP_BLUE,
              });
              y = PAGE_HEIGHT - 80;
            }
            drawTextWithBold(context.page, line, left + 15, y, font, fontBold, bodySize, MEDIUM_GRAY);
            y -= bodyLineHeight + 1;
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
              const accentBarHeight = 8;
              context.page.drawRectangle({
                x: 0,
                y: PAGE_HEIGHT - accentBarHeight,
                width: PAGE_WIDTH,
                height: accentBarHeight,
                color: DEEP_BLUE,
              });
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
                  const accentBarHeight = 8;
                  context.page.drawRectangle({
                    x: 0,
                    y: PAGE_HEIGHT - accentBarHeight,
                    width: PAGE_WIDTH,
                    height: accentBarHeight,
                    color: DEEP_BLUE,
                  });
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
              const accentBarHeight = 8;
              context.page.drawRectangle({
                x: 0,
                y: PAGE_HEIGHT - accentBarHeight,
                width: PAGE_WIDTH,
                height: accentBarHeight,
                color: DEEP_BLUE,
              });
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
      const accentBarHeight = 8;
      context.page.drawRectangle({
        x: 0,
        y: PAGE_HEIGHT - accentBarHeight,
        width: PAGE_WIDTH,
        height: accentBarHeight,
        color: DEEP_BLUE,
      });
      y = PAGE_HEIGHT - 80;
    }
  }
  
  return y;
}

// ELEGANT TOP ACCENT BAR TEMPLATE - Attractive design with subtle top accent bar and prominent header
export async function renderTemplate1(context: TemplateContext): Promise<Uint8Array> {
  const { pdfDoc, page, font, fontBold, name, email, phone, location, PAGE_WIDTH, PAGE_HEIGHT } = context;
  const BLACK = COLORS.BLACK;
  const MEDIUM_GRAY = COLORS.MEDIUM_GRAY;
  const DEEP_BLUE = rgb(0.2, 0.35, 0.55);
  const LIGHT_BLUE = rgb(0.97, 0.98, 0.99);
  
  const ACCENT_BAR_HEIGHT = 8;
  const HEADER_HEIGHT = 110;
  const MARGIN_TOP = 85;
  const MARGIN_BOTTOM = 50;
  const MARGIN_LEFT = 35;
  const MARGIN_RIGHT = 35;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  
  const NAME_SIZE = 28;
  const CONTACT_SIZE = 10;
  const SECTION_HEADER_SIZE = 13;
  const BODY_SIZE = 10;
  
  // Draw elegant top accent bar
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - ACCENT_BAR_HEIGHT,
    width: PAGE_WIDTH,
    height: ACCENT_BAR_HEIGHT,
    color: DEEP_BLUE,
  });
  
  // Draw subtle header background
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - HEADER_HEIGHT,
    width: PAGE_WIDTH,
    height: HEADER_HEIGHT - ACCENT_BAR_HEIGHT,
    color: LIGHT_BLUE,
  });
  
  let y = PAGE_HEIGHT - MARGIN_TOP;
  const left = MARGIN_LEFT;
  const right = PAGE_WIDTH - MARGIN_RIGHT;
  
  // Name (prominent, centered in header, deep blue)
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
        color: DEEP_BLUE 
      });
      nameY -= NAME_SIZE * 1.0;
    }
  }
  
  // Contact info (centered in header, below name)
  const contactParts = [location, phone, email].filter(Boolean);
  if (contactParts.length > 0) {
    const contactLine = contactParts.join('  •  ');
    const contactLines = wrapText(contactLine, font, CONTACT_SIZE, CONTENT_WIDTH);
    let contactY = PAGE_HEIGHT - 85;
    for (const line of contactLines) {
      const textWidth = font.widthOfTextAtSize(line, CONTACT_SIZE);
      const centerX = (PAGE_WIDTH - textWidth) / 2;
      page.drawText(line, { 
        x: centerX, 
        y: contactY, 
        size: CONTACT_SIZE, 
        font, 
        color: MEDIUM_GRAY 
      });
      contactY -= CONTACT_SIZE * 1.4;
    }
  }
  
  // Start body content below header
  y = PAGE_HEIGHT - HEADER_HEIGHT - 25;
  
  // Render body content
  y = renderBodyContentTemplate1(
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

