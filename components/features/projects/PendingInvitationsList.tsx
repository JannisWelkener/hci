"use client"

import { useState } from "react"
import { MoreVertical, Mail, Clock, UserX } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

import { InvitationStatusBadge } from "./InvitationStatusBadge"
import { useRevokeInvitation } from "@/lib/hooks/use-project-invitations"
import type { ProjectInvitationWithInviter } from "@/lib/types/database"

interface PendingInvitationsListProps {
  projectId: string
  invitations: ProjectInvitationWithInviter[]
  isLoading?: boolean
}

export function PendingInvitationsList({
  projectId,
  invitations,
  isLoading,
}: PendingInvitationsListProps) {
  const [invitationToRevoke, setInvitationToRevoke] = useState<string | null>(null)
  const { mutate: revokeInvitation, isPending: isRevoking } = useRevokeInvitation()

  // Filter out link invitations (those with placeholder emails)
  const emailInvitations = invitations.filter(
    (invitation) => !invitation.invitee_email.endsWith('@placeholder.local')
  )

  const handleRevoke = (invitationId: string) => {
    revokeInvitation(
      { projectId, invitationId },
      {
        onSuccess: () => {
          toast.success("Invitation revoked successfully")
          setInvitationToRevoke(null)
        },
        onError: (error) => {
          toast.error(`Failed to revoke invitation: ${error.message}`)
        },
      }
    )
  }

  const formatExpirationDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const isExpired = date < now

    if (isExpired) {
      return <span className="text-red-600 dark:text-red-400">Expired</span>
    }

    return (
      <span className="text-slate-600 dark:text-slate-400">
        {formatDistanceToNow(date, { addSuffix: true })}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invitee</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invited</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center text-slate-500">
                Loading invitations...
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  if (emailInvitations.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center">
        <Mail className="h-10 w-10 mx-auto text-slate-400 mb-3" />
        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
          No pending invitations
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Invite team members to collaborate on this project
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invitee</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invited</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emailInvitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-xs">
                        <Mail className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {invitation.invitee_email}
                      </span>
                      <span className="text-xs text-slate-500">
                        by {invitation.inviter?.full_name || "Unknown"}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm capitalize">{invitation.role}</span>
                </TableCell>
                <TableCell>
                  <InvitationStatusBadge status={invitation.status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDistanceToNow(new Date(invitation.invited_at), {
                      addSuffix: true,
                    })}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {formatExpirationDate(invitation.expires_at)}
                </TableCell>
                <TableCell>
                  {invitation.status === "pending" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setInvitationToRevoke(invitation.id)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Revoke Invitation
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog
        open={!!invitationToRevoke}
        onOpenChange={(open) => !open && setInvitationToRevoke(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this invitation? The invitee will no
              longer be able to accept it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => invitationToRevoke && handleRevoke(invitationToRevoke)}
              disabled={isRevoking}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRevoking ? "Revoking..." : "Revoke"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
