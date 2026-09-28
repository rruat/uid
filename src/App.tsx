import { useState } from "react";
import { Header } from "./components/Header/Header";
import { SmartToolbar } from "./components/SmartToolbar/SmartToolbar";
import { LeftSidebar, type SidebarTab } from "./components/Sidebar/LeftSidebar";
import { Canvas } from "./components/Canvas/Canvas";
import { CodeView } from "./components/CodeView/CodeView";
import { PreviewFrame } from "./components/Preview/PreviewFrame";
import { useProject } from "./state/ProjectContext";

export default function App() {
  const { state } = useProject();
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>(null);

  return (
    <div className="uid-app">
      <Header onToggleTree={() => setActiveSidebarTab((prev) => (prev === "layers" ? null : "layers"))} />

      {state.mode === "visual" && (
        <SmartToolbar
          onOpenAdd={() => setActiveSidebarTab("elements")}
          onOpenTree={() => setActiveSidebarTab("layers")}
          onOpenGuides={() => setActiveSidebarTab("guides")}
          onOpenProject={() => setActiveSidebarTab("project")}
        />
      )}

      <main className="uid-main">
        {state.mode === "visual" && (
          <div className="uid-workspace">
            <LeftSidebar activeTab={activeSidebarTab} setActiveTab={setActiveSidebarTab} />
            <Canvas onOpenGuidesPanel={() => setActiveSidebarTab("guides")} />
          </div>
        )}
        {state.mode === "code" && <CodeView />}
        {state.mode === "preview" && <PreviewFrame />}
      </main>
    </div>
  );
}
