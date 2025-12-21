import { NextRequest, NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/prisma';

// Helper to verify admin session
function isAuthenticated(req: NextRequest): boolean {
  const sessionToken = req.cookies.get('admin_session');
  return !!sessionToken;
}

// GET - Fetch all available templates from the templates folder with usage counts
export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get the templates directory path
    const templatesDir = join(process.cwd(), 'app', 'api', 'generate-dynamic-resume-pdf', 'templates');
    
    // Read all files in the templates directory
    const files = await readdir(templatesDir);
    
    // Get usage counts from database
    const profileCounts = await prisma.profile.groupBy({
      by: ['pdfTemplate'],
      _count: {
        pdfTemplate: true,
      },
    });

    // Create a map of template number to count
    const countMap = new Map<number, number>();
    profileCounts.forEach((item) => {
      countMap.set(item.pdfTemplate, item._count.pdfTemplate);
    });
    
    // Filter and extract template numbers from filenames (e.g., template2.ts -> 2)
    const templates = files
      .filter(file => file.startsWith('template') && file.endsWith('.ts'))
      .map(file => {
        // Extract number from filename (template2.ts -> 2)
        const match = file.match(/template(\d+)\.ts/);
        if (match) {
          const value = parseInt(match[1], 10);
          const usageCount = countMap.get(value) || 0;
          return {
            value,
            label: `Template${value}`,
            usageCount
          };
        }
        return null;
      })
      .filter((template): template is { value: number; label: string; usageCount: number } => template !== null)
      .sort((a, b) => a.value - b.value); // Sort by template number

    return NextResponse.json({ templates });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to read templates', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

