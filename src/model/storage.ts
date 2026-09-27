import { get, set } from "idb-keyval";
import type { UixDocument } from "./types";

const AUTOSAVE_KEY = "uid:autosave";

export async function saveAutosave(doc: UixDocument): Promise<void> {
  await set(AUTOSAVE_KEY, doc);
}

export async function loadAutosave(): Promise<UixDocument | undefined> {
  return get<UixDocument>(AUTOSAVE_KEY);
}

export function serializeDocument(doc: UixDocument): string {
  return JSON.stringify(doc, null, 2);
}

export function parseDocument(json: string): UixDocument {
  const parsed = JSON.parse(json);
  if (parsed?.version !== 1 || !parsed.root) {
    throw new Error("Arquivo .uix inválido ou de versão incompatível.");
  }
  return parsed as UixDocument;
}

export function saveUixFile(doc: UixDocument): void {
  const json = serializeDocument(doc);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${doc.name || "projeto"}.uix`;
  a.click();
  URL.revokeObjectURL(url);
}

export function openUixFile(): Promise<UixDocument> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".uix,application/json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error("Nenhum arquivo selecionado."));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          resolve(parseDocument(String(reader.result)));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    };
    input.click();
  });
}
