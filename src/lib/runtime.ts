/**
 * Unified runtime detection and environment utilities.
 * Ensures consistent checking across all modules (Tauri vs Web/Node).
 */

export const isTauriRuntime = (): boolean =>
  typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);
