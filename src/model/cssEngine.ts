import type { CSSProperties } from "./types";

/** Converts our kebab-case style map (real CSS property names) into a React inline-style object. */
export function stylesToReactStyle(styles: CSSProperties): React.CSSProperties {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(styles)) {
    if (value === undefined || value === "") continue;
    const camel = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = value;
  }
  return out as React.CSSProperties;
}

/** Renders a style map as a CSS rule body, e.g. "width:100%;padding:16px;" */
export function stylesToCSSBody(styles: CSSProperties): string {
  return Object.entries(styles)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
}
