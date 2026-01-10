import { useCallback, useEffect, useRef, useState } from "react";
import { useBoardStore } from "@/lib/boardStore";
import { PinCard } from "./PinCard";
import { EmptyState } from "./EmptyState";
import { motion } from "framer-motion";

export function Canvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  
  const {
    pins,
    viewport,
    setViewport,
    selectedPinId,
    selectPin,
    tool,
    isPanning,
    setIsPanning,
    showGrid,
    createPin,
  } = useBoardStore();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.code === "Space" && !isSpacePressed) {
        setIsSpacePressed(true);
        e.preventDefault();
      }
      
      // Delete selected pin
      if ((e.key === "Delete" || e.key === "Backspace") && selectedPinId) {
        useBoardStore.getState().deletePin(selectedPinId);
        e.preventDefault();
      }
      
      // Undo/Redo
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        if (e.shiftKey) {
          useBoardStore.getState().redo();
        } else {
          useBoardStore.getState().undo();
        }
        e.preventDefault();
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        useBoardStore.getState().redo();
        e.preventDefault();
      }
      
      // Zoom shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === "=") {
        useBoardStore.getState().zoomIn();
        e.preventDefault();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "-") {
        useBoardStore.getState().zoomOut();
        e.preventDefault();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "0") {
        useBoardStore.getState().resetZoom();
        e.preventDefault();
      }
      
      // Escape to deselect
      if (e.key === "Escape") {
        selectPin(null);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [selectedPinId, selectPin, isSpacePressed]);

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      if (e.ctrlKey || e.metaKey) {
        // Pinch zoom
        const delta = -e.deltaY * 0.01;
        const newZoom = Math.max(0.1, Math.min(4, viewport.zoom * (1 + delta)));
        
        // Zoom towards mouse position
        const zoomRatio = newZoom / viewport.zoom;
        const newX = mouseX - (mouseX - viewport.x) * zoomRatio;
        const newY = mouseY - (mouseY - viewport.y) * zoomRatio;
        
        setViewport({ x: newX, y: newY, zoom: newZoom });
      } else {
        // Pan
        setViewport({
          x: viewport.x - e.deltaX,
          y: viewport.y - e.deltaY,
        });
      }
    },
    [viewport, setViewport]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Handle panning
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== canvasRef.current) return;
      
      // Deselect when clicking canvas
      selectPin(null);
      
      if (isSpacePressed || tool === "pan" || e.button === 1) {
        setIsPanning(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        e.preventDefault();
      }
    },
    [isSpacePressed, tool, setIsPanning, selectPin]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      
      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;
      
      setViewport({
        x: viewport.x + deltaX,
        y: viewport.y + deltaY,
      });
      
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    },
    [isPanning, viewport, setViewport]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, [setIsPanning]);

  // Handle double-click to create pin
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== canvasRef.current) return;
      
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = (e.clientX - rect.left - viewport.x) / viewport.zoom;
      const y = (e.clientY - rect.top - viewport.y) / viewport.zoom;
      
      createPin({
        type: "text",
        position: { x, y },
        size: { width: 240, height: 160 },
        title: "",
        content: "",
        color: "default",
        tags: [],
      });
    },
    [viewport, createPin]
  );

  // Handle drop for images
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      
      const files = e.dataTransfer.files;
      if (files.length === 0) return;
      
      const file = files[0];
      if (!file.type.startsWith("image/")) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const rect = canvasRef.current!.getBoundingClientRect();
          const x = (e.clientX - rect.left - viewport.x) / viewport.zoom;
          const y = (e.clientY - rect.top - viewport.y) / viewport.zoom;
          
          const maxWidth = 400;
          const scale = img.width > maxWidth ? maxWidth / img.width : 1;
          
          createPin({
            type: "image",
            position: { x, y },
            size: { width: img.width * scale, height: img.height * scale },
            imageUrl: event.target?.result as string,
            imageMinWidth: img.width * scale,
            imageMinHeight: img.height * scale,
            color: "default",
            tags: [],
          });
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    [viewport, createPin]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const cursorStyle = isPanning
    ? "grabbing"
    : isSpacePressed || tool === "pan"
    ? "grab"
    : "default";

  return (
    <div
      ref={canvasRef}
      className="absolute inset-0 overflow-hidden bg-background"
      style={{ cursor: cursorStyle }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      data-testid="canvas"
    >
      {/* Grid pattern */}
      {showGrid && (
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: `
              radial-gradient(circle, hsl(var(--muted-foreground) / 0.3) 1px, transparent 1px)
            `,
            backgroundSize: `${20 * viewport.zoom}px ${20 * viewport.zoom}px`,
            backgroundPosition: `${viewport.x}px ${viewport.y}px`,
          }}
        />
      )}
      
      {/* Canvas content */}
      <motion.div
        className="absolute"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: "0 0",
          willChange: "transform",
        }}
        data-testid="canvas-content"
      >
        {pins.map((pin) => (
          <PinCard key={pin.id} pin={pin} />
        ))}
      </motion.div>
      
      {/* Empty state */}
      {pins.length === 0 && <EmptyState />}
    </div>
  );
}
