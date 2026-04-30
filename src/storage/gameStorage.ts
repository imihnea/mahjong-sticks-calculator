import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { GameState } from "@/domain/types";

const DB_NAME = "mahjong-sticks-calculator";
const DB_VERSION = 1;
const STORE_NAME = "games";
const ACTIVE_GAME_KEY = "active";

interface MahjongSticksDb extends DBSchema {
  games: {
    key: string;
    value: GameState;
  };
}

async function getDb(): Promise<IDBPDatabase<MahjongSticksDb>> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    }
  });
}

export async function saveGame(game: GameState): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAME, game, ACTIVE_GAME_KEY);
}

export async function loadSavedGame(): Promise<GameState | null> {
  const db = await getDb();
  return (await db.get(STORE_NAME, ACTIVE_GAME_KEY)) ?? null;
}

export async function clearSavedGame(): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, ACTIVE_GAME_KEY);
}
