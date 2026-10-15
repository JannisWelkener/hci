/**
 * Utility functions for badge color styling across user story components
 */

// Standard badge size for consistency across all user story components
export const BADGE_SIZE_CLASS = "text-xs";

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "critical":
      return "border-red-600 text-red-600";
    case "high":
      return "border-orange-600 text-orange-600";
    case "medium":
      return "border-yellow-600 text-yellow-600";
    case "low":
      return "border-green-600 text-green-600";
    default:
      return "";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "done":
      return "border-green-600 text-green-600";
    case "in_progress":
      return "border-blue-600 text-blue-600";
    case "backlog":
      return "border-gray-600 text-gray-600";
    default:
      return "";
  }
}

export function formatPriority(priority: string): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export function formatStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
