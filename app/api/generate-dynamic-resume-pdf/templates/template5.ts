import { PDFPage, rgb } from 'pdf-lib';
import { TemplateContext, wrapText, wrapTextWithIndent, formatDate, drawTextWithBold, COLORS } from '../utils';

// Template 5 Body Content Renderer - Structured style with top/bottom borders
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
  const BURGUNDY = rgb(0.5, 0.1, 0.2); // Burgundy/wine red accent
  const LIGHT_BURGUNDY = rgb(0.98, 0.95, 0.96); // Light burgundy background
  
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
      const sectionLines = wrapText(sectionHeader, fontBold, sectionHeaderSize, contentWidth - 30);
      
      for (const sectionLine of sectionLines) {
        if (y < marginBottom) {
          context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          // Draw top and bottom borders on new pages
          context.page.drawRectangle({
            x: 0,
            y: PAGE_HEIGHT - 15,
            width: PAGE_WIDTH,
            height: 15,
            color: BURGUNDY,
          });
          context.page.drawRectangle({
            x: 0,
            y: 0,
            width: PAGE_WIDTH,
            height: 15,
            color: BURGUNDY,
          });
          y = PAGE_HEIGHT - 72;
        }
        
        // Section header with burgundy background box
        const textWidth = fontBold.widthOfTextAtSize(sectionLine, sectionHeaderSize);
        const boxPadding = 5;
        const boxWidth = textWidth + (boxPadding * 2);
        const boxHeight = sectionHeaderSize + (boxPadding * 2);
        
        // Background box
        context.page.drawRectangle({
          x: left,
          y: y - boxPadding,
          width: boxWidth,
          height: boxHeight,
          color: LIGHT_BURGUNDY,
        });
        
        // Border around box (draw lines for border)
        const boxX = left;
        const boxY = y - boxPadding;
        // Top border
        context.page.drawLine({
          start: { x: boxX, y: boxY + boxHeight },
          end: { x: boxX + boxWidth, y: boxY + boxHeight },
          thickness: 1,
          color: BURGUNDY,
        });
        // Bottom border
        context.page.drawLine({
          start: { x: boxX, y: boxY },
          end: { x: boxX + boxWidth, y: boxY },
          thickness: 1,
          color: BURGUNDY,
        });
        // Left border
        context.page.drawLine({
          start: { x: boxX, y: boxY },
          end: { x: boxX, y: boxY + boxHeight },
          thickness: 1,
          color: BURGUNDY,
        });
        // Right border
        context.page.drawLine({
          start: { x: boxX + boxWidth, y: boxY },
          end: { x: boxX + boxWidth, y: boxY + boxHeight },
          thickness: 1,
          color: BURGUNDY,
        });
        
        // Section header text
        context.page.drawText(sectionLine, { 
          x: left + boxPadding, 
          y, 
          size: sectionHeaderSize, 
          font: fontBold, 
          color: BURGUNDY 
        });
        
        y -= boxHeight + 12;
      }
    } else {
      const isJobExperience = / at .+:.+/.test(line);
      
      if (isJobExperience) {
        const match = line.match(/^(.+?) at (.+?):\s*(.+)$/);
        if (match) {
          const [, jobTitle, companyName, period] = match;
          
          if (!firstJob) {
            y -= 14;
          }
          firstJob = false;
          
          // Job title (bold, burgundy)
          const titleLines = wrapText(jobTitle.trim(), fontBold, bodySize + 2, contentWidth - 20);
          for (const titleLine of titleLines) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              context.page.drawRectangle({
                x: 0,
                y: PAGE_HEIGHT - 15,
                width: PAGE_WIDTH,
                height: 15,
                color: BURGUNDY,
              });
              context.page.drawRectangle({
                x: 0,
                y: 0,
                width: PAGE_WIDTH,
                height: 15,
                color: BURGUNDY,
              });
              y = PAGE_HEIGHT - 72;
            }
            drawTextWithBold(context.page, titleLine, left + 20, y, font, fontBold, bodySize + 2, BURGUNDY);
            y -= bodyLineHeight + 2;
          }
          
          // Company and period
          const formattedPeriod = formatDate(period.trim());
          const companyPeriodLine = `${companyName.trim()}  |  ${formattedPeriod}`;
          const companyPeriodLines = wrapText(companyPeriodLine, font, bodySize, contentWidth - 20);
          for (const line of companyPeriodLines) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              context.page.drawRectangle({
                x: 0,
                y: PAGE_HEIGHT - 15,
                width: PAGE_WIDTH,
                height: 15,
                color: BURGUNDY,
              });
              context.page.drawRectangle({
                x: 0,
                y: 0,
                width: PAGE_WIDTH,
                height: 15,
                color: BURGUNDY,
              });
              y = PAGE_HEIGHT - 72;
            }
            drawTextWithBold(context.page, line, left + 20, y, font, fontBold, bodySize, MEDIUM_GRAY);
            y -= bodyLineHeight;
          }
          
          y -= 8;
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
          // Keep the bullet/dot prefix
          const bulletSymbol = '•';
          const bulletWidth = font.widthOfTextAtSize(bulletSymbol + ' ', bodySize);
          
          // Extract category name (part before colon) and skills (part after colon)
          const colonIndex = lineWithoutBullet.indexOf(':');
          if (colonIndex !== -1) {
            const categoryName = lineWithoutBullet.substring(0, colonIndex + 1).trim(); // Include the colon
            const skillsText = lineWithoutBullet.substring(colonIndex + 1).trim();
            
            // Calculate available width for skills (after category name and bullet)
            const categoryWidth = fontBold.widthOfTextAtSize(categoryName, bodySize);
            const spaceWidth = font.widthOfTextAtSize(' ', bodySize);
            const skillsAvailableWidth = contentWidth - 20 - bulletWidth - categoryWidth - spaceWidth;
            
            // Wrap skills text
            const wrappedSkills = wrapText(skillsText, font, bodySize, skillsAvailableWidth);
            
            // Draw bullet dot, category name in bold, and skills on same/next lines
            let currentX = left + 20;
            
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              context.page.drawRectangle({
                x: 0,
                y: PAGE_HEIGHT - 15,
                width: PAGE_WIDTH,
                height: 15,
                color: BURGUNDY,
              });
              context.page.drawRectangle({
                x: 0,
                y: 0,
                width: PAGE_WIDTH,
                height: 15,
                color: BURGUNDY,
              });
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
                  context.page.drawRectangle({
                    x: 0,
                    y: PAGE_HEIGHT - 15,
                    width: PAGE_WIDTH,
                    height: 15,
                    color: BURGUNDY,
                  });
                  context.page.drawRectangle({
                    x: 0,
                    y: 0,
                    width: PAGE_WIDTH,
                    height: 15,
                    color: BURGUNDY,
                  });
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
          } else {
            // Fallback: if no colon, keep the dot and display category name
            const categoryName = lineWithoutBullet;
            const categoryLines = wrapText(categoryName, font, bodySize + 1, contentWidth - 30);
            
            // Draw bullet dot first
            const bulletSymbol = '';
            const bulletWidth = font.widthOfTextAtSize(bulletSymbol, bodySize);
            
            for (let lineIdx = 0; lineIdx < categoryLines.length; lineIdx++) {
              if (y < marginBottom) {
                context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                context.page.drawRectangle({
                  x: 0,
                  y: PAGE_HEIGHT - 15,
                  width: PAGE_WIDTH,
                  height: 15,
                  color: BURGUNDY,
                });
                context.page.drawRectangle({
                  x: 0,
                  y: 0,
                  width: PAGE_WIDTH,
                  height: 15,
                  color: BURGUNDY,
                });
                y = PAGE_HEIGHT - 72;
              }
              
              // Draw bullet only on first line
              if (lineIdx === 0) {
                context.page.drawText(bulletSymbol, { 
                  x: left + 20, 
                  y, 
                  size: bodySize, 
                  font, 
                  color: BLACK 
                });
                // Draw category name after bullet
                context.page.drawText(categoryLines[lineIdx], { 
                  x: left + 20 + bulletWidth + 4, 
                  y, 
                  size: bodySize + 1, 
                  font: fontBold, 
                  color: BLACK 
                });
              } else {
                // Subsequent lines without bullet, just indented
                context.page.drawText(categoryLines[lineIdx], { 
                  x: left + 20 + bulletWidth + 4, 
                  y, 
                  size: bodySize + 1, 
                  font: fontBold, 
                  color: BLACK 
                });
              }
              y -= bodyLineHeight + 2;
            }
          }
        } else {
          // Experience section bullets - ensure visible dot and proper formatting
          // Check if line already has a bullet
          const hasBullet = /^[\-\·•]\s/.test(line);
          const bulletSymbol = '•';
          const bulletWidth = font.widthOfTextAtSize(bulletSymbol + ' ', bodySize);
          
          let textToWrap = line;
          if (!hasBullet) {
            // Add bullet if not present
            textToWrap = bulletSymbol + ' ' + line;
          }
          
          const wrapped = wrapTextWithIndent(textToWrap, font, bodySize, contentWidth - 20);
          
          for (let i = 0; i < wrapped.lines.length; i++) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              context.page.drawRectangle({
                x: 0,
                y: PAGE_HEIGHT - 15,
                width: PAGE_WIDTH,
                height: 15,
                color: BURGUNDY,
              });
              context.page.drawRectangle({
                x: 0,
                y: 0,
                width: PAGE_WIDTH,
                height: 15,
                color: BURGUNDY,
              });
              y = PAGE_HEIGHT - 72;
            }
            
            const lineText = wrapped.lines[i];
            const xPos = i === 0 ? left + 20 : left + 20 + wrapped.indentWidth;
            
            // Check if line starts with bullet and draw it separately (not bold)
            if (i === 0 && (lineText.startsWith('•') || lineText.startsWith('·') || lineText.startsWith('-'))) {
              const bulletMatch = lineText.match(/^([\-\·•])\s*(.*)/);
              if (bulletMatch) {
                const [, bulletChar, content] = bulletMatch;
                // Draw bullet in regular font (not bold)
                context.page.drawText(bulletChar, {
                  x: xPos,
                  y,
                  size: bodySize,
                  font,
                  color: BLACK
                });
                // Draw content - support **bold** markers but default to regular font
                const contentX = xPos + font.widthOfTextAtSize(bulletChar + ' ', bodySize);
                drawTextWithBold(context.page, content, contentX, y, font, fontBold, bodySize, BLACK);
              } else {
                // No bullet match, draw entire line with bold support
                drawTextWithBold(context.page, lineText, xPos, y, font, fontBold, bodySize, BLACK);
              }
            } else {
              // Regular line (wrapped continuation), no bullet, regular font with bold support
              drawTextWithBold(context.page, lineText, xPos, y, font, fontBold, bodySize, BLACK);
            }
            
            y -= bodyLineHeight;
          }
        }
      }
    }
    
    if (y < marginBottom) {
      context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      context.page.drawRectangle({
        x: 0,
        y: PAGE_HEIGHT - 15,
        width: PAGE_WIDTH,
        height: 15,
        color: BURGUNDY,
      });
      context.page.drawRectangle({
        x: 0,
        y: 0,
        width: PAGE_WIDTH,
        height: 15,
        color: BURGUNDY,
      });
      y = PAGE_HEIGHT - 72;
    }
  }
  
  return y;
}

// STRUCTURED TEMPLATE - Top and bottom borders with asymmetric layout
export async function renderTemplate5(context: TemplateContext): Promise<Uint8Array> {
  const { pdfDoc, page, font, fontBold, name, email, phone, location, PAGE_WIDTH, PAGE_HEIGHT } = context;
  const BLACK = COLORS.BLACK;
  const MEDIUM_GRAY = COLORS.MEDIUM_GRAY;
  const BURGUNDY = rgb(0.5, 0.1, 0.2); // Burgundy/wine red accent color
  const LIGHT_BURGUNDY = rgb(0.98, 0.95, 0.96); // Light burgundy background
  
  const MARGIN_TOP = 80;
  const MARGIN_BOTTOM = 70; // Extra space for bottom border
  const MARGIN_LEFT = 60;
  const MARGIN_RIGHT = 60;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  
  const NAME_SIZE = 28;
  const CONTACT_SIZE = 9;
  const SECTION_HEADER_SIZE = 13;
  const BODY_SIZE = 9.5;
  
  // Draw top border
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 15,
    width: PAGE_WIDTH,
    height: 15,
    color: BURGUNDY,
  });
  
  // Draw bottom border
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: 15,
    color: BURGUNDY,
  });
  
  let y = PAGE_HEIGHT - MARGIN_TOP;
  const left = MARGIN_LEFT;
  const right = PAGE_WIDTH - MARGIN_RIGHT;
  
  // Name positioned on the right side (asymmetric layout)
  if (name) {
    const nameLines = wrapText(name, fontBold, NAME_SIZE, CONTENT_WIDTH * 0.6);
    for (const line of nameLines) {
      const textWidth = fontBold.widthOfTextAtSize(line, NAME_SIZE);
      // Right-align the name
      const actualX = right - textWidth;
      page.drawText(line, { 
        x: actualX, 
        y, 
        size: NAME_SIZE, 
        font: fontBold, 
        color: BURGUNDY 
      });
      y -= NAME_SIZE * 0.85;
    }
    y -= 12;
  }
  
  // Contact info positioned on the left side (asymmetric)
  const contactParts = [location, phone, email].filter(Boolean);
  if (contactParts.length > 0) {
    const contactLine = contactParts.join('  •  ');
    const contactLines = wrapText(contactLine, font, CONTACT_SIZE, CONTENT_WIDTH * 0.6);
    for (const line of contactLines) {
      page.drawText(line, { 
        x: left, 
        y, 
        size: CONTACT_SIZE, 
        font, 
        color: MEDIUM_GRAY 
      });
      y -= CONTACT_SIZE * 1.3;
    }
    y -= 20;
  }
  
  // Decorative burgundy line separator
  const separatorY = y;
  page.drawLine({
    start: { x: left, y: separatorY },
    end: { x: right, y: separatorY },
    thickness: 1.5,
    color: BURGUNDY,
  });
  y -= 24;
  
  // Render body content
  y = renderBodyContentTemplate5(
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
