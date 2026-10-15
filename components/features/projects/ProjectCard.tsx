'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Calendar, Users } from 'lucide-react'
import { format } from 'date-fns'
import type { Project, ProjectWithMembers } from '@/lib/types/database'
import { PhaseTracker } from './PhaseTracker'

interface ProjectCardProps {
  project: Project | ProjectWithMembers
  onEdit?: (project: Project) => void
  onDelete?: (project: Project) => void
  onView?: (project: Project) => void
}

export function ProjectCard({ project, onEdit, onDelete, onView }: ProjectCardProps) {
  const memberCount = 'members' in project && project.members ? project.members.length : 0

  const handleCardClick = () => {
    if (onView) {
      onView(project)
    }
  }

  return (
    <Card
      onClick={handleCardClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="line-clamp-1">{project.name}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {project.description || 'No description'}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  onView(project)
                }}>
                  View Details
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  onEdit(project)
                }}>
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  onDelete(project)
                }} className="text-red-600">
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-4">
          {/* Phase Visualization */}
          <div>
            <h4 className="text-sm font-medium mb-2">Progress</h4>
            <PhaseTracker phaseStatus={project.phase_status} currentPhase={project.current_phase} compact />
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(project.start_date), 'MMM dd, yyyy')}</span>
            </div>
            {memberCount > 0 && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Badge variant={project.current_phase === 'evaluate_against_requirements' ? 'default' : 'secondary'}>
          {formatPhaseName(project.current_phase)}
        </Badge>
      </CardFooter>
    </Card>
  )
}

function formatPhaseName(phase: string): string {
  return phase.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}
