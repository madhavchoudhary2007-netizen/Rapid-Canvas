import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBoardStore } from "@/lib/boardStore";
import { ThemeToggle } from "./ThemeToggle";
import {
  Plus,
  List,
  Undo2,
  Redo2,
  Bookmark,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Hand,
  MousePointer2,
  Grid3X3,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const zoomLevels = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

export function Toolbar() {
  const {
    viewport,
    setViewport,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToContent,
    tool,
    setTool,
    showGrid,
    toggleGrid,
    toggleSnapshots,
    showSnapshots,
    createPin,
    undo,
    redo,
    canUndo,
    canRedo,
    clearBoard,
    pins,
  } = useBoardStore();

  const handleAddTextPin = () => {
    const centerX = (window.innerWidth / 2 - viewport.x) / viewport.zoom;
    const centerY = (window.innerHeight / 2 - viewport.y) / viewport.zoom;
    
    createPin({
      type: "text",
      position: { x: centerX - 120, y: centerY - 80 },
      size: { width: 240, height: 160 },
      title: "",
      content: "",
      color: "default",
      tags: [],
    });
  };

  const handleAddListPin = () => {
    const centerX = (window.innerWidth / 2 - viewport.x) / viewport.zoom;
    const centerY = (window.innerHeight / 2 - viewport.y) / viewport.zoom;
    
    createPin({
      type: "list",
      position: { x: centerX - 140, y: centerY - 100 },
      size: { width: 280, height: 200 },
      title: "Checklist",
      listItems: [],
      color: "default",
      tags: [],
    });
  };

  const handleSetZoom = (zoom: number) => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Calculate new viewport position to keep center in place
    const currentCenterCanvasX = (centerX - viewport.x) / viewport.zoom;
    const currentCenterCanvasY = (centerY - viewport.y) / viewport.zoom;
    
    setViewport({
      x: centerX - currentCenterCanvasX * zoom,
      y: centerY - currentCenterCanvasY * zoom,
      zoom,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed top-4 right-4 z-40 flex items-center gap-1 p-1.5 rounded-xl bg-card/80 backdrop-blur-xl border border-card-border shadow-lg"
      data-testid="toolbar"
    >
      {/* Add pins */}
      <div className="flex items-center gap-0.5 pr-1.5 border-r border-border">
        <ToolbarButton
          icon={<Plus className="w-4 h-4" />}
          tooltip="Add Text Pin"
          onClick={handleAddTextPin}
          testId="button-add-text-pin"
        />
        <ToolbarButton
          icon={<List className="w-4 h-4" />}
          tooltip="Add List Pin"
          onClick={handleAddListPin}
          testId="button-add-list-pin"
        />
      </div>

      {/* Undo/Redo */}
      <div className="flex items-center gap-0.5 px-1.5 border-r border-border">
        <ToolbarButton
          icon={<Undo2 className="w-4 h-4" />}
          tooltip="Undo (Ctrl+Z)"
          onClick={undo}
          disabled={!canUndo()}
          testId="button-undo"
        />
        <ToolbarButton
          icon={<Redo2 className="w-4 h-4" />}
          tooltip="Redo (Ctrl+Y)"
          onClick={redo}
          disabled={!canRedo()}
          testId="button-redo"
        />
      </div>

      {/* Tools */}
      <div className="flex items-center gap-0.5 px-1.5 border-r border-border">
        <ToolbarButton
          icon={<MousePointer2 className="w-4 h-4" />}
          tooltip="Select Tool"
          onClick={() => setTool("select")}
          active={tool === "select"}
          testId="button-tool-select"
        />
        <ToolbarButton
          icon={<Hand className="w-4 h-4" />}
          tooltip="Pan Tool (Hold Space)"
          onClick={() => setTool("pan")}
          active={tool === "pan"}
          testId="button-tool-pan"
        />
        <ToolbarButton
          icon={<Grid3X3 className="w-4 h-4" />}
          tooltip="Toggle Grid"
          onClick={toggleGrid}
          active={showGrid}
          testId="button-toggle-grid"
        />
      </div>

      {/* Zoom */}
      <div className="flex items-center gap-0.5 px-1.5 border-r border-border">
        <ToolbarButton
          icon={<ZoomOut className="w-4 h-4" />}
          tooltip="Zoom Out"
          onClick={zoomOut}
          testId="button-zoom-out"
        />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 min-w-[60px] text-xs font-mono gap-0.5"
              data-testid="button-zoom-level"
            >
              {Math.round(viewport.zoom * 100)}%
              <ChevronDown className="w-3 h-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="min-w-[100px]">
            {zoomLevels.map((level) => (
              <DropdownMenuItem
                key={level}
                onClick={() => handleSetZoom(level)}
                className="text-xs font-mono justify-center"
                data-testid={`menu-zoom-${level * 100}`}
              >
                {Math.round(level * 100)}%
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <ToolbarButton
          icon={<ZoomIn className="w-4 h-4" />}
          tooltip="Zoom In"
          onClick={zoomIn}
          testId="button-zoom-in"
        />
        <ToolbarButton
          icon={<Maximize2 className="w-4 h-4" />}
          tooltip="Fit to Content"
          onClick={fitToContent}
          disabled={pins.length === 0}
          testId="button-fit-content"
        />
      </div>

      {/* Snapshots & Actions */}
      <div className="flex items-center gap-0.5 pl-1.5">
        <ToolbarButton
          icon={<Bookmark className="w-4 h-4" />}
          tooltip="Snapshots"
          onClick={toggleSnapshots}
          active={showSnapshots}
          testId="button-snapshots"
        />
        <ToolbarButton
          icon={<Trash2 className="w-4 h-4" />}
          tooltip="Clear Board"
          onClick={clearBoard}
          disabled={pins.length === 0}
          testId="button-clear-board"
        />
        <div className="w-px h-5 bg-border mx-1" />
        <ThemeToggle />
      </div>
    </motion.div>
  );
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  testId: string;
}

function ToolbarButton({
  icon,
  tooltip,
  onClick,
  disabled,
  active,
  testId,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "h-8 w-8",
            active && "bg-primary/10 text-primary hover:bg-primary/20"
          )}
          data-testid={testId}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8}>
        <p className="text-xs">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
