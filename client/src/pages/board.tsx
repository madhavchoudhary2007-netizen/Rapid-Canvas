import { Canvas } from "@/components/Canvas";
import { Toolbar } from "@/components/Toolbar";
import { SnapshotPanel } from "@/components/SnapshotPanel";
import { StatusBar } from "@/components/StatusBar";

export default function BoardPage() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background" data-testid="board-page">
      <Canvas />
      <Toolbar />
      <SnapshotPanel />
      <StatusBar />
    </div>
  );
}
