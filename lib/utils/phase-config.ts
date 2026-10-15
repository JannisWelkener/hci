import type { IsoPhase } from "@/lib/types/database";
import type { SubappType } from "@/lib/types/dashboard";

/**
 * Phase information interface
 */
export interface PhaseInfo {
  id: IsoPhase;
  title: string;
  subtitle: string;
  description: string;
  icon: string; // Lucide icon name
}

/**
 * Phase metadata mapping for ISO 9241-210 HCI process
 * Maps each phase to its display information
 */
export const PHASE_INFO: Record<IsoPhase, PhaseInfo> = {
  understand_context: {
    id: "understand_context",
    title: "Analysis",
    subtitle: "Understand user needs & goals",
    description: "Understand and analyze the context of use by identifying users, their characteristics, goals, tasks, and the environment in which the product will be used. This phase involves user research, contextual inquiry, and developing a deep understanding of user needs and pain points.",
    icon: "Search",
  },
  specify_requirements: {
    id: "specify_requirements",
    title: "User Requirements",
    subtitle: "Define solution requirements",
    description: "Define and document user requirements and organizational requirements that must be met for the product to be successful. This includes specifying functional and non-functional requirements, user stories, acceptance criteria, and success metrics based on the understanding of context.",
    icon: "ClipboardList",
  },
  produce_design_solutions: {
    id: "produce_design_solutions",
    title: "Solutions",
    subtitle: "Build & test prototypes",
    description: "Create and develop design solutions that meet the specified requirements. This involves producing design concepts, wireframes, mockups, and interactive prototypes that can be evaluated with users. Multiple design iterations may be created and refined throughout this phase.",
    icon: "Lightbulb",
  },
  evaluate_against_requirements: {
    id: "evaluate_against_requirements",
    title: "Evaluation",
    subtitle: "Test & refine with users",
    description: "Conduct evaluations to assess how well the design solutions meet user needs and requirements. This includes usability testing, user feedback sessions, heuristic evaluations, and measuring against defined success metrics. Insights from evaluation inform further iterations or validate the design for implementation.",
    icon: "CheckCircle",
  },
};

/**
 * Method-to-phase mapping
 * Defines which sub-apps (methods) belong to which HCI phases
 * Some methods appear in multiple phases
 */
export const METHOD_TO_PHASES: Record<SubappType, IsoPhase[]> = {
  personas: ["understand_context", "specify_requirements"],
  "user-journeys": ["understand_context", "specify_requirements"],
  "user-stories": ["specify_requirements"],
  wireframes: ["specify_requirements", "produce_design_solutions"],
  mockups: ["specify_requirements", "produce_design_solutions"],
};

/**
 * Mapping of SubappType to stats key in ProjectStats
 */
const SUBAPP_TO_STATS_KEY: Record<SubappType, string> = {
  "user-stories": "userStories",
  personas: "personas",
  "user-journeys": "userJourneys",
  mockups: "mockups",
  wireframes: "wireframes",
};

/**
 * Subapp metadata for display
 */
const SUBAPP_INFO: Record<SubappType, { label: string; icon: string }> = {
  "user-stories": { label: "User Stories", icon: "FileText" },
  personas: { label: "Personas", icon: "Users" },
  "user-journeys": { label: "User Journeys", icon: "Map" },
  wireframes: { label: "Wireframes", icon: "Layers" },
  mockups: { label: "Mockups", icon: "Figma" },
};

export { SUBAPP_TO_STATS_KEY, SUBAPP_INFO };

/**
 * Get methods (sub-apps) that belong to a specific phase
 * Returns method type and count from stats
 *
 * @param phaseId - The ISO phase identifier
 * @param stats - Project statistics containing counts for each method
 * @returns Array of methods with their counts for the given phase
 */
export function getMethodsForPhase(
  phaseId: IsoPhase,
  stats: any // Using any to avoid circular dependency with ProjectStats
): Array<{ type: SubappType; count: number; lastUpdated: string | null }> {
  const methods: Array<{
    type: SubappType;
    count: number;
    lastUpdated: string | null;
  }> = [];

  // Iterate through all method-to-phase mappings
  Object.entries(METHOD_TO_PHASES).forEach(([method, phases]) => {
    // Check if this method belongs to the requested phase
    if (phases.includes(phaseId)) {
      const methodType = method as SubappType;
      const statsKey = SUBAPP_TO_STATS_KEY[methodType];

      // Get stats for this method
      if (stats[statsKey]) {
        methods.push({
          type: methodType,
          count: stats[statsKey].count,
          lastUpdated: stats[statsKey].lastUpdated,
        });
      }
    }
  });

  return methods;
}
