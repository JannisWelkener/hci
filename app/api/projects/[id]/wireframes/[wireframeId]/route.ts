import { createServerClient } from '@supabase/ssr'
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/env"
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// --- ヘルパー関数: Supabaseクライアントの作成 ---
// (先ほどの route.ts と同じものです)
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

// DELETE: ワイヤーフレームの削除
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; wireframeId: string }> }
) {
  // paramsをawaitする
  const { wireframeId } = await params
  const supabase = await createClient()

  // 1. 削除対象のワイヤーフレーム情報を取得（ファイルパスを知るため）
  const { data: wireframe, error: fetchError } = await supabase
    .from('wireframes')
    .select('*')
    .eq('id', wireframeId)
    .single()

  if (fetchError || !wireframe) {
    return NextResponse.json({ error: 'Wireframe not found' }, { status: 404 })
  }

  // 2. ファイルアップロード型なら、Storageからも削除
  if (wireframe.type === 'upload' && wireframe.file_path) {
    const { error: storageError } = await supabase
      .storage
      .from('wireframes')
      .remove([wireframe.file_path])

    if (storageError) {
      console.error('Storage delete error:', storageError)
      // Storage削除に失敗しても、DB削除は試みるために続行します
    }
  }

  // 3. データベースから削除
  const { error } = await supabase
    .from('wireframes')
    .delete()
    .eq('id', wireframeId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// PATCH: ワイヤーフレーム情報の更新（タイトルやメモなど）
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; wireframeId: string }> }
) {
  // paramsをawaitする
  const { wireframeId } = await params
  const supabase = await createClient()

  try {
    const json = await request.json()
    
    // 更新処理
    const { data, error } = await supabase
      .from('wireframes')
      .update({
        title: json.title,
        description: json.description,
        user_story_id: json.user_story_id,
        updated_at: new Date().toISOString() 
      })
      .eq('id', wireframeId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}