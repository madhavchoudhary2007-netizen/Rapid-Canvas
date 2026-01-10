import { useState } from "react";
import { useBoardStore } from "@/lib/boardStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, RotateCcw, Trash2, Edit2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function SnapshotPanel() {
  const {
    showSnapshots,
    toggleSnapshots,
    snapshots,
    createSnapshot,
    restoreSnapshot,
    deleteSnapshot,
    renameSnapshot,
  } = useBoardStore();
  
  const [newSnapshotName, setNewSnapshotName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreateSnapshot = () => {
    const name = newSnapshotName.trim() || `Snapshot ${snapshots.length + 1}`;
    createSnapshot(name);
    setNewSnapshotName("");
  };

  const handleStartEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const handleSaveEdit = () => {
    if (editingId && editName.trim()) {
      renameSnapshot(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName("");
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AnimatePresence>
      {showSnapshots && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={toggleSnapshots}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-80 bg-card/95 backdrop-blur-xl border-l border-card-border z-50 flex flex-col"
            data-testid="snapshot-panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-sm font-medium">Snapshots</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSnapshots();
                }}
                className="h-7 w-7"
                data-testid="button-close-snapshots"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Create new snapshot */}
            <div className="p-4 border-b border-border space-y-3">
              <Input
                value={newSnapshotName}
                onChange={(e) => setNewSnapshotName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateSnapshot()}
                placeholder="Snapshot name..."
                className="h-9 text-sm"
                data-testid="input-snapshot-name"
              />
              <Button
                onClick={handleCreateSnapshot}
                className="w-full gap-2"
                size="sm"
                data-testid="button-save-snapshot"
              >
                <Save className="w-4 h-4" />
                Save Current State
              </Button>
            </div>

            {/* Snapshot list */}
            <div className="flex-1 overflow-auto p-2 space-y-1">
              {snapshots.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <p>No snapshots yet</p>
                  <p className="text-xs mt-1 opacity-70">
                    Save your board state to restore later
                  </p>
                </div>
              ) : (
                snapshots
                  .slice()
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((snapshot) => (
                    <motion.div
                      key={snapshot.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "group p-3 rounded-lg hover-elevate",
                        "border border-transparent hover:border-border",
                        "transition-colors duration-150"
                      )}
                      data-testid={`snapshot-${snapshot.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {editingId === snapshot.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                                className="h-6 text-sm px-1"
                                autoFocus
                                data-testid={`input-edit-snapshot-${snapshot.id}`}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleSaveEdit}
                                className="h-6 w-6"
                                data-testid={`button-save-edit-${snapshot.id}`}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-medium truncate">
                                {snapshot.name}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleStartEdit(snapshot.id, snapshot.name)}
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                data-testid={`button-edit-snapshot-${snapshot.id}`}
                              >
                                <Edit2 className="w-2.5 h-2.5" />
                              </Button>
                            </div>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatDate(snapshot.timestamp)} • {snapshot.state.pins.length} pins
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => restoreSnapshot(snapshot.id)}
                            className="h-7 w-7 hover:text-primary"
                            data-testid={`button-restore-snapshot-${snapshot.id}`}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteSnapshot(snapshot.id)}
                            className="h-7 w-7 hover:text-destructive"
                            data-testid={`button-delete-snapshot-${snapshot.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))
              )}
            </div>

            {/* Footer hint */}
            <div className="p-3 border-t border-border">
              <p className="text-[10px] text-muted-foreground text-center">
                Snapshots persist across browser sessions
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
