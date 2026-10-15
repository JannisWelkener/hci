"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePageState } from "@/lib/hooks/use-page-state";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type ColumnFiltersState,
  type Row,
} from "@tanstack/react-table";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowUpDown,
  MoreVertical,
  Eye,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  UserStory,
  UserStoryPriority,
  UserStoryStatus,
} from "@/lib/types/database";
import { useUpdateStoryOrder } from "@/lib/hooks/use-user-stories";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getPriorityColor,
  getStatusColor,
  BADGE_SIZE_CLASS,
} from "@/lib/utils/badge-styles";

interface UserStoriesTableProps {
  projectId: string;
  stories: UserStory[];
  onEdit?: (story: UserStory) => void;
  onDelete?: (story: UserStory) => void;
  onView?: (story: UserStory) => void;
  enableDragDrop?: boolean;
}

// Sortable Row Component
function SortableRow({
  row,
  onView,
}: {
  row: Row<UserStory>;
  onView?: (story: UserStory) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: row.original.id,
    transition: null,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transform ? 'transform 0ms' : transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      data-state={row.getIsSelected() && "selected"}
      data-row-id={row.original.id}
      className={isDragging ? "relative z-50" : ""}
      onClick={() => onView?.(row.original)}
    >
      {/* Drag Handle Cell */}
      <TableCell className="w-[40px]">
        <button
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function UserStoriesTable({
  projectId,
  stories,
  onEdit,
  onDelete,
  onView,
  enableDragDrop = true,
}: UserStoriesTableProps) {
  const router = useRouter();

  // Use page state hook with sessionStorage
  const { state: pageState, updateState, isRestored } = usePageState({
    storageKey: 'userStoriesPageState',
    defaultValues: { page: '1' },
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState({
    pageIndex: 0, // Will be synced from pageState after restoration
    pageSize: 12,
  });
  const [orderedStories, setOrderedStories] = useState<UserStory[]>(stories);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Update ordered stories when stories prop changes
  useEffect(() => {
    setOrderedStories(stories);
  }, [stories]);

  // Sync pagination.pageIndex with pageState (especially after restoration)
  useEffect(() => {
    // Only sync after state has been restored from sessionStorage
    if (!isRestored) return;

    const newPageIndex = parseInt(pageState.page, 10) - 1;
    if (pagination.pageIndex !== newPageIndex) {
      setPagination(prev => ({ ...prev, pageIndex: newPageIndex }));
    }
  }, [pageState.page, isRestored]);

  // Handle pagination changes from React Table
  const handlePaginationChange = useCallback((updater: any) => {
    setPagination((prev) => {
      const newPagination = typeof updater === 'function' ? updater(prev) : updater;

      // Update page state when page index changes
      const newPageNumber = (newPagination.pageIndex + 1).toString();
      if (newPageNumber !== pageState.page) {
        updateState({ page: newPageNumber });
      }

      return newPagination;
    });
  }, [pageState.page, updateState]);

  // React Query mutation for updating story order
  const updateStoryOrder = useUpdateStoryOrder(projectId);

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Custom modifier to restrict dragging within table bounds
  const restrictToTableBounds = (args: any) => {
    const { transform, draggingNodeRect, containerNodeRect } = args;

    if (!draggingNodeRect || !containerNodeRect) {
      return transform;
    }

    // Always restrict to table bounds
    const minY = containerNodeRect.top - draggingNodeRect.top;
    const maxY = containerNodeRect.bottom - draggingNodeRect.bottom;

    return {
      ...transform,
      y: Math.min(Math.max(transform.y, minY), maxY),
    };
  };

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = orderedStories.findIndex(
      (story) => story.id === active.id
    );
    const newIndex = orderedStories.findIndex((story) => story.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistically reorder locally
    const reorderedStories = arrayMove(orderedStories, oldIndex, newIndex);
    setOrderedStories(reorderedStories);

    // Calculate new priority_order values
    const updates = reorderedStories.map((story, index) => ({
      id: story.id,
      priority_order: (index + 1),
    }));

    // Send update to backend
    updateStoryOrder.mutate(
      { stories: updates },
      {
        onError: () => {
          // Revert on error
          setOrderedStories(stories);
          toast.error("Failed to update story order");
        },
      }
    );
  }, [orderedStories, updateStoryOrder, stories]);

  const columns: ColumnDef<UserStory>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const story = row.original;
        return (
          <div className="max-w-[300px]">
            <div className="font-medium truncate">{story.title}</div>
            <div className="text-xs text-muted-foreground truncate">
              As a {story.user_role}, I want to {story.action}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "priority",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Priority
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const priority = row.getValue("priority") as UserStoryPriority | null;
        if (!priority) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="text-center w-[64px]">
            <Badge
              variant="outline"
              className={cn(
                BADGE_SIZE_CLASS,
                "capitalize",
                getPriorityColor(priority)
              )}
            >
              {priority}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const status = row.getValue("status") as UserStoryStatus | null;
        if (!status) return <span className="text-muted-foreground">-</span>;
        return (
          <Badge
            variant="outline"
            className={cn(
              BADGE_SIZE_CLASS,
              "capitalize",
              getStatusColor(status)
            )}
          >
            {status.replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "story_points",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Points
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const points = row.getValue("story_points") as number | null;
        return <div className="text-left pl-5 font-mono">{points ?? "-"}</div>;
      },
    },
    {
      accessorKey: "generation_method",
      header: "Method",
      cell: ({ row }) => {
        const method = row.original.generation_method;
        return (
          <div className="text-center w-[64px]">
            <Badge variant="outline" className={cn(BADGE_SIZE_CLASS, "capitalize")}>
              {method === "ai_generated" ? "AI" : "Manual"}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "dependencies",
      header: "Dependencies",
      cell: ({ row }) => {
        const deps = row.original.dependencies || [];
        if (deps.length === 0) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }
        return (
          <div className="text-sm">
            {deps.length} {deps.length === 1 ? "dependency" : "dependencies"}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const story = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem
                  onClick={() => {
                    onView(story);
                  }}
                >
                  View Details
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(story);
                  }}
                >
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(story);
                  }}
                  className="text-red-600"
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: orderedStories,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: handlePaginationChange,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
    getRowId: (row) => row.id, // Use story ID as row ID for DnD
  });

  const content = (
    <div className="space-y-4">
      {/* Column visibility toggle */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} total stories
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Eye className="mr-2 h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize hover:bg-[#333333]"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div ref={tableContainerRef} className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {enableDragDrop && (
                  <TableHead className="w-[40px]">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </TableHead>
                )}
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {enableDragDrop ? (
              <>
                {table.getRowModel().rows?.length ? (
                  table
                    .getRowModel()
                    .rows.map((row) => (
                      <SortableRow key={row.id} row={row} onView={onView} />
                    ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + 1}
                      className="h-24 text-center"
                    >
                      No user stories found.
                    </TableCell>
                  </TableRow>
                )}
              </>
            ) : (
              <>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No user stories found.
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <TablePagination
          currentPage={table.getState().pagination.pageIndex + 1}
          totalPages={table.getPageCount()}
          onPreviousPage={() => table.previousPage()}
          onNextPage={() => table.nextPage()}
          canPreviousPage={table.getCanPreviousPage()}
          canNextPage={table.getCanNextPage()}
        />
      )}
    </div>
  );

  if (enableDragDrop) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToTableBounds]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={table.getRowModel().rows.map((row) => row.id)}
          strategy={verticalListSortingStrategy}
        >
          {content}
        </SortableContext>
      </DndContext>
    );
  }

  return content;
}
