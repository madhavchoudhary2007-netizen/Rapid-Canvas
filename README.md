# Canvas Board

A free-form digital workspace where you can create, organize, and manage pins on an infinite canvas. Built with React, TypeScript, and modern web technologies for a smooth, performant experience.

**Tech Stack:** `React 18` | `TypeScript 5` | `Zustand 4` | `Tailwind CSS 3` | `Framer Motion` | `Vite`

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [User Guide](#user-guide)
- [Design Decisions & Approach](#design-decisions--approach)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Technical Specifications](#technical-specifications)
- [License](#license)

---

## Features

### Core Functionality

| Feature | Description |
|---------|-------------|
| **Infinite Canvas** | Pan and zoom freely across an unlimited workspace |
| **Multiple Pin Types** | Create text notes, image pins, and interactive checklists |
| **Drag & Drop** | Position pins anywhere with smooth, responsive dragging |
| **Resize Pins** | Adjust pin dimensions with corner handles |

### Data Persistence

| Feature | Description |
|---------|-------------|
| **Auto-Save** | All changes automatically persist to localStorage |
| **Session Recovery** | Board state, viewport position, and zoom level restore on reload |
| **Cross-Session Continuity** | Your work is always where you left it |

### History & Versioning

| Feature | Description |
|---------|-------------|
| **Undo/Redo** | Full action history with keyboard shortcuts (Ctrl+Z / Ctrl+Y) |
| **Named Snapshots** | Save board states with custom names |
| **Snapshot Restore** | Jump back to any saved snapshot instantly |

### Organization & UX

| Feature | Description |
|---------|-------------|
| **Color Tags** | Categorize pins with 8 color options via right-click menu |
| **Z-Index Management** | Bring pins to front with context menu |
| **Pin Duplication** | Quickly clone pins with offset positioning |
| **Dark Mode** | Toggle between light and dark themes |
| **Grid Overlay** | Optional alignment grid for precise positioning |
| **Smooth Animations** | Subtle micro-interactions powered by Framer Motion |

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/madhavchoudhary2007-netizen/Rapid-Canvas.git
cd Rapid-Canvas

# Install dependencies
npm install

# Start development server
npm run dev
```

**[Try it live ](https://rapid-canvas.onrender.com)**

### Production Build

```bash
npm run build
npm start
```

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| **Undo** | `Ctrl + Z` |
| **Redo** | `Ctrl + Y` or `Ctrl + Shift + Z` |
| **Delete Selected Pin** | `Delete` or `Backspace` |
| **Reset Zoom** | `Ctrl + 0` |
| **Zoom In** | `Ctrl + +` |
| **Zoom Out** | `Ctrl + -` |
| **Pan Canvas** | `Space + Drag` or `Scroll` |
| **Zoom (Scroll)** | `Ctrl + Scroll` |
| **Deselect** | `Escape` |

---

## User Guide

### Creating Pins

- **Double-click** anywhere on the canvas to create a new text pin
- Use the **toolbar buttons** to create specific pin types (text, image, list)
- **Drag and drop** image files directly onto the canvas to create image pins

### Editing Pins

- Click a pin to **select** it
- Click inside text areas to **edit content** inline
- **Drag the header** to move pins anywhere
- **Drag the corner handle** to resize pins

### Context Menu (Right-Click)

- **Duplicate** - Create a copy of the pin
- **Bring to Front** - Move pin above others
- **Color** - Choose from 8 color tag options
- **Delete** - Remove the pin

### Snapshots

1. Click the **Snapshots** button in the toolbar
2. Enter a name and click **Save Current State**
3. Restore any snapshot by clicking the restore icon
4. Snapshots persist across browser sessions

---

## Design Decisions & Approach

### Why Zustand for State Management?

After reseaching and learning a bit about Redux, Context API, and Zustand, I chose **Zustand** for several reasons:

1. **Minimal Boilerplate**
   - No action creators, reducers, or providers
   - Clean, readable store definitions
   

2. **Built-in Persistence Middleware**
   - Has localStorage integration with one line of configuration
   - Automatic serialization/deserialization
   - Configurable storage key and partitioning

3. **Selective Re-renders**
   - Components subscribe to specific state slices
   - No unnecessary re-renders when unrelated state changes
   - Important for canvas performance with many pins

4. **Bundle Size**
   - No additional dependencies required

```typescript
// Example: Clean store definition
export const useBoardStore = create<BoardStore>()(
  persist(
    (set, get) => ({
      pins: [],
      createPin: (pinData) => {
        get().pushToUndoStack();
        set({ pins: [...get().pins, newPin] });
      },
    }),
    { name: "canvas-board-state" }
  )
);
```

### Canvas Rendering: CSS Transforms for 60fps

All canvas operations use **CSS transforms** instead of absolute positioning recalculations:

```typescript
// GPU-accelerated canvas transformation
style={{
  transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
}}
```

**Why this approach?**

- **GPU Compositing**: Transforms are handled by the GPU compositor thread, not the main thread
- **No Layout Thrashing**: Moving/zooming doesn't trigger expensive layout recalculations
- **Consistent Performance**: Maintains 60fps even with 100+ pins on screen
- **Smooth Animations**: Transform-based animations benefit from hardware acceleration

### Undo/Redo: Dual Stack Architecture

I implemented a **separate undo/redo stack** approach rather than a single history array with index:

```typescript
interface HistoryState {
  pins: Pin[];
  nextZIndex: number;
}

// State structure
undoStack: HistoryState[];
redoStack: HistoryState[];
```

**Key Design Decisions:**

| Decision | Rationale |
|----------|-----------|
| **Save Before Mutation** | Capture state before changes ensures perfect restoration |
| **Deep Cloning** | `JSON.parse(JSON.stringify())` creates true immutable snapshots |
| **Silent Updates** | `updatePinSilent()` prevents flooding history during drag/resize |
| **Clear Redo on New Action** | Standard UX pattern users expect |
| **History Limit (50)** | Prevents unbounded memory growth |

**Handling Continuous Operations:**

For drag and resize operations, the program saves to the undo stack once at the **start** of the operation, then use silent updates during the motion:

```typescript
// On drag start
pushToUndoStack(); // Save current state

// During drag (called many times)
updatePinSilent(id, { position: newPosition }); // No history pollution
```

This ensures each drag operation creates exactly **one** undo entry, not hundreds.

### Animation Philosophy: Purposeful Motion

Animations are used to **enhance comprehension**, not for decoration:

| Animation | Purpose |
|-----------|---------|
| Pin creation (scale 0.9 → 1.0) | Draws attention to new element |
| Drag elevation (shadow increase) | Indicates "lifted" state |
| Panel slide-in (spring physics) | Smooth, natural panel reveal |
| Selection ring | Clear visual feedback |

All animations complete in about **<200ms** to maintain perceived responsiveness.

### Pin Architecture: Unified Component

Rather than separate components for each pin type, I used a **unified wrapper** with type-specific content renderers:

```
PinCard (shared wrapper)
├── Header (drag handle, close button)
├── Content area
│   ├── TextPinContent
│   ├── ImagePinContent
│   └── ListPinContent
└── Resize handle
```

**Benefits:**

- Consistent drag/resize/selection behavior across all types
- Single source of truth for pin interactions
- Easy to add new pin types (just add a content renderer)
- Reduced code duplication

---

## Architecture

### Data Flow

```
User Interaction
       ↓
   Component Event Handler
       ↓
   Zustand Store Action
       ↓
   State Update (with optional history push)
       ↓
   Subscribed Components Re-render
       ↓
   localStorage Persistence (automatic)
```

### State Shape

```typescript
interface BoardStore {
  // Core state
  pins: Pin[];
  viewport: { x: number; y: number; zoom: number };
  selectedPinId: string | null;
  
  // History
  undoStack: HistoryState[];
  redoStack: HistoryState[];
  
  // Snapshots
  snapshots: Snapshot[];
  
  // UI state
  showGrid: boolean;
  showSnapshots: boolean;
  tool: "select" | "pan";
}
```

### Pin Schema

```typescript
interface Pin {
  id: string;
  type: "text" | "image" | "list";
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  color: PinColor;
  
  // Type-specific fields
  title?: string;
  content?: string;
  imageUrl?: string;
  listItems?: ListItem[];
}
```

---

## Project Structure

```
canvas-board/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Canvas.tsx          # Infinite canvas with pan/zoom
│   │   │   ├── PinCard.tsx         # Unified pin component
│   │   │   ├── PinContextMenu.tsx  # Right-click context menu
│   │   │   ├── Toolbar.tsx         # Floating toolbar controls
│   │   │   ├── SnapshotPanel.tsx   # Snapshot management sidebar
│   │   │   ├── StatusBar.tsx       # Bottom status bar
│   │   │   ├── ThemeToggle.tsx     # Dark/light mode switch
│   │   │   └── EmptyState.tsx      # Empty board instructions
│   │   ├── lib/
│   │   │   ├── boardStore.ts       # Zustand store with persistence
│   │   │   ├── queryClient.ts      # React Query configuration
│   │   │   └── utils.ts            # Utility functions
│   │   ├── pages/
│   │   │   └── board.tsx           # Main board page
│   │   ├── App.tsx                 # Root component with routing
│   │   └── index.css               # Global styles and design tokens
│   └── index.html
├── server/
│   ├── index.ts                    # Express server entry
│   ├── routes.ts                   # API routes (minimal)
│   └── vite.ts                     # Vite dev server integration
├── shared/
│   └── schema.ts                   # TypeScript types and Zod schemas
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
└── README.md
```

---

## Technical Specifications

### Performance Optimizations

| Optimization | Implementation |
|--------------|----------------|
| GPU Acceleration | CSS transforms for all canvas operations |
| Selective Re-renders | Zustand's granular state subscriptions |
| Debounced Persistence | localStorage writes batched by Zustand middleware |
| Event Delegation | Mouse events handled at canvas level |
| Immutable Updates | Spread operators ensure React change detection |
| Silent Updates | Drag/resize operations bypass history |



### Data Storage

All data is stored in browser localStorage under the key `canvas-board-state`:

```json
{
  "state": {
    "pins": [...],
    "viewport": { "x": 0, "y": 0, "zoom": 1 },
    "nextZIndex": 1,
    "snapshots": [...]
  },
  "version": 0
}
```

### Dependencies

| Category | Packages |
|----------|----------|
| **Framework** | React 18, TypeScript 5 |
| **State** | Zustand 4 |
| **Animation** | Framer Motion |
| **Styling** | Tailwind CSS 3, shadcn/ui |
| **Icons** | Lucide React |
| **Build** | Vite |

---

## Future Enhancements

Potential improvements for future iterations:

- [ ] Collaborative editing with WebSocket synchronization
- [ ] Export/import board as JSON
- [ ] Pin linking and visual connections
- [ ] Search and filter pins
- [ ] Pin templates and presets
- [ ] Touch gesture support for mobile/tablet
- [ ] Markdown support in text pins
- [ ] Pin grouping and layers

---

## License

MIT License - feel free to use this project for personal or commercial purposes.

---

## Acknowledgments

Built with these excellent open-source projects:

- [React](https://react.dev/) - UI framework
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first styling
- [shadcn/ui](https://ui.shadcn.com/) - Component primitives
- [Lucide](https://lucide.dev/) - Icon library
- [Vite](https://vitejs.dev/) - Build tooling
