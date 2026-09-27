import { stylesToCSSBody } from "./cssEngine";
import type { UixDocument, UixElement } from "./types";

const VOID_TAGS = new Set(["img", "input"]);

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderElementHtml(el: UixElement, depth: number): string {
  const indent = "  ".repeat(depth);
  const classAttr = ` class="${el.id}"`;
  const attrs = el.attributes
    ? Object.entries(el.attributes)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => ` ${k}="${escapeHtml(v)}"`)
        .join("")
    : "";

  if (VOID_TAGS.has(el.tag)) {
    return `${indent}<${el.tag}${classAttr}${attrs} />`;
  }

  const openTag = `${indent}<${el.tag}${classAttr}${attrs}>`;
  const closeTag = `</${el.tag}>`;

  if (el.children.length === 0) {
    const content = el.content ? escapeHtml(el.content) : "";
    return `${openTag}${content}${closeTag}`;
  }

  const childrenHtml = el.children.map((c) => renderElementHtml(c, depth + 1)).join("\n");
  return `${openTag}\n${childrenHtml}\n${indent}${closeTag}`;
}

function collectRules(el: UixElement, out: string[]): void {
  if (Object.keys(el.styles).length > 0) {
    out.push(`.${el.id} {\n${stylesToCSSBody(el.styles)}\n}`);
  }
  for (const child of el.children) collectRules(child, out);
}

export function generateHtml(doc: UixDocument): string {
  const body = renderElementHtml(doc.root, 1);
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(doc.name)}</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
${body}
  <script src="script.js"></script>
</body>
</html>
`;
}

export function generateCss(doc: UixDocument): string {
  const rules: string[] = [
    ":root {",
    ...doc.variables.map((v) => `  --${v.name}: ${v.value};`),
    "}",
    "",
    "* { box-sizing: border-box; }",
    "body { margin: 0; }",
  ];
  const elementRules: string[] = [];
  collectRules(doc.root, elementRules);
  rules.push("", ...elementRules);
  return rules.join("\n") + "\n";
}

export function generateJs(_doc: UixDocument): string {
  return "// Gerado pelo UID — interações serão adicionadas aqui.\n";
}

export function generatePreviewDocument(doc: UixDocument): string {
  const body = renderElementHtml(doc.root, 1);
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(doc.name)}</title>
  <style>${generateCss(doc)}</style>
</head>
<body>
${body}
  <script>${generateJs(doc)}</script>
</body>
</html>
`;
}

export function downloadTextFile(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportZip(doc: UixDocument) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  zip.file("index.html", generateHtml(doc));
  zip.file("style.css", generateCss(doc));
  zip.file("script.js", generateJs(doc));
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${doc.name || "projeto"}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
