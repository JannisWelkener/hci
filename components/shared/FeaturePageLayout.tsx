'use client'

import { ReactNode } from 'react'

interface FeaturePageLayoutProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}

export function FeaturePageLayout({
  title,
  description,
  action,
  children,
}: FeaturePageLayoutProps) {
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {action}
      </div>

      {/* Content */}
      {children}
    </div>
  )
}
