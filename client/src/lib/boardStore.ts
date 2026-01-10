import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Pin, Snapshot, Viewport, InsertPin } from "@shared/schema";

const STORAGE_KEY = "canvas-board-state";
const MAX_HISTORY = 50;

interface HistoryState {
  pins: Pin[];
  nextZIndex: number;
}

interface BoardStore {
  // Board state
  pins: Pin[];
  viewport: Viewport;
  nextZIndex: number;
  selectedPinId: string | null;
  
  // History for undo/redo
  undoStack: HistoryState[];
  redoStack: HistoryState[];
  
  // Snapshots
  snapshots: Snapshot[];
  
  // UI state
  isPanning: boolean;
  isDragging: boolean;
  isResizing: boolean;
  tool: "select" | "pan";
  showGrid: boolean;
  showSnapshots: boolean;
  
  // Actions
  createPin: (pin: InsertPin) => string;
  updatePin: (id: string, updates: Partial<Pin>) => void;
  updatePinSilent: (id: string, updates: Partial<Pin>) => void; // No undo history
  deletePin: (id: string) => void;
  duplicatePin: (id: string) => void;
  selectPin: (id: string | null) => void;
  bringToFront: (id: string) => void;
  
  // Viewport
  setViewport: (viewport: Partial<Viewport>) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToContent: () => void;
  
  // History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushToUndoStack: () => void;
  
  // Snapshots
  createSnapshot: (name: string) => void;
  restoreSnapshot: (id: string) => void;
  deleteSnapshot: (id: string) => void;
  renameSnapshot: (id: string, name: string) => void;
  
  // UI
  setTool: (tool: "select" | "pan") => void;
  setIsPanning: (isPanning: boolean) => void;
  setIsDragging: (isDragging: boolean) => void;
  setIsResizing: (isResizing: boolean) => void;
  toggleGrid: () => void;
  toggleSnapshots: () => void;
  
  // Persistence
  clearBoard: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const getDefaultState = (): Pick<BoardStore, "pins" | "viewport" | "nextZIndex" | "snapshots" | "undoStack" | "redoStack"> => ({
  pins: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  nextZIndex: 1,
  snapshots: [],
  undoStack: [],
  redoStack: [],
});

export const useBoardStore = create<BoardStore>()(
  persist(
    (set, get) => ({
      ...getDefaultState(),
      selectedPinId: null,
      isPanning: false,
      isDragging: false,
      isResizing: false,
      tool: "select",
      showGrid: false,
      showSnapshots: false,

      pushToUndoStack: () => {
        const { pins, nextZIndex, undoStack } = get();
        const currentState: HistoryState = { 
          pins: JSON.parse(JSON.stringify(pins)), 
          nextZIndex 
        };
        
        const newStack = [...undoStack, currentState];
        if (newStack.length > MAX_HISTORY) {
          newStack.shift();
        }
        
        set({ 
          undoStack: newStack,
          redoStack: []
        });
      },

      createPin: (pinData) => {
        const id = generateId();
        const { nextZIndex, pins } = get();
        
        get().pushToUndoStack();
        
        const pin: Pin = {
          ...pinData,
          id,
          zIndex: nextZIndex,
          color: pinData.color || "default",
          tags: pinData.tags || [],
        };
        
        set({
          pins: [...pins, pin],
          nextZIndex: nextZIndex + 1,
          selectedPinId: id,
        });
        
        return id;
      },

      updatePin: (id, updates) => {
        const { pins } = get();
        const pinIndex = pins.findIndex((p) => p.id === id);
        if (pinIndex === -1) return;
        
        get().pushToUndoStack();
        
        const updatedPins = [...pins];
        updatedPins[pinIndex] = { ...updatedPins[pinIndex], ...updates };
        
        set({ pins: updatedPins });
      },

      // Update pin without adding to undo history (for drag/resize during move)
      updatePinSilent: (id, updates) => {
        const { pins } = get();
        const pinIndex = pins.findIndex((p) => p.id === id);
        if (pinIndex === -1) return;
        
        const updatedPins = [...pins];
        updatedPins[pinIndex] = { ...updatedPins[pinIndex], ...updates };
        
        set({ pins: updatedPins });
      },

      deletePin: (id) => {
        const { pins, selectedPinId } = get();
        
        get().pushToUndoStack();
        
        set({
          pins: pins.filter((p) => p.id !== id),
          selectedPinId: selectedPinId === id ? null : selectedPinId,
        });
      },

      duplicatePin: (id) => {
        const { pins, nextZIndex } = get();
        const pin = pins.find((p) => p.id === id);
        if (!pin) return;
        
        get().pushToUndoStack();
        
        const newId = generateId();
        const newPin: Pin = {
          ...pin,
          id: newId,
          position: { x: pin.position.x + 20, y: pin.position.y + 20 },
          zIndex: nextZIndex,
        };
        
        set({
          pins: [...pins, newPin],
          nextZIndex: nextZIndex + 1,
          selectedPinId: newId,
        });
      },

      selectPin: (id) => set({ selectedPinId: id }),

      bringToFront: (id) => {
        const { pins, nextZIndex } = get();
        const pinIndex = pins.findIndex((p) => p.id === id);
        if (pinIndex === -1) return;
        
        const updatedPins = [...pins];
        updatedPins[pinIndex] = { ...updatedPins[pinIndex], zIndex: nextZIndex };
        
        set({ pins: updatedPins, nextZIndex: nextZIndex + 1 });
      },

      setViewport: (viewport) => {
        set((state) => ({
          viewport: { ...state.viewport, ...viewport },
        }));
      },

      zoomIn: () => {
        const { viewport } = get();
        const newZoom = Math.min(viewport.zoom * 1.2, 4);
        set({ viewport: { ...viewport, zoom: newZoom } });
      },

      zoomOut: () => {
        const { viewport } = get();
        const newZoom = Math.max(viewport.zoom / 1.2, 0.1);
        set({ viewport: { ...viewport, zoom: newZoom } });
      },

      resetZoom: () => {
        const { viewport } = get();
        set({ viewport: { ...viewport, zoom: 1 } });
      },

      fitToContent: () => {
        const { pins, viewport } = get();
        if (pins.length === 0) {
          set({ viewport: { x: 0, y: 0, zoom: 1 } });
          return;
        }
        
        const minX = Math.min(...pins.map((p) => p.position.x));
        const maxX = Math.max(...pins.map((p) => p.position.x + p.size.width));
        const minY = Math.min(...pins.map((p) => p.position.y));
        const maxY = Math.max(...pins.map((p) => p.position.y + p.size.height));
        
        const contentWidth = maxX - minX + 100;
        const contentHeight = maxY - minY + 100;
        
        const zoom = Math.min(
          (window.innerWidth - 100) / contentWidth,
          (window.innerHeight - 100) / contentHeight,
          1
        );
        
        set({
          viewport: {
            x: -(minX - 50) * zoom + (window.innerWidth - contentWidth * zoom) / 2,
            y: -(minY - 50) * zoom + (window.innerHeight - contentHeight * zoom) / 2,
            zoom,
          },
        });
      },

      undo: () => {
        const { undoStack, pins, nextZIndex, redoStack } = get();
        if (undoStack.length === 0) return;
        
        const currentState: HistoryState = { 
          pins: JSON.parse(JSON.stringify(pins)), 
          nextZIndex 
        };
        
        const newUndoStack = [...undoStack];
        const previousState = newUndoStack.pop()!;
        
        set({
          pins: previousState.pins,
          nextZIndex: previousState.nextZIndex,
          undoStack: newUndoStack,
          redoStack: [...redoStack, currentState],
          selectedPinId: null,
        });
      },

      redo: () => {
        const { redoStack, pins, nextZIndex, undoStack } = get();
        if (redoStack.length === 0) return;
        
        const currentState: HistoryState = { 
          pins: JSON.parse(JSON.stringify(pins)), 
          nextZIndex 
        };
        
        const newRedoStack = [...redoStack];
        const nextState = newRedoStack.pop()!;
        
        set({
          pins: nextState.pins,
          nextZIndex: nextState.nextZIndex,
          undoStack: [...undoStack, currentState],
          redoStack: newRedoStack,
          selectedPinId: null,
        });
      },

      canUndo: () => get().undoStack.length > 0,
      canRedo: () => get().redoStack.length > 0,

      createSnapshot: (name) => {
        const { pins, viewport, nextZIndex, snapshots } = get();
        
        const snapshot: Snapshot = {
          id: generateId(),
          name,
          timestamp: Date.now(),
          state: { pins: JSON.parse(JSON.stringify(pins)), viewport, nextZIndex },
        };
        
        set({ snapshots: [...snapshots, snapshot] });
      },

      restoreSnapshot: (id) => {
        const { snapshots } = get();
        const snapshot = snapshots.find((s) => s.id === id);
        if (!snapshot) return;
        
        get().pushToUndoStack();
        
        set({
          pins: JSON.parse(JSON.stringify(snapshot.state.pins)),
          viewport: snapshot.state.viewport,
          nextZIndex: snapshot.state.nextZIndex,
          selectedPinId: null,
        });
      },

      deleteSnapshot: (id) => {
        const { snapshots } = get();
        set({ snapshots: snapshots.filter((s) => s.id !== id) });
      },

      renameSnapshot: (id, name) => {
        const { snapshots } = get();
        set({
          snapshots: snapshots.map((s) =>
            s.id === id ? { ...s, name } : s
          ),
        });
      },

      setTool: (tool) => set({ tool }),
      setIsPanning: (isPanning) => set({ isPanning }),
      setIsDragging: (isDragging) => set({ isDragging }),
      setIsResizing: (isResizing) => set({ isResizing }),
      toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
      toggleSnapshots: () => set((state) => ({ showSnapshots: !state.showSnapshots })),

      clearBoard: () => {
        get().pushToUndoStack();
        set({ pins: [], selectedPinId: null });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        pins: state.pins,
        viewport: state.viewport,
        nextZIndex: state.nextZIndex,
        snapshots: state.snapshots,
      }),
    }
  )
);
