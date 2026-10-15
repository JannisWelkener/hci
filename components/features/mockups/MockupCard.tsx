// (1) 必要なモジュールをインポートします
"use client"; // クライアントサイドで動作することを示す

import * as React from 'react';
import type { Mockup, MockupType } from '@/lib/types/database'; // Mockup の型定義
import { usePrefetchMockup } from '@/lib/hooks/use-mockups'; // プリフェッチフック
import { Badge } from '@/components/ui/badge'; // バッジ表示用
import { Button } from '@/components/ui/button'; // ボタン
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'; // カード部品
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'; // ドロップダウンメニュー
import { EllipsisVertical, Eye, Pencil, Trash2, ExternalLink } from 'lucide-react'; // アイコン

// (2) 'type' フィールドの表示名 (MockupForm と同じもの)
const MOCKUP_TYPE_LABELS: Record<MockupType, string> = {
  design: 'Design',
  prototype: 'Prototype',
  figjam: 'FigJam',
};

// (3) バッジの色分け (任意) - 見た目を良くするため
const TYPE_BADGE_COLORS: Record<MockupType, string> = {
  design: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  prototype: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  figjam: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
};

// (4) このコンポーネントが受け取る Props (引数) の型定義
interface MockupCardProps {
  mockup: Mockup; // 表示する Mockup データ
  projectId: string; // プロジェクトID（プリフェッチ用）
  onView: (mockup: Mockup) => void; // 「表示」がクリックされたときの関数
  onEdit: (mockup: Mockup) => void; // 「編集」がクリックされたときの関数
  onDelete: (mockup: Mockup) => void; // 「削除」がクリックされたときの関数
}

// --- ここから MockupCard コンポーネント本体 ---
export function MockupCard({
  mockup,
  projectId,
  onView,
  onEdit,
  onDelete,
}: MockupCardProps) {
  // プリフェッチフックを使用してパフォーマンスを向上
  const prefetchMockup = usePrefetchMockup(projectId);

  // (5) カード全体がクリックされたときの処理 (onView を呼び出す)
  // ProjectCard の handleCardClick とほぼ同じ
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // ドロップダウンメニューのトリガーボタンからのクリックは無視する
    // data-* 属性を使ってトリガー要素か判定 (より安全な方法)
    if ((e.target as HTMLElement).closest('[data-radix-dropdown-menu-trigger]')) {
      return;
    }
    onView(mockup); // onView を呼び出す
  };

  // ホバー時にプリフェッチして、詳細ビューを開いた時の読み込みを高速化
  const handleMouseEnter = () => {
    prefetchMockup(mockup.id);
  };

  // (6) ドロップダウンメニューの項目が選択されたときの処理
  const handleDropdownSelect = (action: 'view' | 'edit' | 'delete' | 'open') => {
    switch (action) {
      case 'view':
        onView(mockup);
        break;
      case 'edit':
        onEdit(mockup);
        break;
      case 'delete':
        onDelete(mockup);
        break;
      case 'open':
        // Figmaで開く (新しいタブで)
        window.open(mockup.figma_url, '_blank', 'noopener,noreferrer');
        break;
    }
  };


  // (7) ここから下がカードの「見た目」を定義する JSX コードです
  return (
    // Card コンポーネントを使用 (ProjectCard と同じ)
    // onClick でカード全体をクリック可能に
    // cursor-pointer でマウスカーソルを指マークに
    // onMouseEnter でホバー時にプリフェッチ
    <Card
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
    >
      {/* --- カードヘッダー: タイトルとドロップダウンメニュー --- */}
      {/* ProjectCard のヘッダー構造を流用 */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        {/* CardTitle に mockup.title を表示 (truncate で長すぎる場合に省略記号) */}
        <CardTitle className="text-sm font-medium truncate">{mockup.title}</CardTitle>
        {/* ドロップダウンメニュー (ProjectCard からアイコンとメニュー項目を変更) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {/* 縦三点リーダーアイコンのボタン (ProjectCard では MoreVertical だったのを変更) */}
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              data-radix-dropdown-menu-trigger // クリック判定用に属性を追加
              onClick={(e) => e.stopPropagation()} // カード全体のクリックを防ぐ
             >
              <span className="sr-only">Open menu</span>
              <EllipsisVertical className="h-4 w-4" /> {/* アイコン変更 */}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* メニュー項目を Mockup 用に変更 */}
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDropdownSelect('view'); }}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDropdownSelect('edit'); }}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDropdownSelect('open'); }}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in Figma
            </DropdownMenuItem>
            <DropdownMenuSeparator /> {/* 区切り線 */}
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 dark:text-red-500 dark:focus:text-red-500" // 削除は赤文字に
              onClick={(e) => { e.stopPropagation(); handleDropdownSelect('delete'); }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      {/* --- カード内容: Figmaプレビューと説明文 --- */}
      {/* ProjectCard の CardContent 内を Mockup 用に大幅に変更 */}
      <CardContent className="flex-grow pt-0 flex flex-col gap-2">
        {/* Figma プレビュー (小さい iframe) を追加 */}
        {/* pointer-events-none で iframe 内の操作を無効化 */}
        <div className="relative aspect-video bg-slate-200 dark:bg-slate-700 rounded overflow-hidden pointer-events-none">
           <iframe
              src={mockup.figma_embed_url} // 埋め込み URL を使用
              className="absolute top-0 left-0 w-full h-full border-0"
              title={`${mockup.title} preview`} // アクセシビリティのため
              sandbox="allow-scripts allow-same-origin" // セキュリティ設定 (Figma レンダリングに必要)
              loading="lazy" // 遅延読み込みでパフォーマンス向上
           />
        </div>
        {/* 説明文 (短く表示) - ProjectCard の CardDescription を流用 */}
        <CardDescription className="text-xs line-clamp-2"> {/* line-clamp-2 で最大2行表示 */}
          {mockup.description || 'No description provided.'} {/* 説明がなければ代替テキスト */}
        </CardDescription>
      </CardContent>

      {/* --- カードフッター: 種類バッジ --- */}
      {/* ProjectCard の CardFooter 内を Mockup の Type バッジに変更 */}
      <CardFooter className="pt-2">
        <Badge
          variant="outline" // 枠線付きバッジ
          className={`text-xs ${TYPE_BADGE_COLORS[mockup.type]}`} // 色分けクラスを適用
        >
          {MOCKUP_TYPE_LABELS[mockup.type]} {/* 表示名を表示 */}
        </Badge>
      </CardFooter>
    </Card>
  );
}

