import { Node, Edge } from 'reactflow';
import type { IsoPhase } from './database';

/**
 * Subapp identifier for dashboard nodes
 */
export type SubappType =
  | 'user-stories'
  | 'personas'
  | 'user-journeys'
  | 'mockups'
  | 'wireframes';

/**
 * Data structure for dashboard node
 */
export interface NodeData {
  id: string;
  label: string;
  count: number;
  lastUpdated: string | null;
  icon: string; // Lucide icon name
  route: string; // Navigation route (e.g., /projects/[id]/user-stories)
  type: SubappType;
}

/**
 * Data structure for central project node
 */
export interface ProjectNodeData {
  id: string;
  projectName: string;
  description: string | null;
  currentPhase: string | null;
  startDate: string | null;
}

/**
 * Data structure for phase nodes
 * Used in the phase-based dashboard visualization
 */
export interface PhaseNodeData {
  phaseId: IsoPhase;
  title: string;
  subtitle: string;
  description: string;
  icon: string; // Lucide icon name
  methodCount: number; // Total number of methods available in this phase
  totalInUse: number; // Sum of counts of all methods being used in this phase
  methods: SubappType[];
  variant: 'overview' | 'expanded';
}

/**
 * View state for dashboard zoom levels
 */
export interface ViewState {
  level: 'overview' | 'detail';
  selectedPhaseId: IsoPhase | null;
}

/**
 * Union type for all node data
 */
export type AnyNodeData = NodeData | ProjectNodeData | PhaseNodeData;

/**
 * Dashboard node type (extends React Flow Node)
 * Can be either a subapp node or project node
 */
export type DashboardNode = Node<AnyNodeData>;

/**
 * Phase node type (extends React Flow Node)
 */
export type PhaseNode = Node<PhaseNodeData>;

/**
 * Dashboard edge type (extends React Flow Edge)
 */
export type DashboardEdge = Edge;

/**
 * Complete dashboard graph data
 */
export interface DashboardGraphData {
  nodes: DashboardNode[];
  edges: DashboardEdge[];
}
