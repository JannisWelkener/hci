import { Position } from "reactflow";
import type {
  DashboardNode,
  DashboardEdge,
  PhaseNode,
} from "@/lib/types/dashboard";
import type { IsoPhase } from "@/lib/types/database";

/**
 * Node dimensions for layout calculation
 */
const SUBAPP_NODE_WIDTH = 360;
const SUBAPP_NODE_HEIGHT = 240;
const PROJECT_NODE_WIDTH = 520;
const PROJECT_NODE_HEIGHT = 300;
const PHASE_NODE_WIDTH = 380;
const PHASE_NODE_HEIGHT = 280;
const EXPANDED_PHASE_WIDTH = 480;
const EXPANDED_PHASE_HEIGHT = 360;

/**
 * Calculate radial layout for dashboard nodes
 * Places project node in center with subapps arranged in a circle around it
 */
export function getRadialLayout(nodes: DashboardNode[]): {
  nodes: DashboardNode[];
} {
  const centerX = 0;
  const centerY = 0;
  const radius = 500; // Distance from center to subapp nodes

  const layoutedNodes: DashboardNode[] = nodes.map((node, index) => {
    // Project node goes in the center
    if (node.id === "project") {
      return {
        ...node,
        position: {
          x: centerX - PROJECT_NODE_WIDTH / 2,
          y: centerY - PROJECT_NODE_HEIGHT / 2,
        },
      };
    }

    // Calculate position for subapp nodes in a circle
    const subappNodes = nodes.filter((n) => n.id !== "project");
    const nodeIndex = subappNodes.findIndex((n) => n.id === node.id);
    const angle = (nodeIndex * 2 * Math.PI) / subappNodes.length;

    // Offset angle to start from top
    const adjustedAngle = angle - Math.PI / 2;

    const x =
      centerX + radius * Math.cos(adjustedAngle) - SUBAPP_NODE_WIDTH / 2;
    const y =
      centerY + radius * Math.sin(adjustedAngle) - SUBAPP_NODE_HEIGHT / 2;

    return {
      ...node,
      position: { x, y },
    };
  });

  return { nodes: layoutedNodes };
}

/**
 * Create edges from project hub to all subapps
 * Edges connect from the closest side of the project node to each subapp
 */
/*export function createHubEdges(subappIds: string[]): DashboardEdge[] {
  const totalNodes = subappIds.length;

  return subappIds.map((subappId, index) => {
    // Calculate the angle for this node (same as in getRadialLayout)
    const angle = (index * 2 * Math.PI) / totalNodes;
    const adjustedAngle = angle - Math.PI / 2;

    // Determine which handle to use based on the angle
    // Convert angle to degrees for easier calculation
    const degrees = (adjustedAngle * 180 / Math.PI + 360) % 360;

    let sourceHandle: string;

    // Top: 315° to 45° (0° is pointing right, going counter-clockwise)
    if (degrees >= 315 || degrees < 45) {
      sourceHandle = "right";
    }
    // Right-top: 45° to 135°
    else if (degrees >= 45 && degrees < 135) {
      sourceHandle = "bottom";
    }
    // Bottom: 135° to 225°
    else if (degrees >= 135 && degrees < 225) {
      sourceHandle = "left";
    }
    // Left-bottom: 225° to 315°
    else {
      sourceHandle = "bottom";
    }

    return {
      id: `project-to-${subappId}`,
      source: "project",
      sourceHandle,
      target: subappId,
      type: "straight",
      animated: true,
      style: { strokeWidth: 2 },
    };
  });
}*/

export function createHubEdges(subappIds: string[]): DashboardEdge[] {
  const total = subappIds.length;

  return subappIds.map((subappId, index) => {
    const angle = (index * 2 * Math.PI) / total;
    const adjusted = angle - Math.PI / 2;

    const dx = Math.cos(adjusted);
    const dy = Math.sin(adjusted);

    let sourceHandle: "top" | "right" | "bottom" | "left";

    if (Math.abs(dx) > Math.abs(dy)) {
      sourceHandle = dx > 0 ? "right" : "left";
    } else {
      sourceHandle = dy > 0 ? "bottom" : "top";
    }

    return {
      id: `project-to-${subappId}`,
      source: "project",
      sourceHandle,
      target: subappId,
      type: "smoothstep",
      animated: true,
      style: { strokeWidth: 2 },
    };
  });
}

/**
 * Phase position mapping for circular layout
 * Maps each ISO phase to its position index (0-3) in the circle
 */
const PHASE_POSITIONS: Record<IsoPhase, number> = {
  understand_context: 0, // Top (270° / -90°)
  specify_requirements: 1, // Right (0°)
  produce_design_solutions: 2, // Bottom (90°)
  evaluate_against_requirements: 3, // Left (180°)
};

/**
 * Calculate phase overview layout
 * Positions project node at top-left and 4 phase nodes in a circle with empty center
 */
export function getPhaseOverviewLayout(
  projectNode: DashboardNode,
  phaseNodes: PhaseNode[]
): { nodes: DashboardNode[] } {
  const centerX = 0;
  const centerY = 0;
  const PHASE_CIRCLE_RADIUS = 450; // Distance from center to phase nodes (reduced for tighter spacing)
  const PROJECT_NODE_OFFSET = { x: -950, y: -650 }; // Higher and to the left of Analysis phase

  const layoutedNodes: DashboardNode[] = [];

  // Position project node at top-left
  layoutedNodes.push({
    ...projectNode,
    position: {
      x: centerX + PROJECT_NODE_OFFSET.x,
      y: centerY + PROJECT_NODE_OFFSET.y,
    },
  });

  // Position phase nodes in circular formation
  phaseNodes.forEach((node) => {
    const phaseId = node.data.phaseId as IsoPhase;
    const positionIndex = PHASE_POSITIONS[phaseId];

    // Calculate angle (start from top: -90°, then clockwise)
    // positionIndex: 0=top, 1=right, 2=bottom, 3=left
    const angle = (positionIndex * Math.PI) / 2 - Math.PI / 2;

    const x =
      centerX + PHASE_CIRCLE_RADIUS * Math.cos(angle) - PHASE_NODE_WIDTH / 2;
    const y =
      centerY + PHASE_CIRCLE_RADIUS * Math.sin(angle) - PHASE_NODE_HEIGHT / 2;

    layoutedNodes.push({
      ...node,
      position: { x, y },
    });
  });

  return { nodes: layoutedNodes };
}

/**
 * Calculate phase detail layout using golden angle distribution
 * Positions expanded phase at center with methods clustered organically around it
 *
 * Uses Vogel's method (golden angle spiral) for natural, non-grid positioning
 */
export function getPhaseDetailLayout(
  expandedPhaseNode: PhaseNode,
  methodNodes: DashboardNode[]
): { nodes: DashboardNode[] } {
  const centerX = 0;
  const centerY = 0;
  const layoutedNodes: DashboardNode[] = [];

  // Position expanded phase at center
  layoutedNodes.push({
    ...expandedPhaseNode,
    position: {
      x: centerX - EXPANDED_PHASE_WIDTH / 2,
      y: centerY - EXPANDED_PHASE_HEIGHT / 2,
    },
  });

  // Cluster methods around phase in organic layout
  const methodCount = methodNodes.length;

  if (methodCount === 0) {
    return { nodes: layoutedNodes };
  }

  // Golden angle for natural spacing (137.5°)
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
  const BASE_RADIUS = 450;
  const RADIUS_INCREMENT = 80; // Add spacing for multiple rings

  methodNodes.forEach((node, index) => {
    // Use Vogel's method for organic sunflower seed distribution
    const angle = index * GOLDEN_ANGLE;
    const radiusMultiplier = Math.sqrt(index + 1) / Math.sqrt(methodCount);
    const radius = BASE_RADIUS + RADIUS_INCREMENT * radiusMultiplier;

    const x = centerX + radius * Math.cos(angle) - SUBAPP_NODE_WIDTH / 2;
    const y = centerY + radius * Math.sin(angle) - SUBAPP_NODE_HEIGHT / 2;

    layoutedNodes.push({
      ...node,
      position: { x, y },
    });
  });

  return { nodes: layoutedNodes };
}

/**
 * Create edges showing the iterative HCI process flow between phases
 * Flow: Project → Analysis → User Requirements → Solutions → Evaluation
 * Evaluation provides feedback to all three phases
 */
export function createPhaseFlowEdges(): DashboardEdge[] {
  const edges: DashboardEdge[] = [];

  // (1 r -> (2 t: Project right → Analysis top
  edges.push({
    id: "project-to-analysis",
    source: "project",
    sourceHandle: "right",
    target: "phase-understand_context",
    targetHandle: "top-target",
    type: "default",
    animated: true,
    markerEnd: { type: "arrowclosed", width: 20, height: 20 },
    style: { strokeWidth: 3, strokeDasharray: "5,5" },
  } as DashboardEdge);

  // Forward flow with specific handles
  const forwardFlow: DashboardEdge[] = [
    // Analysis right → User Requirements top
    {
      id: "flow-understand_context-specify_requirements",
      source: "phase-understand_context",
      sourceHandle: "right",
      target: "phase-specify_requirements",
      targetHandle: "top-target",
      type: "default",
      animated: true,
      markerEnd: { type: "arrowclosed", width: 20, height: 20 },
      style: { strokeWidth: 3, strokeDasharray: "5,5" },
    } as DashboardEdge,
    // User Requirements bottom → Solutions right
    {
      id: "flow-specify_requirements-produce_design_solutions",
      source: "phase-specify_requirements",
      sourceHandle: "bottom",
      target: "phase-produce_design_solutions",
      targetHandle: "right-target",
      type: "default",
      animated: true,
      markerEnd: { type: "arrowclosed", width: 20, height: 20 },
      style: { strokeWidth: 3, strokeDasharray: "5,5" },
    } as DashboardEdge,
    // Solutions left → Evaluation bottom
    {
      id: "flow-produce_design_solutions-evaluate_against_requirements",
      source: "phase-produce_design_solutions",
      sourceHandle: "left",
      target: "phase-evaluate_against_requirements",
      targetHandle: "bottom-target",
      type: "default",
      animated: true,
      markerEnd: { type: "arrowclosed", width: 20, height: 20 },
      style: { strokeWidth: 3, strokeDasharray: "5,5" },
    } as DashboardEdge,
  ];

  // Feedback loops from Evaluation with specific handle positions
  const feedbackLoops: DashboardEdge[] = [
    // (4 r -> (1 b: Evaluation right → Analysis bottom
    {
      id: "flow-evaluate_against_requirements-understand_context",
      source: "phase-evaluate_against_requirements",
      sourceHandle: "right",
      target: "phase-understand_context",
      targetHandle: "bottom-target",
      type: "default",
      animated: true,
      markerEnd: { type: "arrowclosed", width: 20, height: 20 },
      style: { strokeWidth: 3, strokeDasharray: "5,5" },
    } as DashboardEdge,
    // (4 r -> (2 l: Evaluation right → User Requirements left
    {
      id: "flow-evaluate_against_requirements-specify_requirements",
      source: "phase-evaluate_against_requirements",
      sourceHandle: "right",
      target: "phase-specify_requirements",
      targetHandle: "left-target",
      type: "default",
      animated: true,
      markerEnd: { type: "arrowclosed", width: 20, height: 20 },
      style: { strokeWidth: 3, strokeDasharray: "5,5" },
    } as DashboardEdge,
    // (4 r -> (3 t: Evaluation right → Solutions top
    {
      id: "flow-evaluate_against_requirements-produce_design_solutions",
      source: "phase-evaluate_against_requirements",
      sourceHandle: "right",
      target: "phase-produce_design_solutions",
      targetHandle: "top-target",
      type: "default",
      animated: true,
      markerEnd: { type: "arrowclosed", width: 20, height: 20 },
      style: { strokeWidth: 3, strokeDasharray: "5,5" },
    } as DashboardEdge,
  ];

  return [...edges, ...forwardFlow, ...feedbackLoops];
}

/**
 * Create edges connecting phase to its methods in detail view
 * Connects from the expanded phase node to each method node
 */
export function createPhaseToMethodEdges(
  phaseNodeId: string,
  methodNodeIds: string[]
): DashboardEdge[] {
  return methodNodeIds.map(
    (methodId) =>
      ({
        id: `phase-to-${methodId}`,
        source: phaseNodeId,
        target: methodId,
        type: "default",
        animated: false, // Less visual noise in detail view
        markerEnd: {
          type: "arrowclosed",
          width: 20,
          height: 20,
        },
        style: {
          strokeWidth: 2,
          stroke: "hsl(var(--primary) / 0.5)", // Subtle
          strokeDasharray: "5,5",
        },
      } as DashboardEdge)
  );
}
