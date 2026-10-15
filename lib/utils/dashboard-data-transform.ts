import type { ProjectStats } from "@/lib/validations/dashboard";
import type {
  DashboardNode,
  SubappType,
  PhaseNode,
  DashboardEdge,
  ViewState,
} from "@/lib/types/dashboard";
import type { Project } from "@/lib/types/database";
import { PHASE_INFO, SUBAPP_INFO, getMethodsForPhase } from "./phase-config";
import {
  getPhaseOverviewLayout,
  getPhaseDetailLayout,
  createPhaseFlowEdges,
  createPhaseToMethodEdges,
} from "./dashboard-layout";

/**
 * Transform project data and stats into React Flow nodes
 * Includes a central project node and subapp nodes around it
 */
export function transformToGraphNodes(
  project: Project,
  stats: ProjectStats
): DashboardNode[] {
  // Create central project node
  const projectNode: DashboardNode = {
    id: "project",
    type: "projectNode",
    position: { x: 0, y: 0 }, // Will be set by layout algorithm
    data: {
      id: "project",
      projectName: project.name,
      description: project.description,
      currentPhase: project.current_phase,
      startDate: project.start_date,
    },
  };

  // Create subapp nodes
  const subapps: Array<{
    id: SubappType;
    label: string;
    icon: string;
    statsKey: keyof ProjectStats;
  }> = [
    {
      id: "user-stories",
      label: "User Stories",
      icon: "FileText",
      statsKey: "userStories",
    },
    {
      id: "personas",
      label: "Personas",
      icon: "Users",
      statsKey: "personas",
    },
    {
      id: "user-journeys",
      label: "User Journeys",
      icon: "Map",
      statsKey: "userJourneys",
    },
    {
      id: "wireframes",
      label: "Wireframes",
      icon: "Layers",
      statsKey: "wireframes",
    },
    {
      id: "mockups",
      label: "Mockups",
      icon: "Figma",
      statsKey: "mockups",
    },
  ];

  const subappNodes: DashboardNode[] = subapps.map((subapp) => {
    const subappStats = stats[subapp.statsKey];

    return {
      id: subapp.id,
      type: "dashboardNode",
      position: { x: 0, y: 0 }, // Will be set by layout algorithm
      data: {
        id: subapp.id,
        label: subapp.label,
        count: subappStats.count,
        lastUpdated: subappStats.lastUpdated,
        icon: subapp.icon,
        route: `/projects/${project.id}/${subapp.id}`,
        type: subapp.id,
      },
    };
  });

  return [projectNode, ...subappNodes];
}

/**
 * Transform project data and stats into phase-based React Flow graph
 * Returns different nodes/edges based on view state (overview vs detail)
 *
 * @param project - Project data
 * @param stats - Project statistics
 * @param viewState - Current view state (overview or detail mode)
 * @returns Graph data with nodes and edges
 */
export function transformToPhaseNodes(
  project: Project,
  stats: ProjectStats,
  viewState: ViewState
): { nodes: DashboardNode[]; edges: DashboardEdge[] } {
  // Create project node (always present)
  const projectNode: DashboardNode = {
    id: "project",
    type: "projectNode",
    position: { x: 0, y: 0 }, // Will be set by layout
    data: {
      id: "project",
      projectName: project.name,
      description: project.description,
      currentPhase: project.current_phase,
      startDate: project.start_date,
    },
  };

  if (viewState.level === "overview") {
    // OVERVIEW MODE: Show 4 phase nodes in circular layout

    // Create phase overview nodes
    const phaseNodes: PhaseNode[] = Object.values(PHASE_INFO).map((phase) => {
      const methods = getMethodsForPhase(phase.id, stats);
      const methodCount = methods.length; // Total number of methods in this phase
      const totalInUse = methods.reduce((sum, m) => sum + m.count, 0); // Sum of counts in use

      return {
        id: `phase-${phase.id}`,
        type: "phaseNode",
        position: { x: 0, y: 0 }, // Will be set by layout
        data: {
          phaseId: phase.id,
          title: phase.title,
          subtitle: phase.subtitle,
          description: phase.description,
          icon: phase.icon,
          methodCount,
          totalInUse,
          methods: methods.map((m) => m.type),
          variant: "overview",
        },
      };
    });

    // Apply layout algorithm
    const { nodes } = getPhaseOverviewLayout(projectNode, phaseNodes);

    // Create phase flow edges
    const edges = createPhaseFlowEdges();

    return { nodes, edges };
  } else {
    // DETAIL MODE: Show expanded phase + method nodes

    if (!viewState.selectedPhaseId) {
      // Fallback to overview if no phase selected
      return transformToPhaseNodes(project, stats, {
        level: "overview",
        selectedPhaseId: null,
      });
    }

    const selectedPhase = PHASE_INFO[viewState.selectedPhaseId];
    const methods = getMethodsForPhase(selectedPhase.id, stats);

    // Create expanded phase node
    const expandedPhaseNode: PhaseNode = {
      id: `phase-${selectedPhase.id}-expanded`,
      type: "phaseNodeExpanded",
      position: { x: 0, y: 0 }, // Will be set by layout
      data: {
        phaseId: selectedPhase.id,
        title: selectedPhase.title,
        subtitle: selectedPhase.subtitle,
        description: selectedPhase.description,
        icon: selectedPhase.icon,
        methodCount: methods.length, // Total number of methods in this phase
        totalInUse: methods.reduce((sum, m) => sum + m.count, 0), // Sum of counts in use
        methods: methods.map((m) => m.type),
        variant: "expanded",
      },
    };

    // Create method nodes for this phase
    const methodNodes: DashboardNode[] = methods.map((method) => {
      const subappInfo = SUBAPP_INFO[method.type];

      return {
        id: method.type,
        type: "dashboardNode",
        position: { x: 0, y: 0 }, // Will be set by layout
        data: {
          id: method.type,
          label: subappInfo.label,
          count: method.count,
          lastUpdated: method.lastUpdated,
          icon: subappInfo.icon,
          route: `/projects/${project.id}/${method.type}`,
          type: method.type,
        },
      };
    });

    // Apply detail layout algorithm
    const { nodes: layoutedNodes } = getPhaseDetailLayout(
      expandedPhaseNode,
      methodNodes
    );

    // Don't show project node in detail view (only in overview)
    const nodes = layoutedNodes;

    // Create phase-to-method edges
    const edges = createPhaseToMethodEdges(
      expandedPhaseNode.id,
      methodNodes.map((n) => n.id)
    );

    return { nodes, edges };
  }
}
