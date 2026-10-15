'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, FileText, ChevronLeft, Menu, ArrowLeft, Map, Figma, Layers, UsersRound, History, Lightbulb } from 'lucide-react'
import { useCurrentProject } from '@/lib/contexts/ProjectContext'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export function ProjectSidebar() {
  const { project, isLoading } = useCurrentProject()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [dashboardUrl, setDashboardUrl] = useState('/dashboard')

  // Get the saved URL params from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = sessionStorage.getItem('projectsPageState')
      if (savedState) {
        try {
          const state = JSON.parse(savedState)
          const params = new URLSearchParams()
          if (state.view && state.view !== 'grid') params.set('view', state.view)
          if (state.page && state.page !== '1') params.set('page', state.page)
          if (state.search) params.set('search', state.search)
          if (state.phase && state.phase !== 'all') params.set('phase', state.phase)

          const queryString = params.toString()
          setDashboardUrl(queryString ? `/dashboard?${queryString}` : '/dashboard')
        } catch (e) {
          console.error('Failed to parse saved state:', e)
        }
      }
    }
  }, [])

  if (!project) return null

  const projectId = project.id

  const primaryNavItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: `/projects/${projectId}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      name: 'Team',
      href: `/projects/${projectId}/team`,
      icon: UsersRound,
    },
    {
      name: 'History',
      href: `/projects/${projectId}/history`,
      icon: History,
    },
  ]

  const featureNavItems: NavItem[] = [
    {
      name: 'UX Vision',
      href: `/projects/${projectId}/ux-vision`,
      icon: Lightbulb,
    },
    {
      name: 'Personas',
      href: `/projects/${projectId}/personas`,
      icon: Users,
    },
    {
      name: 'User Stories',
      href: `/projects/${projectId}/user-stories`,
      icon: FileText,
    },
    {
      name: 'Journey Maps',
      href: `/projects/${projectId}/user-journey-maps`,
      icon: Map,
    },
    {
      name: 'Mockups',
      href: `/projects/${projectId}/mockups`,
      icon: Figma,
    },
    {
      name: 'Wireframes',
      href: `/projects/${projectId}/wireframes`,
      icon: Layers,
    },
  ]

  return (
    <aside
      className={cn(
        'border-r bg-background h-full flex flex-col transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header with Back Button and Collapse Toggle */}
      <div className="p-4 border-b flex items-center justify-between overflow-hidden">
        {!isCollapsed ? (
          <>
            <Link
              href={dashboardUrl}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors overflow-hidden"
            >
              <ArrowLeft className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Back to Projects</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(true)}
              className="h-8 w-8 p-0 flex-shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Collapse sidebar</span>
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(false)}
            className="h-8 w-8 p-0 mx-auto"
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Expand sidebar</span>
          </Button>
        )}
      </div>

      {/* Project Header */}
      {!isCollapsed && (
        <div className="p-6 border-b overflow-hidden">
          <h2 className="text-lg font-semibold truncate whitespace-nowrap">
            {isLoading ? 'Loading...' : project.name}
          </h2>
          <p className="text-sm text-muted-foreground mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
            {project.current_phase.replace(/_/g, ' ')}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {/* Primary Navigation (Dashboard & Team) */}
        {primaryNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors overflow-hidden',
                isActive
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
            </Link>
          )
        })}

        {/* Separator */}
        <Separator className="my-3" />

        {/* Feature Navigation */}
        {featureNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors overflow-hidden',
                isActive
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
