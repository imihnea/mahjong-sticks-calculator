"use client";

import { useEffect, useState } from "react";
import { createNewGame, declareRiichi } from "@/domain/gameState";
import type { GameLength, GameState } from "@/domain/types";
import { loadSavedGame, saveGame } from "@/storage/gameStorage";
import { NewGamePanel } from "./NewGamePanel";
import { TableView } from "./TableView";

export function AppShell() {
  const [game, setGame] = useState<GameState | null>(null);

  useEffect(() => {
    void loadSavedGame().then(setGame).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (game) void saveGame(game).catch(() => undefined);
  }, [game]);

  if (!game) {
    return (
      <main className="app-frame">
        <NewGamePanel
          onCreateGame={(input: { gameLength: GameLength; playerNames: string[] }) => setGame(createNewGame(input))}
        />
      </main>
    );
  }

  return (
    <main className="app-frame">
      <TableView
        game={game}
        onRollDice={() => undefined}
        onWin={() => undefined}
        onDraw={() => undefined}
        onAbortiveDraw={() => undefined}
        onRiichi={(playerId) => setGame(declareRiichi(game, playerId))}
      />
    </main>
  );
}
