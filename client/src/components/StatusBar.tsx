import { useBoardStore } from "@/lib/boardStore";
import { motion } from "framer-motion";

export function StatusBar() {
  const { pins, viewport } = useBoardStore();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="fixed bottom-4 left-4 z-40 flex items-center gap-4 px-3 py-1.5 rounded-lg bg-card/60 backdrop-blur-sm border border-card-border text-[10px] text-muted-foreground font-mono"
      data-testid="status-bar"
    >
      <span data-testid="status-pin-count">
        {pins.length} {pins.length === 1 ? "pin" : "pins"}
      </span>
      <span className="w-px h-3 bg-border" />
      <span data-testid="status-zoom">
        {Math.round(viewport.zoom * 100)}%
      </span>
    </motion.div>
  );
}
