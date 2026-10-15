"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Mail } from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateInvitation } from "@/lib/hooks/use-project-invitations"
import type { MemberRole } from "@/lib/types/database"

interface InviteMemberDialogProps {
  projectId: string
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

// Validation schema
const invitationFormSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .toLowerCase()
    .trim(),
  role: z.enum(["member", "owner"]),
  message: z.string().max(500, "Message must be 500 characters or less").optional(),
})

type InvitationFormValues = z.infer<typeof invitationFormSchema>

export function InviteMemberDialog({
  projectId,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
}: InviteMemberDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  // Use controlled or uncontrolled state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen = controlledOnOpenChange || setInternalOpen

  // Form setup
  const form = useForm<InvitationFormValues>({
    resolver: zodResolver(invitationFormSchema),
    defaultValues: {
      email: "",
      role: "member",
      message: "",
    },
  })

  // Mutation
  const { mutate: createInvitation, isPending } = useCreateInvitation()

  const handleSubmit = (data: InvitationFormValues) => {
    createInvitation(
      {
        projectId,
        email: data.email,
        role: data.role as MemberRole,
        message: data.message || undefined,
      },
      {
        onSuccess: () => {
          toast.success(`Invitation sent to ${data.email}`)
          form.reset()
          setIsOpen(false)
          onSuccess?.()
        },
        onError: (error) => {
          toast.error(`Failed to send invitation: ${error.message}`)
        },
      }
    )
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // Reset form when dialog closes
      form.reset()
    }
  }

  return (
    <>
      {trigger && (
        <div onClick={() => setIsOpen(true)}>
          {trigger}
        </div>
      )}

      <FeatureFormDialog
        open={isOpen}
        onOpenChange={handleOpenChange}
        title="Invite Team Member"
        description="Send an email invitation to collaborate on this project."
        showFooter={false}
        maxWidth="md"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        {...field}
                        type="email"
                        placeholder="colleague@example.com"
                        className="pl-9"
                        disabled={isPending}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Enter the email address of the person you want to invite
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    disabled={isPending}
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
                    Choose the role for this team member
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Message Field (Optional) */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add a personal message to the invitation..."
                      rows={3}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Add a personal note to your invitation (max 500 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
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
                {isPending ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </form>
        </Form>
      </FeatureFormDialog>
    </>
  )
}
