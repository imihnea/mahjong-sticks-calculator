"use client";

import { useEffect, useState } from "react";
import { createNewGame, declareRiichi } from "@/domain/gameState";
import type { GameLength, GameState } from "@/domain/types";
import { loadSavedGame, saveGame } from "@/storage/gameStorage";
import { NewGamePanel } from "./NewGamePanel";
import { TableView } from "./TableView";

export function AppShell() {
  const [game, setGame] = useState<GameState | null | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    void loadSavedGame()
      .then((savedGame) => {
        if (isMounted) setGame(savedGame);
      })
      .catch(() => {
        if (isMounted) setGame(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (game) void saveGame(game).catch(() => undefined);
  }, [game]);

  if (game === undefined) {
    return (
      <main className="app-frame">
        <section className="loading-state" aria-live="polite">
          <p className="eyebrow">Mahjong Soul Ranked 4P</p>
          <h1>Loading saved table</h1>
        </section>
      </main>
    );
  }

  if (game === null) {
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
        onRiichi={(playerId) => setGame((current) => (current ? declareRiichi(current, playerId) : current))}
      />
    </main>
  );
}
