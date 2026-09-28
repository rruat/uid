import { createElementFromPreset, ELEMENT_PRESETS } from "../model/elementPresets";
import {
  DEFAULT_GUIDE_SETS,
  duplicateElement,
  findElement,
  findParent,
  insertChild,
  moveElement,
  removeElement,
  updateElement,
} from "../model/document";
import { createId } from "../model/id";
import { nextAutoAreaName } from "../model/gridUtils";
import type { CSSProperties, CustomGuide, GuideSet, UixDocument, UixSettings } from "../model/types";

/** Backfills an id and guide sets for documents saved before the schema added them. */
function ensureDocumentId(doc: UixDocument): UixDocument {
  const withId = doc.id ? doc : { ...doc, id: createId("proj") };
  if (!withId.guideSets) {
    withId.guideSets = DEFAULT_GUIDE_SETS;
  }
  if (withId.settings.showRulers === undefined) {
    withId.settings.showRulers = true;
  }
  if (withId.settings.smartSnap === undefined) {
    withId.settings.smartSnap = true;
  }
  return withId;
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
  | { type: "SET_SHOW_RULERS"; show: boolean }
  | { type: "SET_SMART_SNAP"; snap: boolean }
  | { type: "ADD_GUIDE_SET"; guideSet: GuideSet }
  | { type: "UPDATE_GUIDE_SET"; id: string; patch: Partial<GuideSet> }
  | { type: "REMOVE_GUIDE_SET"; id: string }
  | { type: "ADD_CUSTOM_GUIDE"; guideSetId: string; guide: CustomGuide }
  | { type: "REMOVE_CUSTOM_GUIDE"; guideSetId: string; guideId: string }
  | { type: "UPDATE_CUSTOM_GUIDE"; guideSetId: string; guideId: string; pos: number }
  | { type: "SET_POSITION_MODE"; id: string; positionMode: "relative" | "absolute"; left?: string; top?: string }
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

      // A child dropped straight into a CSS Grid container is invisible
      // until it's placed, so give it an automatic, unique area name right
      // away — it can be reassigned by typing the same name into the
      // parent's grid-area editor, or from the child's own Layout tab.
      const parent = findElement(state.present.root, action.parentId);
      if (parent?.styles.display === "grid") {
        const siblingNames = parent.children
          .map((c) => c.styles["grid-area"])
          .filter((v): v is string => Boolean(v));
        el.styles["grid-area"] = nextAutoAreaName(siblingNames);
      }

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
      const nextRoot = updateElement(state.present.root, action.id, (el) => {
        const nextStyles = { ...el.styles, ...action.styles };
        for (const k of Object.keys(nextStyles)) {
          if (nextStyles[k] === "" || nextStyles[k] === undefined) {
            delete nextStyles[k];
          }
        }
        return { ...el, styles: nextStyles };
      });
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

    case "SET_SHOW_RULERS":
      return {
        ...state,
        present: touch({
          ...state.present,
          settings: { ...state.present.settings, showRulers: action.show },
        }),
      };

    case "SET_SMART_SNAP":
      return {
        ...state,
        present: touch({
          ...state.present,
          settings: { ...state.present.settings, smartSnap: action.snap },
        }),
      };

    case "ADD_GUIDE_SET": {
      const current = state.present.guideSets || [];
      return withHistory(state, {
        ...state.present,
        guideSets: [...current, action.guideSet],
      });
    }

    case "UPDATE_GUIDE_SET": {
      const current = state.present.guideSets || [];
      return withHistory(state, {
        ...state.present,
        guideSets: current.map((s) => (s.id === action.id ? { ...s, ...action.patch } : s)),
      });
    }

    case "REMOVE_GUIDE_SET": {
      const current = state.present.guideSets || [];
      return withHistory(state, {
        ...state.present,
        guideSets: current.filter((s) => s.id !== action.id),
      });
    }

    case "ADD_CUSTOM_GUIDE": {
      const current = state.present.guideSets || [];
      return withHistory(state, {
        ...state.present,
        guideSets: current.map((s) =>
          s.id === action.guideSetId ? { ...s, guides: [...s.guides, action.guide] } : s
        ),
      });
    }

    case "REMOVE_CUSTOM_GUIDE": {
      const current = state.present.guideSets || [];
      return withHistory(state, {
        ...state.present,
        guideSets: current.map((s) =>
          s.id === action.guideSetId
            ? { ...s, guides: s.guides.filter((g) => g.id !== action.guideId) }
            : s
        ),
      });
    }

    case "UPDATE_CUSTOM_GUIDE": {
      const current = state.present.guideSets || [];
      return withHistory(state, {
        ...state.present,
        guideSets: current.map((s) =>
          s.id === action.guideSetId
            ? {
                ...s,
                guides: s.guides.map((g) => (g.id === action.guideId ? { ...g, pos: action.pos } : g)),
              }
            : s
        ),
      });
    }

    case "SET_POSITION_MODE": {
      const el = findElement(state.present.root, action.id);
      if (!el) return state;

      let nextRoot = state.present.root;

      if (action.positionMode === "absolute") {
        const parent = findParent(state.present.root, action.id);
        if (
          parent &&
          parent.id !== "root" &&
          parent.styles.position !== "relative" &&
          parent.styles.position !== "absolute"
        ) {
          nextRoot = updateElement(nextRoot, parent.id, (p) => ({
            ...p,
            styles: { ...p.styles, position: "relative" },
          }));
        }

        nextRoot = updateElement(nextRoot, action.id, (target) => ({
          ...target,
          styles: {
            ...target.styles,
            position: "absolute",
            left: action.left || target.styles.left || "16px",
            top: action.top || target.styles.top || "16px",
          },
        }));
      } else {
        nextRoot = updateElement(nextRoot, action.id, (target) => {
          const nextStyles = { ...target.styles };
          nextStyles.position = "relative";
          delete nextStyles.left;
          delete nextStyles.top;
          delete nextStyles.right;
          delete nextStyles.bottom;
          return { ...target, styles: nextStyles };
        });
      }

      return withHistory(state, { ...state.present, root: nextRoot });
    }

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
