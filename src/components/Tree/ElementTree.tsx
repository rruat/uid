import { useState } from "react";
import { findParent } from "../../model/document";
import type { UixElement } from "../../model/types";
import { useProject } from "../../state/ProjectContext";
import { Icon } from "../Icon";
import "./elementTree.css";

export function ElementTree({ onClose }: { onClose: () => void }) {
  const { state } = useProject();
  return (
    <div className="tree-overlay" onClick={onClose}>
      <div className="tree-panel" onClick={(e) => e.stopPropagation()}>
        <div className="tree-panel__header">
          <span className="ui-label">Estrutura</span>
          <button className="ui-btn is-icon" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="tree-panel__body ui-scrollbar-hidden">
          <TreeNode element={state.present.root} depth={0} />
        </div>
      </div>
    </div>
  );
}

function TreeNode({ element, depth }: { element: UixElement; depth: number }) {
  const { state, dispatch } = useProject();
  const [expanded, setExpanded] = useState(true);
  const isSelected = state.selectedId === element.id;
  const isRoot = element.id === "root";

  const move = (dir: -1 | 1) => {
    const parent = findParent(state.present.root, element.id);
    if (!parent) return;
    const index = parent.children.findIndex((c) => c.id === element.id);
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= parent.children.length) return;
    dispatch({ type: "MOVE_ELEMENT", id: element.id, newParentId: parent.id, index: newIndex });
  };

  const outdent = () => {
    const parent = findParent(state.present.root, element.id);
    if (!parent) return;
    const grandparent = findParent(state.present.root, parent.id);
    if (!grandparent) return;
    const parentIndex = grandparent.children.findIndex((c) => c.id === parent.id);
    dispatch({ type: "MOVE_ELEMENT", id: element.id, newParentId: grandparent.id, index: parentIndex + 1 });
  };

  const indent = () => {
    const parent = findParent(state.present.root, element.id);
    if (!parent) return;
    const index = parent.children.findIndex((c) => c.id === element.id);
    const prevSibling = parent.children[index - 1];
    if (!prevSibling) return;
    dispatch({ type: "MOVE_ELEMENT", id: element.id, newParentId: prevSibling.id });
  };

  return (
    <div className="tree-node">
      <div
        className={`tree-node__row ${isSelected ? "is-selected" : ""}`}
        style={{ paddingLeft: 8 + depth * 16 }}
        onClick={() => dispatch({ type: "SELECT", id: element.id })}
      >
        {element.children.length > 0 ? (
          <button
            className="tree-node__caret"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
          >
            <Icon name={expanded ? "chevronDown" : "chevronUp"} size={12} />
          </button>
        ) : (
          <span className="tree-node__caret" />
        )}
        <span className="tag-badge">{element.tag}</span>
        <span className="tree-node__name">{element.name}</span>

        {!isRoot && (
          <div className="tree-node__actions">
            <button className="ui-btn is-icon" onClick={(e) => { e.stopPropagation(); outdent(); }} title="Diminuir nível">
              ←
            </button>
            <button className="ui-btn is-icon" onClick={(e) => { e.stopPropagation(); indent(); }} title="Aumentar nível">
              →
            </button>
            <button className="ui-btn is-icon" onClick={(e) => { e.stopPropagation(); move(-1); }} title="Mover para cima">
              ↑
            </button>
            <button className="ui-btn is-icon" onClick={(e) => { e.stopPropagation(); move(1); }} title="Mover para baixo">
              ↓
            </button>
            <button
              className="ui-btn is-icon"
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: "REMOVE_ELEMENT", id: element.id });
              }}
              title="Excluir"
            >
              <Icon name="trash" size={14} />
            </button>
          </div>
        )}
      </div>

      {expanded && element.children.length > 0 && (
        <div className="tree-node__children">
          {element.children.map((child) => (
            <TreeNode key={child.id} element={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
