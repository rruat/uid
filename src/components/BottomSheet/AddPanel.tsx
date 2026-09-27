import { ELEMENT_PRESETS } from "../../model/elementPresets";
import { findElement, findParent } from "../../model/document";
import { Icon } from "../Icon";
import { useProject } from "../../state/ProjectContext";

const LEAF_TAGS = new Set(["img", "input"]);

export function AddPanel() {
  const { state, dispatch } = useProject();

  const handleAdd = (presetKey: string) => {
    const selected = state.selectedId ? findElement(state.present.root, state.selectedId) : null;

    if (selected && LEAF_TAGS.has(selected.tag)) {
      // selected element can't contain children: insert as sibling right after it
      const parent = findParent(state.present.root, selected.id);
      const parentId = parent ? parent.id : "root";
      const index = parent ? parent.children.findIndex((c) => c.id === selected.id) + 1 : undefined;
      dispatch({ type: "ADD_ELEMENT", parentId, presetKey, index });
      return;
    }

    const parentId = selected ? selected.id : "root";
    dispatch({ type: "ADD_ELEMENT", parentId, presetKey });
  };

  return (
    <div className="add-panel">
      <span className="ui-label">Adicionar elemento</span>
      <div className="add-panel__grid">
        {ELEMENT_PRESETS.map((preset) => (
          <button key={preset.key} className="add-panel__item" onClick={() => handleAdd(preset.key)}>
            <Icon name={preset.icon as any} size={20} />
            <span>{preset.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
