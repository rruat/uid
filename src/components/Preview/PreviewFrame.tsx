import { useMemo } from "react";
import { generatePreviewDocument } from "../../model/exportProject";
import { DEFAULT_VIEWPORT_WIDTHS } from "../../model/types";
import { useProject } from "../../state/ProjectContext";
import "./preview.css";

export function PreviewFrame() {
  const { state } = useProject();
  const doc = useMemo(() => generatePreviewDocument(state.present), [state.present]);
  const width = DEFAULT_VIEWPORT_WIDTHS[state.present.settings.viewport];

  return (
    <div className="preview-wrap">
      <iframe
        key={state.present.settings.viewport}
        className="preview-frame"
        style={{ width }}
        srcDoc={doc}
        sandbox="allow-scripts"
        title="Preview"
      />
    </div>
  );
}
