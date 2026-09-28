import { ELEMENT_PRESETS } from "../../model/elementPresets";
import { findElement, findParent } from "../../model/document";
import { Icon } from "../Icon";
import { useProject } from "../../state/ProjectContext";

const LEAF_TAGS = new Set(["img", "input"]);

export function AddPanel({ onElementAdded }: { onElementAdded?: () => void }) {
  const { state, dispatch } = useProject();

  const handleAdd = (presetKey: string) => {
    const selected = state.selectedId ? findElement(state.present.root, state.selectedId) : null;

    if (selected && LEAF_TAGS.has(selected.tag)) {
      // selected element can't contain children: insert as sibling right after it
      const parent = findParent(state.present.root, selected.id);
      const parentId = parent ? parent.id : "root";
      const index = parent ? parent.children.findIndex((c) => c.id === selected.id) + 1 : undefined;
      dispatch({ type: "ADD_ELEMENT", parentId, presetKey, index });
      onElementAdded?.();
      return;
    }

    const parentId = selected ? selected.id : "root";
    dispatch({ type: "ADD_ELEMENT", parentId, presetKey });
    onElementAdded?.();
  };

  const handleDragStart = (e: React.DragEvent, presetKey: string) => {
    e.dataTransfer.setData("text/uix-preset", presetKey);
    e.dataTransfer.setData("text/plain", presetKey);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="add-panel">
      <div className="add-panel__header">
        <span className="ui-label">Elementos</span>
        <span className="add-panel__hint">Clique para inserir ou arraste para o canvas</span>
      </div>
      <div className="add-panel__grid">
        {ELEMENT_PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            className="add-panel__item"
            draggable
            onDragStart={(e) => handleDragStart(e, preset.key)}
            onClick={() => handleAdd(preset.key)}
            title={`Clique ou arraste ${preset.label}`}
          >
            <Icon name={preset.icon as any} size={22} />
            <span className="add-panel__item-label">{preset.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
