import { PDFPage, rgb } from 'pdf-lib';
import { TemplateContext, wrapText, wrapTextWithIndent, formatDate, drawTextWithBold, COLORS } from '../utils';

// Template 6 Body Content Renderer - Modern style with left accent bar
function renderBodyContentTemplate3(
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
  const INDIGO = rgb(0.25, 0.3, 0.6); // Indigo accent color
  const LIGHT_INDIGO = rgb(0.96, 0.97, 0.99); // Light indigo background
  
  const bodyLines = body.split('\n');
  let firstJob = true;
  let currentSection = '';
  
  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i].trim();
    if (!line) {
      y -= 6;
      continue;
    }
    
    // Check if this is a section header (ends with colon or is a known section name)
    const isSectionHeader = line.endsWith(':') || 
                           /^(summary|education|experience|technical skills|skills|professional experience)$/i.test(line.trim());
    
    if (isSectionHeader) {
      y -= 18;
      const sectionHeader = line.endsWith(':') ? line.slice(0, -1).trim() : line.trim();
      currentSection = sectionHeader.toLowerCase();
      const sectionLines = wrapText(sectionHeader, fontBold, sectionHeaderSize, contentWidth - 50);
      
      for (const sectionLine of sectionLines) {
        if (y < marginBottom) {
          context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          // Draw left accent bar on new pages
          context.page.drawRectangle({
            x: 0,
            y: 0,
            width: 12,
            height: PAGE_HEIGHT,
            color: INDIGO,
          });
          y = PAGE_HEIGHT - 72;
        }
        
        // Section header with left indigo accent line
        const accentLineHeight = sectionHeaderSize + 4;
        context.page.drawRectangle({
          x: left - 8,
          y: y - 2,
          width: 4,
          height: accentLineHeight,
          color: INDIGO,
        });
        
        // Section header text
        context.page.drawText(sectionLine, { 
          x: left, 
          y, 
          size: sectionHeaderSize, 
          font: fontBold, 
          color: BLACK 
        });
        
        y -= sectionLineHeight + 6;
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
          
          // Job title (bold, indigo)
          const titleLines = wrapText(jobTitle.trim(), fontBold, bodySize + 2, contentWidth - 30);
          for (const titleLine of titleLines) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              context.page.drawRectangle({
                x: 0,
                y: 0,
                width: 12,
                height: PAGE_HEIGHT,
                color: INDIGO,
              });
              y = PAGE_HEIGHT - 72;
            }
            drawTextWithBold(context.page, titleLine, left + 30, y, font, fontBold, bodySize + 2, INDIGO);
            y -= bodyLineHeight + 2;
          }
          
          // Company and period
          const formattedPeriod = formatDate(period.trim());
          const companyPeriodLine = `${companyName.trim()}  •  ${formattedPeriod}`;
          const companyPeriodLines = wrapText(companyPeriodLine, font, bodySize, contentWidth - 30);
          for (const line of companyPeriodLines) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              context.page.drawRectangle({
                x: 0,
                y: 0,
                width: 12,
                height: PAGE_HEIGHT,
                color: INDIGO,
              });
              y = PAGE_HEIGHT - 72;
            }
            drawTextWithBold(context.page, line, left + 30, y, font, fontBold, bodySize, MEDIUM_GRAY);
            y -= bodyLineHeight;
          }
          
          y -= 8;
        }
      } else {
        // Check if we're in Summary or Education section first
        const isSummaryOrEducation = currentSection === 'summary' || currentSection === 'education';
        
        if (isSummaryOrEducation) {
          // For Summary and Education, strip any existing bullets and use regular text wrapping
          const lineWithoutBullet = line.replace(/^[\-\·•]\s*/, '').trim();
          const wrapped = wrapText(lineWithoutBullet, font, bodySize, contentWidth - 30);
          
          for (const lineText of wrapped) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              context.page.drawRectangle({
                x: 0,
                y: 0,
                width: 12,
                height: PAGE_HEIGHT,
                color: INDIGO,
              });
              y = PAGE_HEIGHT - 72;
            }
            
            drawTextWithBold(context.page, lineText, left + 30, y, font, fontBold, bodySize, BLACK);
            y -= bodyLineHeight;
          }
        } else {
          const lineWithoutBullet = line.trim().replace(/^[·•]\s*/, '');
          const colonIndex = lineWithoutBullet.indexOf(':');
          // Check if we're in Technical Skills section
          const isTechnicalSkillsSection = currentSection === 'technical skills' || currentSection === 'skills';
          // A line is a skills category if it starts with bullet OR we're in Technical Skills section with a colon
          const isSkillsCategory = (line.startsWith('·') || line.startsWith('•')) || 
                                  (isTechnicalSkillsSection && colonIndex !== -1 && colonIndex < 50);
          
          if (isSkillsCategory && colonIndex !== -1) {
            // Split category name and skills text, render category name in bold
            const bulletSymbol = '•';
            const bulletWidth = font.widthOfTextAtSize(bulletSymbol + ' ', bodySize);
            
            const categoryName = lineWithoutBullet.substring(0, colonIndex + 1).trim();
            const skillsText = lineWithoutBullet.substring(colonIndex + 1).trim();
            
            const categoryWidth = fontBold.widthOfTextAtSize(categoryName, bodySize);
            const spaceWidth = font.widthOfTextAtSize(' ', bodySize);
            const skillsAvailableWidth = contentWidth - 30 - bulletWidth - categoryWidth - spaceWidth;
            
            const wrappedSkills = wrapText(skillsText, font, bodySize, skillsAvailableWidth);
            
            let currentX = left + 30;
            
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              context.page.drawRectangle({
                x: 0,
                y: 0,
                width: 12,
                height: PAGE_HEIGHT,
                color: INDIGO,
              });
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
                  context.page.drawRectangle({
                    x: 0,
                    y: 0,
                    width: 12,
                    height: PAGE_HEIGHT,
                    color: INDIGO,
                  });
                  y = PAGE_HEIGHT - 72;
                }
                context.page.drawText(wrappedSkills[i], {
                  x: left + 30 + bulletWidth,
                  y,
                  size: bodySize,
                  font,
                  color: BLACK
                });
              }
            }
            y -= bodyLineHeight + 2;
          } else {
            // For experience bullets and other content, add bullets if needed
            const wrapped = wrapTextWithIndent(line, font, bodySize, contentWidth - 30);
            for (let i = 0; i < wrapped.lines.length; i++) {
              if (y < marginBottom) {
                context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                context.page.drawRectangle({
                  x: 0,
                  y: 0,
                  width: 12,
                  height: PAGE_HEIGHT,
                  color: INDIGO,
                });
                y = PAGE_HEIGHT - 72;
              }
              const xPos = i === 0 ? left + 30 : left + 30 + wrapped.indentWidth;
              drawTextWithBold(context.page, wrapped.lines[i], xPos, y, font, fontBold, bodySize, BLACK);
              y -= bodyLineHeight;
            }
          }
        }
      }
    }
    
    if (y < marginBottom) {
      context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      context.page.drawRectangle({
        x: 0,
        y: 0,
        width: 12,
        height: PAGE_HEIGHT,
        color: INDIGO,
      });
      y = PAGE_HEIGHT - 72;
    }
  }
  
  return y;
}

// MODERN ACCENT BAR TEMPLATE - Left vertical accent bar with indigo color scheme
export async function renderTemplate3(context: TemplateContext): Promise<Uint8Array> {
  const { pdfDoc, page, font, fontBold, headline, name, email, phone, location, PAGE_WIDTH, PAGE_HEIGHT } = context;
  const BLACK = COLORS.BLACK;
  const MEDIUM_GRAY = COLORS.MEDIUM_GRAY;
  const INDIGO = rgb(0.25, 0.3, 0.6); // Indigo accent color
  const LIGHT_INDIGO = rgb(0.96, 0.97, 0.99); // Light indigo background
  
  const MARGIN_TOP = 70;
  const MARGIN_BOTTOM = 50;
  const MARGIN_LEFT = 50;
  const MARGIN_RIGHT = 50;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  
  const NAME_SIZE = 26;
  const CONTACT_SIZE = 9.5;
  const SECTION_HEADER_SIZE = 14;
  const BODY_SIZE = 9.5;
  
  // Draw left vertical accent bar
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 10,
    height: PAGE_HEIGHT,
    color: INDIGO,
  });
  
  let y = PAGE_HEIGHT - MARGIN_TOP;
  const left = MARGIN_LEFT;
  const right = PAGE_WIDTH - MARGIN_RIGHT;
  
  // Header section with light indigo background
  const headerHeight = 100;
  const headerY = PAGE_HEIGHT - headerHeight;
  page.drawRectangle({
    x: 12, // Start after accent bar
    y: headerY,
    width: PAGE_WIDTH - 12,
    height: headerHeight,
    color: LIGHT_INDIGO,
  });
  
  // Name in header (left-aligned, indigo)
  if (name) {
    const nameLines = wrapText(name, fontBold, NAME_SIZE, CONTENT_WIDTH);
    let nameY = PAGE_HEIGHT - 40;
    for (const line of nameLines) {
      page.drawText(line, { 
        x: left, 
        y: nameY, 
        size: NAME_SIZE, 
        font: fontBold, 
        color: INDIGO 
      });
      nameY -= NAME_SIZE * 0.9;
    }
    nameY -= 6;
    
    // Headline (under name, left-aligned, medium gray)
    if (headline) {
      const headlineSize = 10;
      const headlineLines = wrapText(headline, font, headlineSize, CONTENT_WIDTH);
      for (const line of headlineLines) {
        page.drawText(line, { 
          x: left, 
          y: nameY, 
          size: headlineSize, 
          font, 
          color: MEDIUM_GRAY 
        });
        nameY -= headlineSize * 1.2;
      }
    }
  }
  
  // Contact info in header (below name)
  const contactParts = [location, phone, email].filter(Boolean);
  if (contactParts.length > 0) {
    const contactLine = contactParts.join('  |  ');
    const contactLines = wrapText(contactLine, font, CONTACT_SIZE, CONTENT_WIDTH);
    let contactY = PAGE_HEIGHT - 70;
    for (const line of contactLines) {
      page.drawText(line, { 
        x: left, 
        y: contactY, 
        size: CONTACT_SIZE, 
        font, 
        color: MEDIUM_GRAY 
      });
      contactY -= CONTACT_SIZE * 1.3;
    }
  }
  
  // Start body content below header
  y = PAGE_HEIGHT - headerHeight - 30;
  
  // Render body content
  y = renderBodyContentTemplate3(
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
