/**
 * Validates file type for wireframe uploads
 */
export function isValidWireframeFile(file: File): boolean {
  // 許可するファイルタイプ: PNG, JPEG, PDF
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
  return validTypes.includes(file.type)
}

/**
 * Generates unique file path for storage
 * プロジェクトIDとタイムスタンプを使って、被らないファイルパスを作ります
 * 例: "project-123/1634567890-my-design.png"
 */
export function generateWireframeFilePath(
  projectId: string,
  fileName: string
): string {
  const timestamp = Date.now()
  // ファイル名から怪しい文字を取り除きます
  const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${projectId}/${timestamp}-${sanitized}`
}

/**
 * Gets file type from MIME type
 * ファイルの種類を判定して 'image' か 'pdf' を返します
 */
export function getFileType(file: File): 'image' | 'pdf' {
  if (file.type === 'application/pdf') return 'pdf'
  return 'image'
}

/**
 * Formats file size for display
 * バイト数を人間が読みやすい形式（KB, MB）に変換します
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Max file size: 10MB
 * 最大ファイルサイズ制限
 */
export const MAX_WIREFRAME_FILE_SIZE = 10 * 1024 * 1024