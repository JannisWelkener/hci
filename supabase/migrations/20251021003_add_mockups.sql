-- =============================================
-- Function: check_project_membership
-- =============================================
-- ヘルパー関数：ユーザーがプロジェクトメンバーかを判定
CREATE OR REPLACE FUNCTION public.check_project_membership(
    p_user_id uuid,
    p_project_id uuid
)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.project_members
    WHERE project_id = p_project_id
      AND user_id = p_user_id   -- 正しいカラム名に変更
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Table: mockups
-- =============================================
CREATE TABLE public.mockups (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    creator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    
    title TEXT NOT NULL,
    description TEXT,
    
    figma_url TEXT NOT NULL,
    figma_embed_url TEXT NOT NULL,
    
    type TEXT DEFAULT 'design'::text NOT NULL,  -- 'design' | 'prototype' | 'figjam'

    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_mockups_project_id ON public.mockups(project_id);
CREATE INDEX idx_mockups_creator_id ON public.mockups(creator_id);

-- Enable RLS
ALTER TABLE public.mockups ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies
-- =============================================

-- SELECT: プロジェクトメンバーのみ閲覧可能
CREATE POLICY "Allow read access to project members"
    ON public.mockups
    FOR SELECT
    USING (
        public.check_project_membership(auth.uid(), project_id)
    );

-- INSERT: プロジェクトメンバーのみ追加可能
CREATE POLICY "Allow insert access to project members"
    ON public.mockups
    FOR INSERT
    WITH CHECK (
        public.check_project_membership(auth.uid(), project_id)
    );

-- UPDATE: プロジェクトメンバーのみ更新可能
CREATE POLICY "Allow update access to project members"
    ON public.mockups
    FOR UPDATE
    USING (
        public.check_project_membership(auth.uid(), project_id)
    );

-- DELETE: プロジェクトメンバーのみ削除可能
CREATE POLICY "Allow delete access to project members"
    ON public.mockups
    FOR DELETE
    USING (
        public.check_project_membership(auth.uid(), project_id)
    );
