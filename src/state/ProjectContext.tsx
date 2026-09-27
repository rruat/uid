import { createContext, useContext, useEffect, useReducer, useRef } from "react";
import type { ReactNode } from "react";
import { createDefaultDocument } from "../model/document";
import { loadAutosave, saveAutosave } from "../model/storage";
import { projectReducer } from "./projectReducer";
import type { ProjectAction, ProjectState } from "./projectReducer";

interface ProjectContextValue {
  state: ProjectState;
  dispatch: React.Dispatch<ProjectAction>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

function initState(): ProjectState {
  return {
    past: [],
    present: createDefaultDocument(),
    future: [],
    selectedId: null,
    mode: "visual",
  };
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(projectReducer, undefined, initState);
  const loadedAutosave = useRef(false);

  useEffect(() => {
    if (loadedAutosave.current) return;
    loadedAutosave.current = true;
    loadAutosave().then((doc) => {
      if (doc) dispatch({ type: "LOAD_DOCUMENT", document: doc });
    });
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      saveAutosave(state.present).catch(() => void 0);
    }, 400);
    return () => clearTimeout(handle);
  }, [state.present]);

  return (
    <ProjectContext.Provider value={{ state, dispatch }}>{children}</ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}
