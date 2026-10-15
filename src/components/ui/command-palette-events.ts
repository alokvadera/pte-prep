/* The palette's entry point for code outside the component tree.

   It lives apart from CommandPalette.tsx so that file exports nothing but a
   component and stays hot-reloadable. The palette listens for the same event
   name; keep the two in sync. */

export const OPEN_COMMAND_PALETTE_EVENT = 'open-command-palette'

export function openCommandPalette(): void {
  window.dispatchEvent(new CustomEvent(OPEN_COMMAND_PALETTE_EVENT))
}
