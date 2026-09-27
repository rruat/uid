import { createStore, del, entries, get, set } from "idb-keyval";
import { createId } from "./id";
import type { UixDocument } from "./types";

const AUTOSAVE_KEY = "uid:autosave";
const projectsStore = createStore("uid-projects", "projects");

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
  if (!parsed.id) parsed.id = createId("proj");
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

// --- Local project library (saved directly on the device, in IndexedDB) ---
// More reliable on a mobile PWA than triggering an OS download/file-picker every time.

export interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: string;
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const all = await entries<string, UixDocument>(projectsStore);
  return all
    .map(([, doc]) => ({ id: doc.id, name: doc.name, updatedAt: doc.updatedAt }))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function saveProjectToLibrary(doc: UixDocument): Promise<void> {
  await set(doc.id, doc, projectsStore);
}

export async function loadProjectFromLibrary(id: string): Promise<UixDocument | undefined> {
  return get<UixDocument>(id, projectsStore);
}

export async function deleteProjectFromLibrary(id: string): Promise<void> {
  await del(id, projectsStore);
}

// --- Full reset: unregisters the service worker and wipes caches/storage. ---
// Use this on Android when a PWA update seems "stuck" showing stale assets.

export async function clearAllAppData(): Promise<void> {
  if ("serviceWorker" in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  }

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }

  if ("databases" in indexedDB) {
    const dbs = await indexedDB.databases();
    await Promise.all(
      dbs
        .filter((d): d is { name: string } => !!d.name)
        .map(
          (d) =>
            new Promise<void>((resolve) => {
              const req = indexedDB.deleteDatabase(d.name);
              req.onsuccess = () => resolve();
              req.onerror = () => resolve();
              req.onblocked = () => resolve();
            })
        )
    );
  } else {
    // Fallback for browsers without indexedDB.databases(): drop the databases we know about.
    await Promise.all(
      ["uid-projects", "keyval-store"].map(
        (name) =>
          new Promise<void>((resolve) => {
            const req = indexedDB.deleteDatabase(name);
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
            req.onblocked = () => resolve();
          })
      )
    );
  }

  localStorage.clear();
  sessionStorage.clear();
}
