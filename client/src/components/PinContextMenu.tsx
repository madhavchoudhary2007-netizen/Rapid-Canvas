import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useBoardStore } from "@/lib/boardStore";
import type { Pin, PinColor } from "@shared/schema";
import { Copy, Trash2, Palette, ArrowUpToLine } from "lucide-react";
import { cn } from "@/lib/utils";

interface PinContextMenuProps {
  pin: Pin;
  children: React.ReactNode;
}

const colors: { value: PinColor; label: string; class: string }[] = [
  { value: "default", label: "Default", class: "bg-card" },
  { value: "red", label: "Red", class: "bg-red-400" },
  { value: "orange", label: "Orange", class: "bg-orange-400" },
  { value: "yellow", label: "Yellow", class: "bg-yellow-400" },
  { value: "green", label: "Green", class: "bg-green-400" },
  { value: "blue", label: "Blue", class: "bg-blue-400" },
  { value: "purple", label: "Purple", class: "bg-purple-400" },
  { value: "pink", label: "Pink", class: "bg-pink-400" },
];

export function PinContextMenu({ pin, children }: PinContextMenuProps) {
  const { duplicatePin, deletePin, updatePin, bringToFront } = useBoardStore();

  const handleColorChange = (color: PinColor) => {
    updatePin(pin.id, { color });
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem
          onClick={() => duplicatePin(pin.id)}
          className="gap-2"
          data-testid={`menu-duplicate-${pin.id}`}
        >
          <Copy className="w-4 h-4" />
          Duplicate
        </ContextMenuItem>
        
        <ContextMenuItem
          onClick={() => bringToFront(pin.id)}
          className="gap-2"
          data-testid={`menu-bring-front-${pin.id}`}
        >
          <ArrowUpToLine className="w-4 h-4" />
          Bring to Front
        </ContextMenuItem>
        
        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2">
            <Palette className="w-4 h-4" />
            Color
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-36">
            {colors.map((color) => (
              <ContextMenuItem
                key={color.value}
                onClick={() => handleColorChange(color.value)}
                className="gap-2"
                data-testid={`menu-color-${color.value}`}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full border border-black/10",
                    color.class
                  )}
                />
                {color.label}
                {pin.color === color.value && (
                  <span className="ml-auto text-primary">•</span>
                )}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem
          onClick={() => deletePin(pin.id)}
          className="gap-2 text-destructive focus:text-destructive"
          data-testid={`menu-delete-${pin.id}`}
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
