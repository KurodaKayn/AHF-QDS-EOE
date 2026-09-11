import { nanoid } from "nanoid";

/**
 * Generates a unique identifier.
 * Pure business-agnostic utility.
 */
export function generateId(): string {
  return nanoid();
}
