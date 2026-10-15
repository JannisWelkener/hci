'use client'

import { useState } from 'react'
import { useCurrentProject } from '@/lib/contexts/ProjectContext'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FeaturePageLayout } from '@/components/shared/FeaturePageLayout'
import { FeatureEmptyState } from '@/components/shared/FeatureEmptyState'
import {
  InviteMemberDialog,
  GenerateInviteLinkDialog,
  PendingInvitationsList,
} from '@/components/features/projects'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Users, UserPlus, MoreVertical, UserMinus, Mail, Link as LinkIcon } from 'lucide-react'
import { useProjectMembers, useRemoveProjectMember } from '@/lib/hooks/use-project-members'
import { useProjectInvitations } from '@/lib/hooks/use-project-invitations'
import type { ProjectMemberWithProfile } from '@/lib/types/database'

export default function TeamPage() {
  const { project, isLoading: isLoadingProject } = useCurrentProject()
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [generateLinkDialogOpen, setGenerateLinkDialogOpen] = useState(false)
  const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<ProjectMemberWithProfile | null>(null)

  // Fetch members and invitations
  const { data: members, isLoading: isLoadingMembers, error: membersError } = useProjectMembers(project?.id || '')
  const { data: invitations, isLoading: isLoadingInvitations } = useProjectInvitations(project?.id || '', 'pending')

  // Remove member mutation
  const removeMemberMutation = useRemoveProjectMember()

  const handleRemoveMember = () => {
    if (!selectedMember || !project) return

    removeMemberMutation.mutate(
      { projectId: project.id, userId: selectedMember.user_id },
      {
        onSuccess: () => {
          toast.success(`${selectedMember.profile.full_name} removed from project`)
          setRemoveMemberDialogOpen(false)
          setSelectedMember(null)
        },
        onError: (error) => {
          toast.error(`Failed to remove member: ${error.message}`)
        },
      }
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default'
      case 'admin':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (isLoadingProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    )
  }

  // Filter out link invitations (those with placeholder emails)
  const pendingInvitations = (invitations || []).filter(
    (invitation) => !invitation.invitee_email.endsWith('@placeholder.local')
  )
  const hasMembers = members && members.length > 0

  return (
    <FeaturePageLayout
      title="Team"
      description="Manage project members and invitations"
      action={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setGenerateLinkDialogOpen(true)}>
            <LinkIcon className="mr-2 h-4 w-4" />
            Generate Link
          </Button>
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Current Members Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>
              {members?.length || 0} member{members?.length !== 1 ? 's' : ''} in this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMembers ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading members...</p>
              </div>
            ) : membersError ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-red-500">
                  Error: {membersError instanceof Error ? membersError.message : 'Failed to load members'}
                </p>
              </div>
            ) : !hasMembers ? (
              <FeatureEmptyState
                icon={Users}
                title="No team members yet"
                description="Invite team members to collaborate on this project"
              />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.user_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.profile?.avatar_url || undefined} />
                              <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-xs">
                                {member.profile ? getInitials(member.profile.full_name) : '??'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{member.profile?.full_name || 'Unknown User'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {member.profile?.email || 'No email'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(member.role)} className="capitalize">
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {member.role !== 'owner' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedMember(member)
                                    setRemoveMemberDialogOpen(true)
                                  }}
                                  className="text-red-600 dark:text-red-400"
                                >
                                  <UserMinus className="h-4 w-4 mr-2" />
                                  Remove from Project
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
            )}
          </CardContent>
        </Card>

        {/* Pending Invitations Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations
            </CardTitle>
            <CardDescription>
              {pendingInvitations.length} pending invitation{pendingInvitations.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingInvitations ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading invitations...</p>
              </div>
            ) : (
              <PendingInvitationsList
                projectId={project.id}
                invitations={pendingInvitations}
                isLoading={isLoadingInvitations}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invite Member Dialog */}
      <InviteMemberDialog
        projectId={project.id}
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={() => {
          setInviteDialogOpen(false)
        }}
      />

      {/* Generate Invite Link Dialog */}
      <GenerateInviteLinkDialog
        projectId={project.id}
        open={generateLinkDialogOpen}
        onOpenChange={setGenerateLinkDialogOpen}
        onSuccess={() => {
          // Keep dialog open so user can copy link
        }}
      />

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={removeMemberDialogOpen} onOpenChange={setRemoveMemberDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedMember?.profile.full_name} from this project?
              They will lose access to all project resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMemberMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={removeMemberMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {removeMemberMutation.isPending ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FeaturePageLayout>
  )
}
