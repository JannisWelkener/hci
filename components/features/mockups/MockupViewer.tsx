// (1) 必要なモジュールをインポートします
"use client"; // クライアントサイドで動作することを示す

import * as React from 'react';
import type { Mockup } from '@/lib/types/database'; // Mockup の型定義
import { Separator } from '@/components/ui/separator'; // セパレーター部品
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

// (2) このコンポーネントが受け取る Props (引数) の型定義
interface MockupViewerProps {
  mockup: Mockup; // 表示する Mockup データ
  viewerRef?: React.RefObject<HTMLDivElement | null>; // Optional ref for fullscreen
  actions?: React.ReactNode; // Action buttons at title level
}

// --- ここから MockupViewer コンポーネント本体 ---
export function MockupViewer({ mockup, viewerRef, actions }: MockupViewerProps) {


  // (6) ここから下が「見た目」を定義する JSX コードです
  return (
    <div className="space-y-6">
      {/* --- ヘッダー部分: タイトル、説明 --- */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold mb-2">{mockup.title}</h2>
          {mockup.description && (
            <p className="text-muted-foreground">{mockup.description}</p>
          )}
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-3">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(mockup.created_at), 'MMM dd, yyyy')}</span>
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

      {/* --- Figma 埋め込み部分 --- */}
      <div ref={viewerRef} className="relative aspect-video bg-muted rounded-lg overflow-hidden border">
        <iframe
          src={mockup.figma_embed_url}
          className="absolute top-0 left-0 w-full h-full border-0"
          allowFullScreen
          title={mockup.title}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </div>
  );
}
