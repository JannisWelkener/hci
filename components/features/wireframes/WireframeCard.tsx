'use client'
import { getSupabaseUrl } from "@/lib/env"

import React from 'react'
import { Wireframe } from '@/lib/types/database'
import { usePrefetchWireframe } from '@/lib/hooks/use-wireframes'
import { convertFigmaUrlToEmbed } from '@/lib/utils/figma'
import { FileText, Figma, Image as ImageIcon, Trash2, Eye, MoreVertical, Pencil } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface WireframeCardProps {
  wireframe: Wireframe
  projectId: string
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
  onEdit?: (wireframe: Wireframe) => void
}

export function WireframeCard({ wireframe, projectId, onClick, onDelete, onEdit }: WireframeCardProps) {
  // プリフェッチフックを使用してパフォーマンスを向上
  const prefetchWireframe = usePrefetchWireframe(projectId)

  // Storage画像URLを生成
  const getImageUrl = (path: string) => {
    const baseUrl = getSupabaseUrl()
    if (!baseUrl) return ''
    return `${baseUrl}/storage/v1/object/public/wireframes/${path}`
  }

  // ファイルタイプに応じたアイコン/サムネイルを決定
  const renderThumbnail = () => {
    // 1. 画像アップロードの場合
    if (wireframe.type === 'upload' && wireframe.file_type === 'image' && wireframe.file_path) {
      return (
        <div className="w-full h-full relative bg-muted">
          <img
            src={getImageUrl(wireframe.file_path)}
            alt={wireframe.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )
    }

    // 2. Figmaの場合 - iframe プレビューを表示
    if (wireframe.type === 'figma') {
      // figma_embed_url があればそれを使用、なければ figma_url から変換
      const embedUrl = wireframe.figma_embed_url ||
                       (wireframe.figma_url ? convertFigmaUrlToEmbed(wireframe.figma_url) : null)

      if (embedUrl) {
        return (
          <div className="w-full h-full relative bg-slate-200 dark:bg-slate-700 pointer-events-none">
            <iframe
              src={embedUrl}
              className="absolute top-0 left-0 w-full h-full border-0"
              title={`${wireframe.title} preview`}
              sandbox="allow-scripts allow-same-origin"
              loading="lazy"
            />
          </div>
        )
      }
    }

    // 3. PDF や Figma embed URL がない場合のアイコン表示
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/50 text-muted-foreground">
        {wireframe.file_type === 'pdf' ? (
          <FileText className="w-12 h-12 text-red-500" />
        ) : wireframe.type === 'figma' ? (
          <Figma className="w-12 h-12 text-purple-500" />
        ) : (
          <ImageIcon className="w-12 h-12" />
        )}
      </div>
    )
  }

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-radix-dropdown-menu-trigger]')) {
      return
    }
    onClick()
  }

  // ホバー時にプリフェッチして、詳細ビューを開いた時の読み込みを高速化
  const handleMouseEnter = () => {
    prefetchWireframe(wireframe.id)
  }

  return (
    <Card
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium truncate">{wireframe.title}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              data-radix-dropdown-menu-trigger
              onClick={(e) => e.stopPropagation()}
            >
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(); }}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            {onEdit && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(wireframe); }}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 dark:text-red-500 dark:focus:text-red-500"
              onClick={(e) => { e.stopPropagation(); onDelete(e); }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="flex-grow pt-0 flex flex-col gap-2">
        <div className="aspect-video w-full rounded overflow-hidden">
          {renderThumbnail()}
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date(wireframe.created_at).toLocaleDateString()}
        </p>
      </CardContent>

      <CardFooter className="pt-2 flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          v{wireframe.version}
        </Badge>
        {wireframe.user_story_id && (
          <Badge variant="secondary" className="text-xs">
            <FileText className="mr-1 h-3 w-3" />
            Linked Story
          </Badge>
        )}
      </CardFooter>
    </Card>
  )
}