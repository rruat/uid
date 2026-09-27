import { createElementFromPreset, ELEMENT_PRESETS } from "../model/elementPresets";
import {
  duplicateElement,
  findElement,
  insertChild,
  moveElement,
  removeElement,
  updateElement,
} from "../model/document";
import { createId } from "../model/id";
import type { CSSProperties, UixDocument, UixSettings } from "../model/types";

/** Backfills an id for documents saved before the .uix schema added one. */
function ensureDocumentId(doc: UixDocument): UixDocument {
  return doc.id ? doc : { ...doc, id: createId("proj") };
}

export type Mode = "visual" | "code" | "preview";

export interface ProjectState {
  past: UixDocument[];
  present: UixDocument;
  future: UixDocument[];
  selectedId: string | null;
  mode: Mode;
}

export type ProjectAction =
  | { type: "LOAD_DOCUMENT"; document: UixDocument }
  | { type: "ADD_ELEMENT"; parentId: string; presetKey: string; index?: number }
  | { type: "REMOVE_ELEMENT"; id: string }
  | { type: "DUPLICATE_ELEMENT"; id: string }
  | { type: "MOVE_ELEMENT"; id: string; newParentId: string; index?: number }
  | { type: "UPDATE_STYLES"; id: string; styles: CSSProperties }
  | { type: "UPDATE_CONTENT"; id: string; content: string }
  | { type: "UPDATE_NAME"; id: string; name: string }
  | { type: "UPDATE_ATTRIBUTE"; id: string; key: string; value: string }
  | { type: "SET_VIEWPORT"; viewport: UixSettings["viewport"] }
  | { type: "RENAME_PROJECT"; name: string }
  | { type: "SELECT"; id: string | null }
  | { type: "SET_MODE"; mode: Mode }
  | { type: "UNDO" }
  | { type: "REDO" };

const HISTORY_LIMIT = 100;

function touch(doc: UixDocument): UixDocument {
  return { ...doc, updatedAt: new Date().toISOString() };
}

function withHistory(state: ProjectState, nextDocument: UixDocument): ProjectState {
  const past = [...state.past, state.present].slice(-HISTORY_LIMIT);
  return { ...state, past, present: touch(nextDocument), future: [] };
}

export function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case "LOAD_DOCUMENT":
      return {
        past: [],
        present: ensureDocumentId(action.document),
        future: [],
        selectedId: null,
        mode: "visual",
      };

    case "ADD_ELEMENT": {
      const preset = ELEMENT_PRESETS.find((p) => p.key === action.presetKey);
      if (!preset) return state;
      const el = createElementFromPreset(preset);
      const nextDoc = insertChild(state.present.root, action.parentId, el, action.index);
      return {
        ...withHistory(state, { ...state.present, root: nextDoc }),
        selectedId: el.id,
      };
    }

    case "REMOVE_ELEMENT": {
      if (action.id === "root") return state;
      const nextDoc = removeElement(state.present.root, action.id);
      return {
        ...withHistory(state, { ...state.present, root: nextDoc }),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      };
    }

    case "DUPLICATE_ELEMENT": {
      if (action.id === "root") return state;
      const nextDoc = duplicateElement(state.present.root, action.id);
      return withHistory(state, { ...state.present, root: nextDoc });
    }

    case "MOVE_ELEMENT": {
      const nextDoc = moveElement(state.present.root, action.id, action.newParentId, action.index);
      return withHistory(state, { ...state.present, root: nextDoc });
    }

    case "UPDATE_STYLES": {
      const nextRoot = updateElement(state.present.root, action.id, (el) => ({
        ...el,
        styles: { ...el.styles, ...action.styles },
      }));
      return withHistory(state, { ...state.present, root: nextRoot });
    }

    case "UPDATE_CONTENT": {
      const nextRoot = updateElement(state.present.root, action.id, (el) => ({
        ...el,
        content: action.content,
      }));
      return withHistory(state, { ...state.present, root: nextRoot });
    }

    case "UPDATE_NAME": {
      const nextRoot = updateElement(state.present.root, action.id, (el) => ({
        ...el,
        name: action.name,
      }));
      return withHistory(state, { ...state.present, root: nextRoot });
    }

    case "UPDATE_ATTRIBUTE": {
      const nextRoot = updateElement(state.present.root, action.id, (el) => ({
        ...el,
        attributes: { ...el.attributes, [action.key]: action.value },
      }));
      return withHistory(state, { ...state.present, root: nextRoot });
    }

    case "SET_VIEWPORT":
      return {
        ...state,
        present: touch({
          ...state.present,
          settings: { ...state.present.settings, viewport: action.viewport },
        }),
      };

    case "RENAME_PROJECT":
      return { ...state, present: touch({ ...state.present, name: action.name }) };

    case "SELECT":
      if (action.id && !findElement(state.present.root, action.id)) return state;
      return { ...state, selectedId: action.id };

    case "SET_MODE":
      return { ...state, mode: action.mode };

    case "UNDO": {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        ...state,
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
      };
    }

    case "REDO": {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        ...state,
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1),
      };
    }

    default:
      return state;
  }
}
