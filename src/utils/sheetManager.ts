/**
 * Global Bottom Sheet & Drawer state manager.
 * Coordinates bottom sheets and mobile popovers to push the main interface
 * up so that the canvas and selected elements remain 100% visible and editable.
 */

let openCount = 0;

export function registerSheetOpen(isOpen: boolean): void {
  if (typeof document === "undefined") return;

  if (isOpen) {
    openCount++;
    document.body.classList.add("uid-sheet-open");
  } else {
    openCount = Math.max(0, openCount - 1);
    if (openCount === 0) {
      document.body.classList.remove("uid-sheet-open");
    }
  }
}
