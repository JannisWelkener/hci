'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LayoutGrid, List, Plus, Search } from 'lucide-react'
import type { Project, ProjectWithMembers, IsoPhase } from '@/lib/types/database'
import { ProjectCard } from './ProjectCard'
import { ProjectList } from './ProjectList'
import { TablePagination } from '@/components/ui/table-pagination'
import { usePagination } from '@/lib/hooks/use-pagination'
import { usePageState } from '@/lib/hooks/use-page-state'

interface ProjectDashboardProps {
  projects: (Project | ProjectWithMembers)[]
  isLoading?: boolean
  onCreateProject?: () => void
  onEditProject?: (project: Project) => void
  onDeleteProject?: (project: Project) => void
  onViewProject?: (project: Project) => void
}

type ViewMode = 'grid' | 'list'

export function ProjectDashboard({
  projects,
  isLoading = false,
  onCreateProject,
  onEditProject,
  onDeleteProject,
  onViewProject,
}: ProjectDashboardProps) {
  const router = useRouter()

  // Use page state hook with sessionStorage
  const { state: pageState, updateState } = usePageState({
    storageKey: 'projectsPageState',
    defaultValues: {
      view: 'grid',
      page: '1',
      search: '',
      phase: 'all'
    },
    resetPageOn: ['search', 'phase'], // Reset page when filters change
  })

  // Extract state values
  const viewMode = pageState.view as ViewMode
  const searchQuery = pageState.search
  const phaseFilter = pageState.phase as IsoPhase | 'all'
  const currentPage = parseInt(pageState.page, 10)

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = searchQuery === '' ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesPhase = phaseFilter === 'all' || project.current_phase === phaseFilter

    return matchesSearch && matchesPhase
  })

  // Use pagination hook with 12 items per page
  const pagination = usePagination<Project | ProjectWithMembers>({
    items: filteredProjects,
    itemsPerPage: 12,
    initialPage: currentPage,
  })

  // Sync pagination with page state
  useEffect(() => {
    const currentPageNum = parseInt(pageState.page, 10)
    if (pagination.currentPage !== currentPageNum) {
      updateState({ page: pagination.currentPage.toString() })
    }
  }, [pagination.currentPage])

  const handleSearchChange = (query: string) => {
    updateState({ search: query })
  }

  const handlePhaseFilterChange = (phase: IsoPhase | 'all') => {
    updateState({ phase: phase === 'all' ? 'all' : phase })
  }

  const handleViewModeChange = (mode: ViewMode) => {
    updateState({ view: mode })
  }

  const handleNextPage = () => {
    if (pagination.canNextPage) {
      pagination.nextPage()
    }
  }

  const handlePreviousPage = () => {
    if (pagination.canPreviousPage) {
      pagination.previousPage()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your HCI projects and track progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onCreateProject && (
            <Button onClick={onCreateProject}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          )}
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={phaseFilter} onValueChange={(value) => handlePhaseFilterChange(value as IsoPhase | 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Phases" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Phases</SelectItem>
              <SelectItem value="understand_context">Context of Use</SelectItem>
              <SelectItem value="specify_requirements">Requirements</SelectItem>
              <SelectItem value="produce_design_solutions">Design Solutions</SelectItem>
              <SelectItem value="evaluate_against_requirements">Evaluation</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center border rounded-md bg-card">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('grid')}
              className="rounded-r-none"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="sr-only">Grid view</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
              <span className="sr-only">List view</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <ProjectDashboardSkeleton viewMode={viewMode} />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          hasProjects={projects.length > 0}
          onCreateProject={onCreateProject}
        />
      ) : viewMode === 'grid' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pagination.paginatedItems.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={onEditProject}
                onDelete={onDeleteProject}
                onView={onViewProject}
              />
            ))}
          </div>
          {pagination.totalPages > 1 && (
            <TablePagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPreviousPage={handlePreviousPage}
              onNextPage={handleNextPage}
              canPreviousPage={pagination.canPreviousPage}
              canNextPage={pagination.canNextPage}
            />
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <ProjectList
            projects={pagination.paginatedItems}
            onEdit={onEditProject}
            onDelete={onDeleteProject}
            onView={onViewProject}
          />
          {pagination.totalPages > 1 && (
            <TablePagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPreviousPage={handlePreviousPage}
              onNextPage={handleNextPage}
              canPreviousPage={pagination.canPreviousPage}
              canNextPage={pagination.canNextPage}
            />
          )}
        </div>
      )}
    </div>
  )
}

function ProjectDashboardSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-4 p-6 border rounded-lg">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}

function EmptyState({ hasProjects, onCreateProject }: { hasProjects: boolean; onCreateProject?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <LayoutGrid className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">
        {hasProjects ? 'No projects match your filters' : 'No projects yet'}
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        {hasProjects
          ? 'Try adjusting your search or filter criteria'
          : 'Get started by creating your first HCI project to track progress through the design process'}
      </p>
      {!hasProjects && onCreateProject && (
        <Button onClick={onCreateProject}>
          <Plus className="mr-2 h-4 w-4" />
          Create Your First Project
        </Button>
      )}
    </div>
  )
}
