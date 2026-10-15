"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Link as LinkIcon, Copy, Check } from "lucide-react"

import { FeatureFormDialog } from "@/components/shared/FeatureFormDialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCreateInvitation } from "@/lib/hooks/use-project-invitations"
import type { MemberRole } from "@/lib/types/database"

interface GenerateInviteLinkDialogProps {
  projectId: string
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

// Validation schema - only role is required
const linkFormSchema = z.object({
  role: z.enum(["member", "owner"]),
})

type LinkFormValues = z.infer<typeof linkFormSchema>

export function GenerateInviteLinkDialog({
  projectId,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
}: GenerateInviteLinkDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Use controlled or uncontrolled state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen = controlledOnOpenChange || setInternalOpen

  // Form setup
  const form = useForm<LinkFormValues>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      role: "member",
    },
  })

  // Mutation
  const { mutate: createInvitation, isPending } = useCreateInvitation()

  const handleGenerateLink = (data: LinkFormValues) => {
    createInvitation(
      {
        projectId,
        email: `link-invite-${Date.now()}@placeholder.local`, // Placeholder email for link-based invites
        role: data.role as MemberRole,
      },
      {
        onSuccess: (invitation) => {
          // Generate the invitation link
          const inviteUrl = `${window.location.origin}/invitations/${invitation.token}/accept`
          setGeneratedLink(inviteUrl)
          toast.success("Invitation link generated!")
          onSuccess?.()
        },
        onError: (error) => {
          toast.error(`Failed to generate link: ${error.message}`)
        },
      }
    )
  }

  const handleCopyLink = async () => {
    if (!generatedLink) return

    try {
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      toast.success("Link copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy link")
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // Reset form when dialog closes
      form.reset()
      setGeneratedLink(null)
      setCopied(false)
    }
  }

  return (
    <>
      {trigger && <div onClick={() => setIsOpen(true)}>{trigger}</div>}

      <FeatureFormDialog
        open={isOpen}
        onOpenChange={handleOpenChange}
        title="Generate Invite Link"
        description="Create a shareable link that anyone can use to join this project."
        showFooter={false}
        maxWidth="md"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleGenerateLink)} className="space-y-4">
            {/* Role Field */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending || !!generatedLink}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the role for people who use this link
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Generated Link Display */}
            {generatedLink && (
              <Alert>
                <LinkIcon className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Invitation link generated:</p>
                    <div className="flex items-center gap-2">
                      <Input value={generatedLink} readOnly className="text-xs font-mono" />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleCopyLink}
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Share this link with anyone to invite them to the project
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Form Actions */}
            {!generatedLink ? (
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  {isPending ? "Generating..." : "Generate Link"}
                </Button>
              </div>
            ) : (
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setGeneratedLink(null)
                    form.reset()
                  }}
                >
                  Generate Another
                </Button>
                <Button type="button" onClick={() => handleOpenChange(false)}>
                  Done
                </Button>
              </div>
            )}
          </form>
        </Form>
      </FeatureFormDialog>
    </>
  )
}
