'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { DashboardNode } from '@/components/features/dashboard/DashboardNode';
import { ProjectNode } from '@/components/features/dashboard/ProjectNode';
import { PhaseNode } from '@/components/features/dashboard/PhaseNode';
import { PhaseNodeExpanded } from '@/components/features/dashboard/PhaseNodeExpanded';
import { FeaturePageLayout } from '@/components/shared/FeaturePageLayout';
import { useCurrentProject } from '@/lib/contexts/ProjectContext';
import { useProjectStats } from '@/lib/hooks/use-project-stats';
import { transformToPhaseNodes } from '@/lib/utils/dashboard-data-transform';
import type {
  DashboardNode as DashboardNodeType,
  ViewState,
} from '@/lib/types/dashboard';
import type { IsoPhase } from '@/lib/types/database';

/**
 * Register custom node types for React Flow
 */
const nodeTypes: NodeTypes = {
  dashboardNode: DashboardNode,
  projectNode: ProjectNode,
  phaseNode: PhaseNode,
  phaseNodeExpanded: PhaseNodeExpanded,
};

/**
 * Interactive Project Dashboard Page
 * Phase-based two-level zoom system with smooth transitions
 */
export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { project, isLoading: projectLoading } = useCurrentProject();
  const { data: stats, isLoading: statsLoading } = useProjectStats(project?.id || '');

  // Initialize viewState from URL params
  const initialPhaseParam = searchParams?.get('phase') as IsoPhase | null;
  const [viewState, setViewState] = useState<ViewState>({
    level: initialPhaseParam ? 'detail' : 'overview',
    selectedPhaseId: initialPhaseParam,
  });

  const [isTransitioning, setIsTransitioning] = useState(false);

  // Transform data to nodes based on current view state
  const initialElements = useMemo(() => {
    if (!project || !stats) return { nodes: [], edges: [] };

    return transformToPhaseNodes(project, stats, viewState);
  }, [project, stats, viewState]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialElements.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialElements.edges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Update nodes when data or view state changes
  useEffect(() => {
    if (initialElements.nodes.length > 0) {
      setNodes(initialElements.nodes);
      setEdges(initialElements.edges);
    }
  }, [initialElements, setNodes, setEdges]);

  // Auto-fit view when nodes change or view state changes
  useEffect(() => {
    if (reactFlowInstance && nodes.length > 0) {
      // Small delay to ensure nodes are rendered
      setTimeout(() => {
        reactFlowInstance.fitView({
          padding: 0.1, // Reduced padding for tighter zoom
          duration: 400,
          maxZoom: 1.2, // Allow slightly more zoom
        });
      }, 50);
    }
  }, [nodes, viewState, reactFlowInstance]);

  // Zoom to phase detail view
  const zoomToPhase = useCallback(
    (phaseId: IsoPhase) => {
      if (isTransitioning) return;

      setIsTransitioning(true);

      // Update URL param
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.set('phase', phaseId);
      router.push(`?${params.toString()}`, { scroll: false });

      // Update view state (triggers re-render with new nodes)
      setViewState({
        level: 'detail',
        selectedPhaseId: phaseId,
      });

      // Reset transition flag after animation completes
      setTimeout(() => setIsTransitioning(false), 800);
    },
    [isTransitioning, router, searchParams]
  );

  // Zoom back to overview
  const zoomToOverview = useCallback(() => {
    if (isTransitioning) return;

    setIsTransitioning(true);

    // Clear URL param
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.delete('phase');
    router.push(`?${params.toString()}`, { scroll: false });

    // Update view state (triggers re-render with new nodes)
    setViewState({
      level: 'overview',
      selectedPhaseId: null,
    });

    // Reset transition flag after animation completes
    setTimeout(() => setIsTransitioning(false), 800);
  }, [isTransitioning, router, searchParams]);

  // ESC key handler to return to overview
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewState.level === 'detail') {
        zoomToOverview();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [viewState, zoomToOverview]);

  // Handle node click for navigation and zoom transitions
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: DashboardNodeType) => {
      // Project node navigates to project view page
      if (node.id === 'project' && project) {
        router.push(`/projects/${project.id}/projectview`);
        return;
      }

      // Overview mode: click phase to zoom in
      if (viewState.level === 'overview' && node.type === 'phaseNode') {
        const phaseId = (node.data as any).phaseId;
        zoomToPhase(phaseId);
        return;
      }

      // Detail mode: click expanded phase to return, click method to navigate
      if (viewState.level === 'detail') {
        if (node.type === 'phaseNodeExpanded') {
          zoomToOverview();
        } else if (node.type === 'dashboardNode' && 'route' in node.data) {
          router.push(node.data.route);
        }
      }
    },
    [viewState, router, zoomToPhase, zoomToOverview]
  );

  // Standard loading state
  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  // Standard not found state
  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  return (
    <>
      <FeaturePageLayout
        title="Project Dashboard"
        description={
          viewState.level === 'overview'
            ? 'Interactive overview of your HCI design process. Click any phase to explore.'
            : 'Phase detail view. Click methods to navigate, ESC to return.'
        }
      >
        {/* Back Button (only visible in detail mode) */}
        {viewState.level === 'detail' && (
          <div className="absolute top-4 left-4 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomToOverview}
              className="shadow-lg bg-background/95"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Overview
            </Button>
          </div>
        )}

        {/* Canvas fills remaining space */}
        <div className="h-[calc(100vh-140px)] w-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            onInit={setReactFlowInstance}
            fitView
            fitViewOptions={{
              padding: 0.1,
              duration: 400,
              maxZoom: 1.2,
            }}
            minZoom={0.3}
            maxZoom={2}
            defaultEdgeOptions={{
              animated: true,
              style: {
                stroke: 'hsl(var(--primary))',
                strokeWidth: 2,
              },
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1.5}
              className="opacity-30"
            />
            <Controls
              className="bg-background/95 border border-border shadow-lg rounded-lg"
              showInteractive={false}
            />
            <MiniMap
              nodeStrokeWidth={3}
              zoomable
              pannable
              className="bg-background/95 border border-border shadow-lg rounded-lg hidden lg:block"
              maskColor="hsl(var(--background) / 0.85)"
            />
          </ReactFlow>
        </div>
      </FeaturePageLayout>
    </>
  );
}
