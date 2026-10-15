'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, ArrowUpDown } from 'lucide-react'
import { format } from 'date-fns'
import type { Project, ProjectWithMembers, IsoPhase } from '@/lib/types/database'
import { useState } from 'react'

interface ProjectListProps {
  projects: (Project | ProjectWithMembers)[]
  onEdit?: (project: Project) => void
  onDelete?: (project: Project) => void
  onView?: (project: Project) => void
}

type SortField = 'name' | 'start_date' | 'current_phase' | 'updated_at'
type SortDirection = 'asc' | 'desc'

export function ProjectList({ projects, onEdit, onDelete, onView }: ProjectListProps) {
  const [sortField, setSortField] = useState<SortField>('updated_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedProjects = [...projects].sort((a, b) => {
    let aValue: string | number = a[sortField]
    let bValue: string | number = b[sortField]

    if (sortField === 'start_date' || sortField === 'updated_at') {
      aValue = new Date(aValue as string).getTime()
      bValue = new Date(bValue as string).getTime()
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const getPhaseProgress = (project: Project) => {
    const statuses = Object.values(project.phase_status)
    const completed = statuses.filter(s => s === 'completed').length
    const total = statuses.length
    return `${completed}/${total}`
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 font-medium"
                onClick={() => handleSort('name')}
              >
                Project Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 font-medium"
                onClick={() => handleSort('current_phase')}
              >
                Current Phase
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 font-medium"
                onClick={() => handleSort('start_date')}
              >
                Start Date
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 font-medium"
                onClick={() => handleSort('updated_at')}
              >
                Last Updated
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProjects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No projects found
              </TableCell>
            </TableRow>
          ) : (
            sortedProjects.map((project) => (
              <TableRow
                key={project.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onView?.(project)}
              >
                <TableCell className="font-medium max-w-xs">
                  <div className="truncate">{project.name}</div>
                  {project.description && (
                    <div className="text-sm text-muted-foreground truncate">
                      {project.description}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {formatPhaseName(project.current_phase)}
                  </Badge>
                </TableCell>
                <TableCell>{getPhaseProgress(project)}</TableCell>
                <TableCell>{format(new Date(project.start_date), 'MMM dd, yyyy')}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(project.updated_at), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(project)}>
                          View Details
                        </DropdownMenuItem>
                      )}
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(project)}>
                          Edit
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem onClick={() => onDelete(project)} className="text-red-600">
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  )
}

function formatPhaseName(phase: IsoPhase): string {
  return phase.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}
