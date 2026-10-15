"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { X, Search, User } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useProfiles } from "@/lib/hooks/use-profiles"
import type { Profile, MemberRole } from "@/lib/types/database"

export interface SelectedMember {
  userId: string
  role?: MemberRole
  profile?: Profile
}

interface MemberSelectorProps {
  selectedMembers: SelectedMember[]
  onMembersChange: (members: SelectedMember[]) => void
  maxMembers?: number
  excludeUserIds?: string[]
  allowRoleSelection?: boolean
  disabled?: boolean
  className?: string
}

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: 'Owner',
  editor: 'Editor',
  member: 'Member',
  viewer: 'Viewer',
}

export function MemberSelector({
  selectedMembers,
  onMembersChange,
  maxMembers = 50,
  excludeUserIds = [],
  allowRoleSelection = false,
  disabled = false,
  className,
}: MemberSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Fetch profiles with search
  const { data: profiles = [], isLoading } = useProfiles(searchQuery)

  // Filter out already selected members and excluded users
  const availableProfiles = useMemo(() => {
    const selectedIds = new Set(selectedMembers.map(m => m.userId))
    const excludedIds = new Set(excludeUserIds)

    return profiles.filter(
      profile => !selectedIds.has(profile.id) && !excludedIds.has(profile.id)
    )
  }, [profiles, selectedMembers, excludeUserIds])

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Add member
  const handleAddMember = (profile: Profile) => {
    if (selectedMembers.length >= maxMembers) {
      return
    }

    const newMember: SelectedMember = {
      userId: profile.id,
      role: allowRoleSelection ? 'member' : undefined,
      profile,
    }

    onMembersChange([...selectedMembers, newMember])
    setSearchQuery('')
    setIsDropdownOpen(false)
  }

  // Remove member
  const handleRemoveMember = (userId: string) => {
    onMembersChange(selectedMembers.filter(m => m.userId !== userId))
  }

  // Update member role
  const handleRoleChange = (userId: string, role: MemberRole) => {
    onMembersChange(
      selectedMembers.map(m =>
        m.userId === userId ? { ...m, role } : m
      )
    )
  }

  const canAddMore = selectedMembers.length < maxMembers

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          type="text"
          placeholder={`Search team members... (${selectedMembers.length}/${maxMembers})`}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setIsDropdownOpen(true)
          }}
          onFocus={() => setIsDropdownOpen(true)}
          disabled={disabled || !canAddMore}
          className="pl-9"
        />

        {/* Dropdown Results */}
        {isDropdownOpen && searchQuery && canAddMore && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg max-h-60 overflow-auto">
            {isLoading ? (
              <div className="p-4 text-sm text-slate-500 text-center">
                Searching...
              </div>
            ) : availableProfiles.length === 0 ? (
              <div className="p-4 text-sm text-slate-500 text-center">
                No users found
              </div>
            ) : (
              <div className="p-1">
                {availableProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => handleAddMember(profile)}
                    disabled={disabled}
                    className="w-full flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm text-left transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback>
                        {getInitials(profile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {profile.display_name || profile.full_name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {profile.email}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {profile.role}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Members */}
      {selectedMembers.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Team Members ({selectedMembers.length})
          </p>
          <div className="space-y-2">
            {selectedMembers.map((member) => {
              const profile = member.profile

              return (
                <div
                  key={member.userId}
                  className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-800 rounded-md bg-slate-50 dark:bg-slate-900"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {profile?.full_name ? getInitials(profile.full_name) : <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {profile?.display_name || profile?.full_name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {profile?.email || member.userId}
                    </p>
                  </div>

                  {/* Role Selector (optional) */}
                  {allowRoleSelection && member.role && (
                    <Select
                      value={member.role}
                      onValueChange={(role) => handleRoleChange(member.userId, role as MemberRole)}
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.userId)}
                    disabled={disabled}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove member</span>
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedMembers.length === 0 && (
        <div className="text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-md">
          <User className="h-8 w-8 mx-auto text-slate-400 mb-2" />
          <p className="text-sm text-slate-500">No team members added yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Search and add members to collaborate on this project
          </p>
        </div>
      )}

      {/* Max Members Warning */}
      {!canAddMore && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Maximum number of members ({maxMembers}) reached
        </p>
      )}
    </div>
  )
}
