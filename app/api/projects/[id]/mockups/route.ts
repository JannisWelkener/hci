// File: app/api/projects/[id]/mockups/route.ts

import { createClient } from '@/lib/supabase/server';
import {
  convertFigmaUrlToEmbed,
  isFigmaUrl,
} from '@/lib/utils/figma'; // <-- Phase 3
import { type CreateMockupData } from '@/lib/types/database'; // <-- Phase 2
import { type NextRequest, NextResponse } from 'next/server'; // <--- NextRequest をインポート
import { z } from 'zod';


// Zod schema for validating the POST request body
const createSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable(),
  figma_url: z
    .string()
    .url('Invalid URL format')
    .refine(isFigmaUrl, 'Must be a valid Figma URL'), // <-- Phase 3
  type: z.enum(['design', 'prototype', 'figjam']),
});

/**
 * @method POST
 * @description Create new mockup
 */
export async function POST(
  request: NextRequest,
  // 引数の型定義 (Promise を期待する tsc エラーに対応)
  context: { params: Promise<{ id: string }> }
) {
  // --- Promise を解決してから params を使う ---
  const params = await context.params;
  const projectId = params.id;
  // --- End Await ---

  // 1. Authenticate user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Validate request body (Zod)
  const body = await request.json();
  const validation = createSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.format() },
      { status: 400 }
    );
  }

  const { title, description, figma_url, type } = validation.data;

  // 3. Convert Figma URL (using Phase 3 logic)
  const figma_embed_url = convertFigmaUrlToEmbed(figma_url);

  if (!figma_embed_url) {
    return NextResponse.json(
      { error: 'Failed to convert Figma URL.' },
      { status: 400 }
    );
  }

  // 4. Prepare data for Supabase
  const mockupData = {
    project_id: projectId, // Use the resolved projectId
    creator_id: user.id,
    title,
    description,
    figma_url,
    figma_embed_url,
    type,
  };

  // 5. Query Supabase (insert)
  try {
    const { data, error } = await supabase
      .from('mockups')
      .insert(mockupData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating mockup:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // 6. Return JSON response
    return NextResponse.json(data, { status: 201 });

  } catch (err: any) {
    console.error("Unexpected error in POST handler:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * @method GET
 * @description List all mockups for a project
 */
export async function GET(
  request: NextRequest,
  // 引数の型定義 (Promise を期待する tsc エラーに対応)
  context: { params: Promise<{ id: string }> }
) {
  // --- Promise を解決してから params を使う ---
  const params = await context.params;
  const projectId = params.id;
  // --- End Await ---

  // 1. Authenticate user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!projectId) {
     // This check might be redundant if params promise resolves correctly
     console.warn("Project ID was missing after awaiting params");
     return NextResponse.json({ error: 'Project ID is missing' }, { status: 400 });
  }

  // 2. Query Supabase (select ALL)
  try {
    const { data, error } = await supabase
      .from('mockups')
      .select('*')
      .eq('project_id', projectId) // Use the resolved projectId
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error during GET:', error.message, 'ProjectId used:', projectId);
      if (error.message.includes('invalid input syntax for type uuid')) {
        // Ensure projectId is a valid UUID format before this point if possible
        return NextResponse.json({ error: `Invalid Project ID format: ${projectId}` }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // 3. Return JSON response
    return NextResponse.json(data);

  } catch (err: any) {
      console.error("Unexpected error in GET handler:", err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

