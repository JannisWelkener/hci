import React, { useCallback } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { UploadCloud, X, File as FileIcon, AlertCircle } from 'lucide-react'
import { formatFileSize, isValidWireframeFile, MAX_WIREFRAME_FILE_SIZE } from '@/lib/utils/upload'

interface FileDropzoneProps {
  onFileSelect: (file: File) => void
  selectedFile?: File | null
  onClear?: () => void
  disabled?: boolean
}

export function FileDropzone({
  onFileSelect,
  selectedFile,
  onClear,
  disabled = false
}: FileDropzoneProps) {
  
  // ファイルがドロップされた時の処理
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0])
    }
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    maxFiles: 1, // 1ファイルのみ
    maxSize: MAX_WIREFRAME_FILE_SIZE, // 10MB制限
    accept: {
      'image/png': [],
      'image/jpeg': [],
      'image/jpg': [],
      'application/pdf': []
    },
    disabled: disabled || !!selectedFile
  })

  // ファイルが選択されている場合の表示
  if (selectedFile) {
    return (
      <div className="relative border border-border rounded-lg p-4 bg-card flex items-center gap-4">
        <div className="bg-secondary p-2 rounded border border-border shadow-sm">
          {selectedFile.type.startsWith('image/') ? (
            // 画像プレビュー
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="Preview"
              className="w-10 h-10 object-cover rounded"
              onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)} // メモリ解放
            />
          ) : (
            // PDFアイコン
            <FileIcon className="w-10 h-10 text-primary" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{selectedFile.name}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
        </div>

        {onClear && !disabled && (
          <button
            type="button"
            onClick={onClear}
            className="p-1 hover:bg-accent rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>
    )
  }

  // エラーがある場合 (ファイルサイズオーバーなど)
  const rejection = fileRejections[0]

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragActive
            ? 'border-primary bg-accent'
            : 'border-border hover:border-muted-foreground hover:bg-accent/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-secondary rounded-full">
            <UploadCloud className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {isDragActive ? 'Drop the file here' : 'Click or drag file to upload'}
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG or PDF (max 10MB)
            </p>
          </div>
        </div>
      </div>

      {/* エラーメッセージ表示 */}
      {rejection && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
          <AlertCircle className="w-4 h-4" />
          <span>
            {rejection.errors[0].code === 'file-too-large'
              ? 'File is too large (Max 10MB)'
              : 'Invalid file type'}
          </span>
        </div>
      )}
    </div>
  )
}