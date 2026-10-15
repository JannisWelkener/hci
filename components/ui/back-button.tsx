'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
  label?: string
  onClick?: () => void
}

export function BackButton({ label = 'Back', onClick }: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      router.back()
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleClick}>
      <ArrowLeft className="h-4 w-4 mr-2" />
      {label}
    </Button>
  )
}
