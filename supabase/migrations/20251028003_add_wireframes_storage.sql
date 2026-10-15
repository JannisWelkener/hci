-- Create storage bucket for wireframes
INSERT INTO storage.buckets (id, name, public)
VALUES ('wireframes', 'wireframes', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Authenticated users can upload wireframes
CREATE POLICY "Authenticated users can upload wireframes"
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'wireframes');

-- Policy: Users can read wireframes in their projects
CREATE POLICY "Users can read wireframes in their projects"
ON storage.objects FOR SELECT 
TO authenticated
USING (
  bucket_id = 'wireframes' AND
  EXISTS (
    SELECT 1 FROM wireframes w
    JOIN projects p ON w.project_id = p.id
    WHERE w.file_path = name
      AND (p.user_id = auth.uid()) -- ★ 修正点: p.members への参照を削除 (p.created_by も user_id に修正)
  )
);

-- Policy: Users can delete their own wireframes
CREATE POLICY "Users can delete their wireframes"
ON storage.objects FOR DELETE 
TO authenticated
USING (
  bucket_id = 'wireframes' AND
  EXISTS (
    SELECT 1 FROM wireframes w
    WHERE w.file_path = name 
    AND w.user_id = auth.uid() -- ★ 修正点: created_by -> user_id
  )
);