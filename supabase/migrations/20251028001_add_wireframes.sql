-- Create wireframes table
CREATE TABLE wireframes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('upload', 'figma')),
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'pdf', 'figma')),
  file_path TEXT,
  figma_url TEXT,
  figma_embed_url TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  user_story_id UUID REFERENCES user_stories(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id), -- ここはあなたの修正(created_by -> user_id)を反映済み
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_wireframes_project_id ON wireframes(project_id);
CREATE INDEX idx_wireframes_user_story_id ON wireframes(user_story_id);
CREATE INDEX idx_wireframes_version ON wireframes(project_id, title, version);
CREATE INDEX idx_wireframes_user_id ON wireframes(user_id); -- あなたの修正を反映済み

-- Enable Row Level Security
ALTER TABLE wireframes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view wireframes in their projects
CREATE POLICY "Users can view wireframes in their projects"
ON wireframes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = wireframes.project_id
    AND (projects.user_id = auth.uid()) -- ★ 修正点: 'members' への参照を削除
  )
);

-- RLS Policy: Users can create wireframes in their projects
CREATE POLICY "Users can create wireframes in their projects"
ON wireframes FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = wireframes.project_id
    AND (projects.user_id = auth.uid()) -- ★ 修正点: 'members' への参照を削除
  )
);

-- RLS Policy: Users can update wireframes in their projects
CREATE POLICY "Users can update wireframes in their projects"
ON wireframes FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = wireframes.project_id
    AND (projects.user_id = auth.uid()) -- ★ 修正点: 'members' への参照を削除
  )
);

-- RLS Policy: Users can delete their own wireframes
CREATE POLICY "Users can delete their wireframes"
ON wireframes FOR DELETE
TO authenticated
USING (user_id = auth.uid()); -- あなたの修正を反映済み

-- Trigger for automatic updated_at timestamp
CREATE TRIGGER update_wireframes_updated_at
  BEFORE UPDATE ON wireframes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();