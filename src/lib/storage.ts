// Storage adapter that uses SQLite in production (Tauri) and localStorage in development

import { StateStorage } from "zustand/middleware";

const isTauri = typeof window !== "undefined" && "__TAURI__" in window;
const isDev = process.env.NODE_ENV === "development";

// SQLite storage implementation
class SqliteStorage implements StateStorage {
  private db: any = null;
  private dbReady: Promise<void>;

  constructor() {
    this.dbReady = this.initDatabase();
  }

  private async initDatabase() {
    if (!isTauri) return;

    try {
      const Database = (await import("@tauri-apps/plugin-sql")).default;
      this.db = await Database.load("sqlite:quiz.db");

      // Create table if not exists
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS app_state (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `);
    } catch (error) {
      console.error("Failed to initialize SQLite database:", error);
    }
  }

  async getItem(name: string): Promise<string | null> {
    await this.dbReady;

    if (!this.db) {
      return localStorage.getItem(name);
    }

    try {
      const result = (await this.db.select(
        "SELECT value FROM app_state WHERE key = $1",
        [name]
      )) as Array<{ value: string }>;
      return result[0]?.value || null;
    } catch (error) {
      console.error("SQLite getItem error:", error);
      return null;
    }
  }

  async setItem(name: string, value: string): Promise<void> {
    await this.dbReady;

    if (!this.db) {
      localStorage.setItem(name, value);
      return;
    }

    try {
      await this.db.execute(
        `INSERT OR REPLACE INTO app_state (key, value, updated_at) 
         VALUES ($1, $2, $3)`,
        [name, value, Date.now()]
      );
    } catch (error) {
      console.error("SQLite setItem error:", error);
    }
  }

  async removeItem(name: string): Promise<void> {
    await this.dbReady;

    if (!this.db) {
      localStorage.removeItem(name);
      return;
    }

    try {
      await this.db.execute("DELETE FROM app_state WHERE key = $1", [name]);
    } catch (error) {
      console.error("SQLite removeItem error:", error);
    }
  }
}

// Export the appropriate storage based on environment
export const createStorage = (): StateStorage => {
  // Use localStorage in development, SQLite in production
  if (isDev || !isTauri) {
    return {
      getItem: (name) => localStorage.getItem(name),
      setItem: (name, value) => localStorage.setItem(name, value),
      removeItem: (name) => localStorage.removeItem(name),
    };
  }

  return new SqliteStorage();
};
