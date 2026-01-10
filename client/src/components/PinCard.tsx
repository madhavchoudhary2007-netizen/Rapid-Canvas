import { useCallback, useEffect, useRef, useState } from "react";
import { useBoardStore } from "@/lib/boardStore";
import type { Pin, ListItem } from "@shared/schema";
import { motion } from "framer-motion";
import { GripVertical, X, Check, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PinContextMenu } from "./PinContextMenu";

interface PinCardProps {
  pin: Pin;
}

const colorClasses: Record<string, string> = {
  default: "bg-card border-card-border",
  red: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50",
  orange: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/50",
  yellow: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900/50",
  green: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/50",
  blue: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50",
  purple: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/50",
  pink: "bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-900/50",
};

export function PinCard({ pin }: PinCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, pinX: 0, pinY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });
  
  const {
    selectedPinId,
    selectPin,
    updatePinSilent,
    deletePin,
    bringToFront,
    viewport,
    setIsDragging: setStoreDragging,
    setIsResizing: setStoreResizing,
    pushToUndoStack,
  } = useBoardStore();
  
  const isSelected = selectedPinId === pin.id;

  // Drag handlers
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      
      // Save to undo stack BEFORE we start dragging
      pushToUndoStack();
      
      setIsDragging(true);
      setStoreDragging(true);
      bringToFront(pin.id);
      selectPin(pin.id);
      
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        pinX: pin.position.x,
        pinY: pin.position.y,
      };
    },
    [pin.id, pin.position, bringToFront, selectPin, setStoreDragging, pushToUndoStack]
  );

  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - dragStart.current.x) / viewport.zoom;
      const deltaY = (e.clientY - dragStart.current.y) / viewport.zoom;
      
      // Use silent update to avoid polluting undo stack during drag
      updatePinSilent(pin.id, {
        position: {
          x: dragStart.current.pinX + deltaX,
          y: dragStart.current.pinY + deltaY,
        },
      });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setStoreDragging(false);
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, pin.id, viewport.zoom, updatePinSilent, setStoreDragging]);

  // Resize handlers
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      
      // Save to undo stack BEFORE we start resizing
      pushToUndoStack();
      
      setIsResizing(true);
      setStoreResizing(true);
      
      resizeStart.current = {
        x: e.clientX,
        y: e.clientY,
        width: pin.size.width,
        height: pin.size.height,
      };
    },
    [pin.size, setStoreResizing, pushToUndoStack]
  );

  useEffect(() => {
    if (!isResizing) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - resizeStart.current.x) / viewport.zoom;
      const deltaY = (e.clientY - resizeStart.current.y) / viewport.zoom;
      
      let newWidth = Math.max(120, resizeStart.current.width + deltaX);
      let newHeight = Math.max(80, resizeStart.current.height + deltaY);
      
      // For image pins, don't resize smaller than image dimensions
      if (pin.type === "image" && pin.imageMinWidth && pin.imageMinHeight) {
        newWidth = Math.max(pin.imageMinWidth, newWidth);
        newHeight = Math.max(pin.imageMinHeight, newHeight);
      }
      
      // Use silent update to avoid polluting undo stack during resize
      updatePinSilent(pin.id, {
        size: { width: newWidth, height: newHeight },
      });
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      setStoreResizing(false);
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, pin.id, pin.type, pin.imageMinWidth, pin.imageMinHeight, viewport.zoom, updatePinSilent, setStoreResizing]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectPin(pin.id);
    bringToFront(pin.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deletePin(pin.id);
  };

  return (
    <PinContextMenu pin={pin}>
      <motion.div
        ref={cardRef}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ 
          scale: isDragging ? 1.02 : 1, 
          opacity: 1,
          boxShadow: isDragging 
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.25)" 
            : isSelected
            ? "0 10px 25px -5px rgba(0, 0, 0, 0.1)"
            : "0 4px 12px -2px rgba(0, 0, 0, 0.08)"
        }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={cn(
          "absolute rounded-lg border overflow-hidden",
          "transition-[box-shadow] duration-150",
          colorClasses[pin.color] || colorClasses.default,
          isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
          isDragging && "z-50"
        )}
        style={{
          left: pin.position.x,
          top: pin.position.y,
          width: pin.size.width,
          height: pin.size.height,
          zIndex: isDragging ? 9999 : pin.zIndex,
        }}
        onClick={handleClick}
        data-testid={`pin-card-${pin.id}`}
      >
        {/* Header / Drag handle */}
        <div
          className="flex items-center justify-between px-2 py-1.5 cursor-move bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/5 dark:border-white/5"
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center gap-1 text-muted-foreground/50">
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <button
            onClick={handleDelete}
            className="p-0.5 rounded opacity-40 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
            data-testid={`button-delete-pin-${pin.id}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-3" style={{ height: pin.size.height - 32 }}>
          {pin.type === "text" && (
            <TextPinContent pin={pin} />
          )}
          {pin.type === "image" && (
            <ImagePinContent pin={pin} />
          )}
          {pin.type === "list" && (
            <ListPinContent pin={pin} />
          )}
        </div>

        {/* Resize handle */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 hover:opacity-100 transition-opacity"
          onMouseDown={handleResizeStart}
        >
          <svg
            className="w-full h-full text-muted-foreground/30"
            viewBox="0 0 16 16"
          >
            <path
              d="M14 14L8 14L14 8L14 14Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </motion.div>
    </PinContextMenu>
  );
}

function TextPinContent({ pin }: { pin: Pin }) {
  const { updatePin, updatePinSilent } = useBoardStore();
  const titleRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const initialTitle = useRef(pin.title || "");
  const initialContent = useRef(pin.content || "");
  
  const handleTitleFocus = () => {
    initialTitle.current = titleRef.current?.innerText || "";
  };
  
  const handleTitleBlur = () => {
    const newTitle = titleRef.current?.innerText || "";
    if (newTitle !== initialTitle.current) {
      updatePin(pin.id, { title: newTitle });
    }
  };
  
  const handleContentFocus = () => {
    initialContent.current = contentRef.current?.innerText || "";
  };
  
  const handleContentBlur = () => {
    const newContent = contentRef.current?.innerText || "";
    if (newContent !== initialContent.current) {
      updatePin(pin.id, { content: newContent });
    }
  };
  
  return (
    <div className="space-y-2 h-full">
      <div
        ref={titleRef}
        contentEditable
        suppressContentEditableWarning
        onFocus={handleTitleFocus}
        onBlur={handleTitleBlur}
        className="text-sm font-medium outline-none empty:before:content-['Title...'] empty:before:text-muted-foreground/40"
        data-testid={`input-pin-title-${pin.id}`}
      >
        {pin.title}
      </div>
      <div
        ref={contentRef}
        contentEditable
        suppressContentEditableWarning
        onFocus={handleContentFocus}
        onBlur={handleContentBlur}
        className="text-xs text-muted-foreground outline-none min-h-[40px] empty:before:content-['Write_something...'] empty:before:text-muted-foreground/30"
        data-testid={`input-pin-content-${pin.id}`}
      >
        {pin.content}
      </div>
    </div>
  );
}

function ImagePinContent({ pin }: { pin: Pin }) {
  return (
    <div className="w-full h-full flex items-center justify-center -m-3">
      {pin.imageUrl ? (
        <img
          src={pin.imageUrl}
          alt="Pin image"
          className="w-full h-full object-contain"
          draggable={false}
        />
      ) : (
        <div className="text-muted-foreground/30 text-xs">No image</div>
      )}
    </div>
  );
}

function ListPinContent({ pin }: { pin: Pin }) {
  const { updatePin, updatePinSilent, pushToUndoStack } = useBoardStore();
  const [newItemText, setNewItemText] = useState("");
  
  const items = pin.listItems || [];
  
  const toggleItem = (itemId: string) => {
    pushToUndoStack();
    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updatePinSilent(pin.id, { listItems: updatedItems });
  };
  
  const addItem = () => {
    if (!newItemText.trim()) return;
    pushToUndoStack();
    const newItem: ListItem = {
      id: Math.random().toString(36).substring(2, 9),
      text: newItemText.trim(),
      completed: false,
    };
    updatePinSilent(pin.id, { listItems: [...items, newItem] });
    setNewItemText("");
  };
  
  const deleteItem = (itemId: string) => {
    pushToUndoStack();
    updatePinSilent(pin.id, { listItems: items.filter((item) => item.id !== itemId) });
  };
  
  const updateItemText = (itemId: string, text: string) => {
    // Silent update while typing
    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, text } : item
    );
    updatePinSilent(pin.id, { listItems: updatedItems });
  };
  
  const handleItemBlur = (itemId: string) => {
    // Save to undo on blur
    pushToUndoStack();
  };
  
  return (
    <div className="space-y-1.5 h-full flex flex-col">
      <div className="flex-1 space-y-1 overflow-auto">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 group text-xs"
          >
            <button
              onClick={() => toggleItem(item.id)}
              className={cn(
                "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                item.completed
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-input hover:border-primary/50"
              )}
              data-testid={`checkbox-item-${item.id}`}
            >
              {item.completed && <Check className="w-2.5 h-2.5" />}
            </button>
            <input
              type="text"
              value={item.text}
              onChange={(e) => updateItemText(item.id, e.target.value)}
              onBlur={() => handleItemBlur(item.id)}
              className={cn(
                "flex-1 bg-transparent outline-none",
                item.completed && "line-through text-muted-foreground/50"
              )}
              data-testid={`input-item-${item.id}`}
            />
            <button
              onClick={() => deleteItem(item.id)}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive transition-opacity"
              data-testid={`button-delete-item-${item.id}`}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      
      <div className="flex items-center gap-2 pt-1 border-t border-black/5 dark:border-white/5">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="Add item..."
          className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground/30"
          data-testid={`input-new-item-${pin.id}`}
        />
        <button
          onClick={addItem}
          className="p-0.5 hover:bg-primary/10 rounded transition-colors"
          data-testid={`button-add-item-${pin.id}`}
        >
          <Plus className="w-3.5 h-3.5 text-primary" />
        </button>
      </div>
    </div>
  );
}
