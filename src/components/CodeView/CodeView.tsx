import { useState } from "react";
import { generateCss, generateHtml, generateJs } from "../../model/exportProject";
import { useProject } from "../../state/ProjectContext";
import "./codeView.css";

type Tab = "html" | "css" | "js";

export function CodeView() {
  const { state } = useProject();
  const [tab, setTab] = useState<Tab>("html");

  const content =
    tab === "html"
      ? generateHtml(state.present)
      : tab === "css"
      ? generateCss(state.present)
      : generateJs(state.present);

  return (
    <div className="code-view">
      <div className="tab-strip">
        {(["html", "css", "js"] as Tab[]).map((t) => (
          <button key={t} className={`tab-pill ${tab === t ? "is-active" : ""}`} onClick={() => setTab(t)}>
            {t.toUpperCase()}
          </button>
        ))}
        <button
          className="tab-pill"
          onClick={() => navigator.clipboard?.writeText(content)}
          title="Copiar"
        >
          Copiar
        </button>
      </div>
      <pre className="code-view__pre">
        <code>{content}</code>
      </pre>
    </div>
  );
}
