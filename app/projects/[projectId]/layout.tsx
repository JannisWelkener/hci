import { ProjectProvider } from '@/lib/contexts/ProjectContext'
import { AIKeyProvider } from '@/lib/contexts/AIKeyContext'
import { ProjectSidebar } from '@/components/layouts/ProjectSidebar'

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params

  return (
    <AIKeyProvider>
      <ProjectProvider projectId={projectId}>
        <div className="flex h-screen">
          <ProjectSidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </ProjectProvider>
    </AIKeyProvider>
  )
}
