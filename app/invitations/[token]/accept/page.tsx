'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  UserPlus,
  Loader2,
} from 'lucide-react'
import {
  useInvitationDetails,
  useAcceptInvitation,
} from '@/lib/hooks/use-project-invitations'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface InvitationAcceptPageProps {
  params: Promise<{ token: string }>
}

export default function InvitationAcceptPage({ params }: InvitationAcceptPageProps) {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Unwrap params
  useEffect(() => {
    params.then((p) => setToken(p.token))
  }, [params])

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
      setIsCheckingAuth(false)
    }

    checkAuth()
  }, [])

  // Fetch invitation details
  const {
    data: invitation,
    isLoading: isLoadingInvitation,
    error: invitationError,
  } = useInvitationDetails(token || '')

  // Accept invitation mutation
  const { mutate: acceptInvitation, isPending: isAccepting } = useAcceptInvitation()

  const handleAccept = () => {
    if (!token) return

    acceptInvitation(token, {
      onSuccess: (data) => {
        if (data.already_member) {
          toast.success('You are already a member of this project!')
        } else {
          toast.success('Invitation accepted! Redirecting to project...')
        }
        // Redirect to project dashboard
        router.push(`/projects/${data.project_id}/dashboard`)
      },
      onError: (error) => {
        toast.error(`Failed to accept invitation: ${error.message}`)
      },
    })
  }

  const handleRedirectToAuth = (type: 'login' | 'register') => {
    if (!token) return
    const redirectUrl = `/invitations/${token}/accept`
    router.push(`/auth/${type}?redirect=${encodeURIComponent(redirectUrl)}`)
  }

  // Loading state while checking auth or params
  if (isCheckingAuth || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading invitation details
  if (isLoadingInvitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error: Invalid/Not Found Invitation
  if (invitationError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-red-600" />
              <CardTitle>Invitation Not Found</CardTitle>
            </div>
            <CardDescription>This invitation link is invalid or has been removed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {invitationError instanceof Error
                  ? invitationError.message
                  : 'Unable to load invitation details'}
              </AlertDescription>
            </Alert>
            <Button asChild className="w-full">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check invitation status
  const isExpired = invitation?.is_expired || invitation?.status === 'expired'
  const isRevoked = invitation?.status === 'revoked'
  const isDeclined = invitation?.status === 'declined'
  const isAccepted = invitation?.status === 'accepted'
  const isInvalid = isExpired || isRevoked || isDeclined || isAccepted

  // Error: Invalid Invitation Status
  if (isInvalid) {
    let icon = <XCircle className="h-6 w-6 text-red-600" />
    let title = 'Invitation Unavailable'
    let description = 'This invitation is no longer valid.'
    let alertMessage = ''

    if (isExpired) {
      icon = <Clock className="h-6 w-6 text-orange-600" />
      title = 'Invitation Expired'
      description = 'This invitation has expired and can no longer be accepted.'
      alertMessage = 'This invitation expired on ' + new Date(invitation.expires_at).toLocaleDateString()
    } else if (isRevoked) {
      icon = <XCircle className="h-6 w-6 text-red-600" />
      title = 'Invitation Revoked'
      description = 'This invitation has been cancelled by the project owner.'
      alertMessage = 'The project owner has revoked this invitation'
    } else if (isDeclined) {
      icon = <XCircle className="h-6 w-6 text-slate-600" />
      title = 'Invitation Declined'
      description = 'This invitation has already been declined.'
      alertMessage = 'You previously declined this invitation'
    } else if (isAccepted) {
      icon = <CheckCircle2 className="h-6 w-6 text-green-600" />
      title = 'Already Accepted'
      description = 'You have already accepted this invitation.'
      alertMessage = 'You are already a member of this project'
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              {icon}
              <CardTitle>{title}</CardTitle>
            </div>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Status</AlertTitle>
              <AlertDescription>{alertMessage}</AlertDescription>
            </Alert>
            {isAccepted && (
              <Button asChild className="w-full">
                <Link href={`/projects/${invitation.project.id}/dashboard`}>Go to Project</Link>
              </Button>
            )}
            {!isAccepted && (
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Valid pending invitation
  if (!invitation) return null

  // Not authenticated - show login/register options
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              <CardTitle>Project Invitation</CardTitle>
            </div>
            <CardDescription>You&apos;ve been invited to join a project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Invitation Details */}
            <div className="rounded-lg border p-4 space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Project</p>
                <p className="font-semibold">{invitation.project.name}</p>
                {invitation.project.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {invitation.project.description}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Invited by</p>
                <p className="font-medium">{invitation.inviter.full_name}</p>
                <p className="text-xs text-muted-foreground">{invitation.inviter.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-medium capitalize">{invitation.role}</p>
              </div>
              {invitation.message && (
                <div>
                  <p className="text-sm text-muted-foreground">Message</p>
                  <p className="text-sm italic">&quot;{invitation.message}&quot;</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Expires</p>
                <p className="text-sm">
                  {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Authentication Required Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Required</AlertTitle>
              <AlertDescription>
                You need to log in or create an account to accept this invitation.
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button onClick={() => handleRedirectToAuth('login')} className="w-full">
                Log In to Accept
              </Button>
              <Button
                onClick={() => handleRedirectToAuth('register')}
                variant="outline"
                className="w-full"
              >
                Create Account
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              After logging in, you&apos;ll be automatically redirected to accept this invitation.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Authenticated - show accept button
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" />
            <CardTitle>Accept Invitation</CardTitle>
          </div>
          <CardDescription>
            You&apos;ve been invited to join {invitation.project.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Invitation Details */}
          <div className="rounded-lg border p-4 space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Project</p>
              <p className="font-semibold text-lg">{invitation.project.name}</p>
              {invitation.project.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {invitation.project.description}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Invited by</p>
              <p className="font-medium">{invitation.inviter.full_name}</p>
              <p className="text-xs text-muted-foreground">{invitation.inviter.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Role</p>
              <p className="font-medium capitalize">{invitation.role}</p>
            </div>
            {invitation.message && (
              <div>
                <p className="text-sm text-muted-foreground">Personal Message</p>
                <p className="text-sm italic border-l-2 pl-3 py-1">
                  &quot;{invitation.message}&quot;
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Invitation Expires</p>
              <p className="text-sm">
                {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Accept Button */}
          <Button onClick={handleAccept} disabled={isAccepting} className="w-full" size="lg">
            {isAccepting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Accept Invitation
              </>
            )}
          </Button>

          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard">Maybe Later</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
