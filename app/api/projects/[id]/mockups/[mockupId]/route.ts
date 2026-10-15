// File: app/api/projects/[id]/mockups/[mockupId]/route.ts

import { createClient } from '@/lib/supabase/server';
import {
  convertFigmaUrlToEmbed,
  isFigmaUrl,
} from '@/lib/utils/figma'; // <-- Phase 3
import { type NextRequest, NextResponse } from 'next/server'; // <--- NextRequest をインポート
import { z } from 'zod';

// Zod schema for validating the PATCH request body (all fields optional)
const updateSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().nullable().optional(),
  figma_url: z
    .string()
    .url('Invalid URL format')
    .refine(isFigmaUrl, 'Must be a valid Figma URL') // <-- Phase 3
    .optional(),
  type: z.enum(['design', 'prototype', 'figjam']).optional(),
});

/**
 * @method GET
 * @description Get single mockup
 */
export async function GET(
  request: NextRequest,
  // 引数の型定義 (Promise を期待する tsc エラーに対応)
  context: { params: Promise<{ id: string; mockupId: string }> }
) {
  // --- Promise を解決してから params を使う ---
  const params = await context.params;
  const projectId = params.id;
  const mockupId = params.mockupId;
  // --- End Await ---

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Query Supabase (select 1 row)
  try {
    const { data, error } = await supabase
      .from('mockups')
      .select('*')
      .eq('id', mockupId) // Use the resolved mockupId
      .eq('project_id', projectId) // Use the resolved projectId
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found is a 404
        return NextResponse.json({ error: 'Mockup not found' }, { status: 404 });
      }
      console.error('Supabase error getting mockup:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (err: any) {
      console.error("Unexpected error in GET handler:", err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * @method PATCH
 * @description Update mockup
 */
export async function PATCH(
  request: NextRequest,
  // 引数の型定義 (Promise を期待する tsc エラーに対応)
  context: { params: Promise<{ id: string; mockupId: string }> }
) {
  // --- Promise を解決してから params を使う ---
  const params = await context.params;
  const projectId = params.id;
  const mockupId = params.mockupId;
  // --- End Await ---

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate with Zod
  let body;
  try {
     body = await request.json();
  } catch (e) {
     return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const validation = updateSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.format() },
      { status: 400 }
    );
  }
  // Don't process empty updates
  if (Object.keys(validation.data).length === 0) {
      return NextResponse.json({ error: 'No fields provided for update.' }, { status: 400 });
  }

  const { title, description, figma_url, type } = validation.data;

  // Create an update object, avoid setting fields to undefined
  const updateData: { [key: string]: any } = {};
  if (title !== undefined) updateData.title = title;
  // Handle description explicitly to allow setting it to null
  if (description !== undefined) {
      updateData.description = description === '' ? null : description;
  }
  if (type !== undefined) updateData.type = type;

  // If figma_url is being updated, update embed_url as well (Phase 3)
  if (figma_url !== undefined) {
    updateData.figma_url = figma_url; // Set the new original URL
    if (figma_url === null || figma_url === '') { // Allow clearing the URL? Needs requirement check. For now assume URL is required if passed.
         return NextResponse.json({ error: 'Figma URL cannot be empty if provided.' }, { status: 400 });
    }
    const newEmbedUrl = convertFigmaUrlToEmbed(figma_url);
    if (!newEmbedUrl) {
      return NextResponse.json(
        { error: 'Failed to convert new Figma URL.' },
        { status: 400 }
      );
    }
    updateData.figma_embed_url = newEmbedUrl; // Set the new embed URL
  }

  // Ensure there's something to update
  if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided for update.' }, { status: 400 });
  }


  // Query Supabase (update)
  try {
    const { data, error } = await supabase
      .from('mockups')
      .update(updateData)
      .eq('id', mockupId) // Use the resolved mockupId
      .eq('project_id', projectId) // Use the resolved projectId
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating mockup:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);

   } catch (err: any) {
      console.error("Unexpected error in PATCH handler:", err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * @method DELETE
 * @description Delete mockup
 */
export async function DELETE(
  request: NextRequest,
  // 引数の型定義 (Promise を期待する tsc エラーに対応)
  context: { params: Promise<{ id: string; mockupId: string }> }
) {
  // --- Promise を解決してから params を使う ---
  const params = await context.params;
  const projectId = params.id;
  const mockupId = params.mockupId;
  // --- End Await ---

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Query Supabase (delete)
  try {
    const { error } = await supabase
      .from('mockups')
      .delete()
      .eq('id', mockupId) // Use the resolved mockupId
      .eq('project_id', projectId); // Use the resolved projectId

    if (error) {
      console.error('Supabase error deleting mockup:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return "204 No Content" on successful deletion
    return new NextResponse(null, { status: 204 });

   } catch (err: any) {
      console.error("Unexpected error in DELETE handler:", err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

