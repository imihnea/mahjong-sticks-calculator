import { beforeEach, describe, expect, it, vi } from "vitest";
import { createNewGame } from "@/domain/gameState";
import { clearSavedGame, loadSavedGame, saveGame } from "./gameStorage";

const { stores } = vi.hoisted(() => ({
  stores: new Map<string, Map<string, unknown>>()
}));

vi.mock("idb", () => ({
  openDB: async (
    _name: string,
    _version: number,
    options?: {
      upgrade?: (db: {
        objectStoreNames: { contains: (storeName: string) => boolean };
        createObjectStore: (storeName: string) => void;
      }) => void;
    }
  ) => {
    const db = {
      objectStoreNames: {
        contains: (storeName: string) => stores.has(storeName)
      },
      createObjectStore: (storeName: string) => {
        if (!stores.has(storeName)) {
          stores.set(storeName, new Map());
        }
      },
      put: async (storeName: string, value: unknown, key: string) => {
        stores.get(storeName)?.set(key, value);
      },
      get: async (storeName: string, key: string) => stores.get(storeName)?.get(key),
      delete: async (storeName: string, key: string) => {
        stores.get(storeName)?.delete(key);
      }
    };

    options?.upgrade?.(db);

    return db;
  }
}));

describe("gameStorage", () => {
  beforeEach(async () => {
    await clearSavedGame();
  });

  it("saves and loads the active game", async () => {
    const game = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });
    await saveGame(game);
    await expect(loadSavedGame()).resolves.toMatchObject({ id: game.id, gameLength: "east" });
  });

  it("returns null when no game is saved", async () => {
    await expect(loadSavedGame()).resolves.toBeNull();
  });
});
