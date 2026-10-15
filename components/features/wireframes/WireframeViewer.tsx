import React from 'react'
import { getSupabaseUrl } from "@/lib/env"
import { Wireframe } from '@/lib/types/database'
import { FileText, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'

interface WireframeViewerProps {
  wireframe: Wireframe
  viewerRef?: React.RefObject<HTMLDivElement | null>
  actions?: React.ReactNode
}

export function WireframeViewer({ wireframe, viewerRef, actions }: WireframeViewerProps) {
  // Supabase Storageの公開URLを構築
  // 環境変数 NEXT_PUBLIC_SUPABASE_URL が設定されている前提です
  const getStorageUrl = (path: string) => {
    const baseUrl = getSupabaseUrl()
    if (!baseUrl) return ''
    return `${baseUrl}/storage/v1/object/public/wireframes/${path}`
  }

  const fileUrl = wireframe.file_path ? getStorageUrl(wireframe.file_path) : ''

  return (
    <div className="space-y-6">
      {/* --- ヘッダー部分 (タイトル・メタデータ) --- */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold">{wireframe.title}</h2>
            <Badge variant="secondary">v{wireframe.version}</Badge>
          </div>

          {wireframe.description && (
            <p className="text-muted-foreground">{wireframe.description}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(wireframe.created_at), 'MMM dd, yyyy')}</span>
            </div>
            {wireframe.user_story_id && (
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>Linked to User Story</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions buttons at title level */}
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>

      <Separator />

      {/* --- メインコンテンツエリア (ビューア) --- */}
      <div ref={viewerRef} className="relative bg-muted rounded-lg overflow-hidden border flex items-center justify-center p-4 min-h-[600px]">
        {/* 1. 画像の場合 */}
        {wireframe.type === 'upload' && wireframe.file_type === 'image' && (
          <img
            src={fileUrl}
            alt={wireframe.title}
            className="max-w-full max-h-[800px] object-contain rounded-sm bg-card shadow-lg"
          />
        )}

        {/* 2. PDFの場合 */}
        {wireframe.type === 'upload' && wireframe.file_type === 'pdf' && (
          <div className="w-full h-full min-h-[600px]">
            <iframe
              src={`${fileUrl}#toolbar=0`}
              className="w-full h-full rounded shadow-lg bg-card"
              title={wireframe.title}
            />
            {/* モバイルなどでiframeが見られない場合のフォールバック */}
            <div className="mt-2 text-center text-sm text-muted-foreground md:hidden">
              <a href={fileUrl} target="_blank" rel="noreferrer" className="underline">
                Click here if PDF doesn&apos;t load
              </a>
            </div>
          </div>
        )}

        {/* 3. Figmaの場合 */}
        {wireframe.type === 'figma' && wireframe.figma_embed_url && (
          <iframe
            src={wireframe.figma_embed_url}
            className="w-full h-full min-h-[600px] rounded shadow-lg bg-card border-0"
            allowFullScreen
            title={wireframe.title}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        )}
      </div>
    </div>
  )
}