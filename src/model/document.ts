import { createId } from "./id";
import type { GuideSet, UixDocument, UixElement } from "./types";

export const DEFAULT_GUIDE_SETS: GuideSet[] = [
  {
    id: "set-layout",
    name: "Layout Geral",
    color: "#6366f1",
    visible: true,
    snapEnabled: true,
    scope: "global",
    grid: {
      enabled: true,
      size: 16,
      orientation: "both",
      color: "rgba(99, 102, 241, 0.18)",
      opacity: 0.18,
      thickness: 1,
      snap: true,
    },
    guides: [
      { id: "g-left-margin", type: "x", pos: 16 },
      { id: "g-right-margin", type: "x", pos: 374 },
    ],
  },
  {
    id: "set-cards",
    name: "Cards & Componentes",
    color: "#ec4899",
    visible: true,
    snapEnabled: true,
    scope: "global",
    grid: {
      enabled: false,
      size: 8,
      orientation: "both",
      color: "rgba(236, 72, 153, 0.18)",
      opacity: 0.18,
      thickness: 1,
      snap: true,
    },
    guides: [],
  },
];

export function createDefaultDocument(name = "Novo Projeto"): UixDocument {
  const now = new Date().toISOString();
  return {
    version: 1,
    id: createId("proj"),
    name,
    createdAt: now,
    updatedAt: now,
    settings: { viewport: "mobile", showRulers: true, smartSnap: true },
    variables: [],
    assets: [],
    guideSets: DEFAULT_GUIDE_SETS,
    root: {
      id: "root",
      tag: "main",
      name: "Body",
      styles: {
        display: "flex",
        "flex-direction": "column",
        "min-height": "100%",
        position: "relative",
        gap: "16px",
        padding: "16px",
      },
      classes: [],
      children: [],
    },
  };
}

export function findElement(root: UixElement, id: string): UixElement | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findElement(child, id);
    if (found) return found;
  }
  return null;
}

export function findParent(root: UixElement, childId: string): UixElement | null {
  for (const child of root.children) {
    if (child.id === childId) return root;
    const found = findParent(child, childId);
    if (found) return found;
  }
  return null;
}

/** Returns a new root with `updater` applied to the element matching `id`. Immutable. */
export function updateElement(
  root: UixElement,
  id: string,
  updater: (el: UixElement) => UixElement
): UixElement {
  if (root.id === id) return updater(root);
  return {
    ...root,
    children: root.children.map((child) => updateElement(child, id, updater)),
  };
}

export function insertChild(
  root: UixElement,
  parentId: string,
  child: UixElement,
  index?: number
): UixElement {
  return updateElement(root, parentId, (el) => {
    const children = [...el.children];
    const at = index === undefined ? children.length : index;
    children.splice(at, 0, child);
    return { ...el, children };
  });
}

export function removeElement(root: UixElement, id: string): UixElement {
  return {
    ...root,
    children: root.children
      .filter((child) => child.id !== id)
      .map((child) => removeElement(child, id)),
  };
}

export function moveElement(
  root: UixElement,
  id: string,
  newParentId: string,
  index?: number
): UixElement {
  const el = findElement(root, id);
  if (!el || id === newParentId) return root;
  const withoutEl = removeElement(root, id);
  return insertChild(withoutEl, newParentId, el, index);
}

function cloneWithNewIds(el: UixElement): UixElement {
  return {
    ...el,
    id: createId(),
    children: el.children.map(cloneWithNewIds),
  };
}

export function duplicateElement(root: UixElement, id: string): UixElement {
  const parent = findParent(root, id);
  const el = findElement(root, id);
  if (!parent || !el) return root;
  const clone = cloneWithNewIds(el);
  clone.name = `${el.name} cópia`;
  const index = parent.children.findIndex((c) => c.id === id);
  return insertChild(root, parent.id, clone, index + 1);
}

export function isDescendant(root: UixElement, ancestorId: string, targetId: string): boolean {
  const ancestor = findElement(root, ancestorId);
  if (!ancestor) return false;
  if (ancestor.id === targetId) return true;
  return ancestor.children.some((c) => isDescendant(root, c.id, targetId));
}
