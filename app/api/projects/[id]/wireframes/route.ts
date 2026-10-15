import { createServerClient } from '@supabase/ssr'
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/env"
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { 
  generateWireframeFilePath, 
  isValidWireframeFile, 
  MAX_WIREFRAME_FILE_SIZE 
} from '@/lib/utils/upload'
import { convertFigmaUrlToEmbed } from '@/lib/utils/figma'

// ヘルパー関数: Supabaseクライアント作成
async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    getSupabaseUrl()!,
    getSupabaseAnonKey()!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Componentからの呼び出しなどでsetできない場合は無視
          }
        },
      },
    }
  )
}

// GET: 一覧取得
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('wireframes')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST: 新規作成 (ここがエラーの原因でした)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // 1. ログイン確認
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    
    const title = formData.get('title') as string
    const type = formData.get('type') as 'upload' | 'figma'
    const description = formData.get('description') as string | null
    const userStoryId = formData.get('user_story_id') as string | null
    const version = parseInt(formData.get('version') as string || '1')

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    let file_path = null
    let file_type = 'image'
    let figma_url = null
    let figma_embed_url = null

    if (type === 'upload') {
      const file = formData.get('file') as File
      
      if (!file) {
        return NextResponse.json({ error: 'File is required' }, { status: 400 })
      }

      if (!isValidWireframeFile(file)) {
        return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
      }
      if (file.size > MAX_WIREFRAME_FILE_SIZE) {
        return NextResponse.json({ error: 'File size too large (Max 10MB)' }, { status: 400 })
      }

      file_type = file.type === 'application/pdf' ? 'pdf' : 'image'

      const path = generateWireframeFilePath(id, file.name)

      const { error: uploadError } = await supabase
        .storage
        .from('wireframes')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
      }

      file_path = path

    } else if (type === 'figma') {
      figma_url = formData.get('figma_url') as string
      
      if (!figma_url) {
        return NextResponse.json({ error: 'Figma URL is required' }, { status: 400 })
      }
      
      figma_embed_url = convertFigmaUrlToEmbed(figma_url)
      file_type = 'figma'
    }

    const { data, error } = await supabase
      .from('wireframes')
      .insert({
        project_id: id,
        title,
        description,
        type,
        file_type,
        file_path,
        figma_url,
        figma_embed_url,
        version,
        user_story_id: userStoryId || null,
        user_id: session.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}