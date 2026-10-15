"use client";

import * as React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { FeatureFormDialog } from "@/components/shared/FeatureFormDialog";
import { MockupForm, type MockupFormValues } from "./MockupForm";
import { useCreateMockup, useUpdateMockup } from "@/lib/hooks/use-mockups";
import type { Mockup, CreateMockupData } from "@/lib/types/database";

// (5) このコンポーネントが受け取る Props (引数) の型定義
interface MockupFormDialogProps {
  projectId: string; // ★★★どのプロジェクトに追加/編集するかを知るために必須★★★
  mockup?: Mockup | null; // 編集する場合の既存データ (任意)
  trigger?: React.ReactNode; // ダイアログを開くためのボタンなど (任意)
  open?: boolean; // ダイアログの開閉状態を親から制御する場合 (任意)
  onOpenChange?: (open: boolean) => void; // ダイアログの開閉状態が変わったときに親に通知 (任意)
  onSuccess?: (mockup: Mockup) => void; // 保存が成功したときに親に通知 (任意)
}

// --- ここから MockupFormDialog コンポーネント本体 ---
export function MockupFormDialog({
  projectId, // projectId を受け取る
  mockup,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
}: MockupFormDialogProps) {
  // mockup データがあれば編集モード、なければ新規作成モード
  const isEditMode = !!mockup;
  // ダイアログの開閉状態を管理 (親から制御されなければ内部で持つ)
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = controlledOnOpenChange || setInternalOpen;

  // (6) Phase 5 で作ったデータ操作フックを呼び出す
  // projectId が必要！
  const createMutation = useCreateMockup(projectId);
  // 更新フックには mockupId も必要だが、編集モードでなければ空文字でOK
  const updateMutation = useUpdateMockup(projectId, mockup?.id || '');

  // (7) MockupForm からデータが渡されたときの処理 (onSubmit)
  const handleSubmit = async (data: MockupFormValues) => {
    if (isEditMode && mockup) { // 編集モードの場合
      // 更新ミューテーションを実行
      // description が null や undefined の可能性もあるが、 ?.trim() で安全
      updateMutation.mutate(
        {
          title: data.title,
          description: data.description?.trim() === '' ? null : data.description,
          figma_url: data.figma_url,
          type: data.type,
        },
        {
          onSuccess: (updatedMockup) => {
            toast.success('Mockup updated successfully!');
            setIsOpen(false);
            onSuccess?.(updatedMockup);
          },
          onError: (error) => {
            toast.error(`Failed to update mockup: ${error.message}`);
          },
        }
      );
    } else { // 新規作成モードの場合
      // ↓↓↓ ここを修正しました ↓↓↓
      // description が null や undefined でないことを確認してから trim() を呼ぶ
      let finalDescription: string | null = null;
      if (data.description) { // null や undefined ではない場合
        const trimmed = data.description.trim();
        if (trimmed !== '') { // 空文字列でなければ
          finalDescription = trimmed;
        }
      }
      
      const dataForCreate: CreateMockupData = {
        title: data.title,
        description: finalDescription, // 整形後の description を使う
        figma_url: data.figma_url,
        type: data.type,
      };
      // ↑↑↑ ここまで修正 ↑↑↑

      // 作成ミューテーションを実行
      createMutation.mutate(dataForCreate, { 
        onSuccess: (newMockup) => {
          toast.success('Mockup created successfully!');
          setIsOpen(false);
          onSuccess?.(newMockup);
        },
        onError: (error) => {
          toast.error(`Failed to create mockup: ${error.message}`);
        },
      });
    }
  };

  // キャンセルボタンが押されたときの処理
  const handleCancel = () => {
    setIsOpen(false); // ダイアログを閉じる
  };

  // 保存中かどうかを判定
  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <FeatureFormDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title={isEditMode ? 'Edit Mockup' : 'Create Mockup'}
      description={
        isEditMode
          ? 'Update the details for this Figma mockup.'
          : 'Add a new Figma mockup link to your project.'
      }
      showFooter={false}
      maxWidth="3xl"
    >
      <MockupForm
        mockup={mockup}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </FeatureFormDialog>
  );
}

