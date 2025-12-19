import { NextRequest, NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';

// Helper to verify admin session
function isAuthenticated(req: NextRequest): boolean {
  const sessionToken = req.cookies.get('admin_session');
  return !!sessionToken;
}

// GET - Fetch all available templates from the templates folder
export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get the templates directory path
    const templatesDir = join(process.cwd(), 'app', 'api', 'generate-dynamic-resume-pdf', 'templates');
    
    // Read all files in the templates directory
    const files = await readdir(templatesDir);
    
    // Filter and extract template numbers from filenames (e.g., template2.ts -> 2)
    const templates = files
      .filter(file => file.startsWith('template') && file.endsWith('.ts'))
      .map(file => {
        // Extract number from filename (template2.ts -> 2)
        const match = file.match(/template(\d+)\.ts/);
        if (match) {
          const value = parseInt(match[1], 10);
          return {
            value,
            label: `Template${value}`
          };
        }
        return null;
      })
      .filter((template): template is { value: number; label: string } => template !== null)
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

