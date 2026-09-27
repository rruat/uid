import { useState } from "react";
import { Header } from "./components/Header/Header";
import { Canvas } from "./components/Canvas/Canvas";
import { BottomSheet } from "./components/BottomSheet/BottomSheet";
import { ElementTree } from "./components/Tree/ElementTree";
import { CodeView } from "./components/CodeView/CodeView";
import { PreviewFrame } from "./components/Preview/PreviewFrame";
import { useProject } from "./state/ProjectContext";

export default function App() {
  const { state } = useProject();
  const [treeOpen, setTreeOpen] = useState(false);

  return (
    <div className="uid-app">
      <Header onToggleTree={() => setTreeOpen((v) => !v)} />
      <main className="uid-main">
        {state.mode === "visual" && (
          <>
            <Canvas />
            <BottomSheet />
          </>
        )}
        {state.mode === "code" && <CodeView />}
        {state.mode === "preview" && <PreviewFrame />}

        {treeOpen && <ElementTree onClose={() => setTreeOpen(false)} />}
      </main>
    </div>
  );
}
