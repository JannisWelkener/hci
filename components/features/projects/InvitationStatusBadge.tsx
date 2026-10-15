"use client"

import { Badge } from "@/components/ui/badge"
import type { InvitationStatus } from "@/lib/types/database"
import { cn } from "@/lib/utils"

interface InvitationStatusBadgeProps {
  status: InvitationStatus
  className?: string
}

const statusConfig: Record<
  InvitationStatus,
  {
    label: string
    variant: "default" | "secondary" | "destructive" | "outline"
    className?: string
  }
> = {
  pending: {
    label: "Pending",
    variant: "secondary",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  },
  accepted: {
    label: "Accepted",
    variant: "default",
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  },
  declined: {
    label: "Declined",
    variant: "outline",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  },
  expired: {
    label: "Expired",
    variant: "destructive",
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  },
  revoked: {
    label: "Revoked",
    variant: "destructive",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  },
}

export function InvitationStatusBadge({ status, className }: InvitationStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
