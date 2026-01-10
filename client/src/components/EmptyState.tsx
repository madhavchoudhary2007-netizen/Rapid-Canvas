import { MousePointerClick, Plus, Image, List } from "lucide-react";
import { motion } from "framer-motion";

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      data-testid="empty-state"
    >
      <div className="text-center space-y-6 max-w-md px-8">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex justify-center"
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <MousePointerClick className="w-10 h-10 text-primary/60" />
            </div>
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -inset-2 rounded-3xl bg-primary/10 -z-10"
            />
          </div>
        </motion.div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-light text-foreground/80 tracking-tight">
            Your canvas is empty
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Double-click anywhere to create a pin, or use the toolbar to add content.
            Drag images directly onto the canvas.
          </p>
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-6 text-xs text-muted-foreground/70"
        >
          <div className="flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Pin</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Image className="w-3.5 h-3.5" />
            <span>Drop Image</span>
          </div>
          <div className="flex items-center gap-1.5">
            <List className="w-3.5 h-3.5" />
            <span>Create List</span>
          </div>
        </motion.div>
        
        <div className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
          Hold Space + Drag to pan • Scroll to zoom
        </div>
      </div>
    </motion.div>
  );
}
