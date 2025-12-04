import { PDFPage, rgb } from 'pdf-lib';
import { TemplateContext, wrapText, wrapTextWithIndent, formatDate, drawTextWithBold, COLORS } from '../utils';

// Template 1 Body Content Renderer - Minimalist style with colored section markers
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
  const DEEP_PURPLE = rgb(0.3, 0.2, 0.4); // Deep purple accent

  const bodyLines = body.split('\n');
  let firstJob = true;

  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i].trim();
    if (!line) {
      y -= 6;
      continue;
    }

    if (line.endsWith(':')) {
      y -= 18;
      const sectionHeader = line.slice(0, -1);
      const sectionLines = wrapText(sectionHeader, fontBold, sectionHeaderSize, contentWidth - 30);

      for (const sectionLine of sectionLines) {
        if (y < marginBottom) {
          context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          y = PAGE_HEIGHT - 72;
        }

        // Draw colored square marker before section header
        const squareSize = sectionHeaderSize * 0.6;
        context.page.drawRectangle({
          x: left,
          y: y,
          width: squareSize,
          height: squareSize,
          color: DEEP_PURPLE,
        });

        // Section header text next to the square
        context.page.drawText(sectionLine, {
          x: left + squareSize + 8,
          y,
          size: sectionHeaderSize,
          font: fontBold,
          color: BLACK
        });

        y -= sectionLineHeight;
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

          // Job title (bold, larger)
          const titleLines = wrapText(jobTitle.trim(), fontBold, bodySize, contentWidth - 20);
          for (const titleLine of titleLines) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              y = PAGE_HEIGHT - 72;
            }
            drawTextWithBold(context.page, titleLine, left + 20, y, font, fontBold, bodySize, BLACK);
            y -= bodyLineHeight + 2;
          }

          // Company name and period on separate lines
          const formattedPeriod = formatDate(period.trim());

          // Company name
          const companyLines = wrapText(companyName.trim(), font, bodySize, contentWidth - 20);
          for (const line of companyLines) {
            if (y < marginBottom) {
              context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              y = PAGE_HEIGHT - 72;
            }
            drawTextWithBold(context.page, line, left + 20, y, font, fontBold, bodySize, BLACK);
            y -= bodyLineHeight;
          }

          // Period in italic style (using smaller size and gray)
          if (y < marginBottom) {
            context.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            y = PAGE_HEIGHT - 72;
          }
          context.page.drawText(formattedPeriod, {
            x: left + 20,
            y,
            size: bodySize - 1,
            font,
            color: MEDIUM_GRAY
          });
          y -= bodyLineHeight + 3;
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
          let currentX = left + 20;
          
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
            currentX += categoryWidth;
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
                x: left + 20 + bulletWidth,
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
            const xPos = i === 0 ? left + 20 : left + 20 + wrapped.indentWidth;
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

// MINIMALIST TEMPLATE - Clean design with top border and colored section markers
export async function renderTemplate1(context: TemplateContext): Promise<Uint8Array> {
  const { pdfDoc, page, font, fontBold, name, email, phone, location, PAGE_WIDTH, PAGE_HEIGHT } = context;
  const BLACK = COLORS.BLACK;
  const MEDIUM_GRAY = COLORS.MEDIUM_GRAY;
  const DEEP_PURPLE = rgb(0.3, 0.2, 0.4); // Deep purple accent color

  const MARGIN_TOP = 70;
  const MARGIN_BOTTOM = 50;
  const MARGIN_LEFT = 60;
  const MARGIN_RIGHT = 60;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

  const NAME_SIZE = 32;
  const CONTACT_SIZE = 10;
  const SECTION_HEADER_SIZE = 15;
  const BODY_SIZE = 10;


  let y = PAGE_HEIGHT - 60;
  const left = MARGIN_LEFT;
  const right = PAGE_WIDTH - MARGIN_RIGHT;

  // Name (left-aligned, regular case, deep purple)
  if (name) {
    const nameLines = wrapText(name, fontBold, NAME_SIZE, CONTENT_WIDTH);
    for (const line of nameLines) {
      page.drawText(line, {
        x: left,
        y,
        size: NAME_SIZE,
        font: fontBold,
        color: DEEP_PURPLE
      });
      y -= NAME_SIZE * 0.9;
    }
  }

  // Contact info in horizontal layout (left-aligned, separated by vertical bars)
  const contactParts = [location, phone, email].filter(Boolean);
  if (contactParts.length > 0) {
    const contactLine = contactParts.join('  |  ');
    const contactLines = wrapText(contactLine, font, CONTACT_SIZE, CONTENT_WIDTH);
    for (const line of contactLines) {
      page.drawText(line, {
        x: left,
        y,
        size: CONTACT_SIZE,
        font,
        color: MEDIUM_GRAY
      });
      y -= CONTACT_SIZE * 1.4;
    }
    y -= 20;
  }
  // Draw thin top border in deep purple
  page.drawLine({
    start: { x: 0, y: PAGE_HEIGHT  - 70 },
    end: { x: PAGE_WIDTH, y: PAGE_HEIGHT - 70},
    thickness: 4,
    color: DEEP_PURPLE,
  });


  // Render body content
  y = renderBodyContentTemplate1(
    context,
    y,
    left,
    right,
    CONTENT_WIDTH,
    BODY_SIZE,
    BODY_SIZE * 1.5,
    SECTION_HEADER_SIZE,
    SECTION_HEADER_SIZE * 1.3,
    MARGIN_BOTTOM
  );

  return await pdfDoc.save();
}
