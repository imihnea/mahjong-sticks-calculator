"use client";

import { useEffect, useRef, useState } from "react";
import { applyAbortiveDraw, applyDiceRoll, applyExhaustiveDraw, applyWin, createNewGame, declareRiichi, undoLastAction } from "@/domain/gameState";
import type { AbortiveDrawType, GameLength, GameState } from "@/domain/types";
import { clearSavedGame, loadSavedGame, saveGame } from "@/storage/gameStorage";
import { DicePanel } from "./DicePanel";
import { HandResultFlow } from "./HandResultFlow";
import { NewGamePanel } from "./NewGamePanel";
import { TableView } from "./TableView";

type ActiveFlow = null | "dice" | "win" | "draw" | "abortive-draw";

export function AppShell() {
  const [game, setGame] = useState<GameState | null | undefined>(undefined);
  const [activeFlow, setActiveFlow] = useState<ActiveFlow>(null);
  const storageQueueRef = useRef<Promise<void>>(Promise.resolve());

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
          onCreateGame={(input: { gameLength: GameLength; playerNames: string[] }) => {
            const nextGame = createNewGame(input);
            setGame(nextGame);
            persistGame(nextGame);
          }}
        />
      </main>
    );
  }

  function updateGame(nextGame: GameState) {
    setGame(nextGame);
    setActiveFlow(null);
    persistGame(nextGame);
  }

  function startNewGame() {
    setGame(null);
    setActiveFlow(null);
    enqueueStorage(clearSavedGame);
  }

  function persistGame(nextGame: GameState) {
    enqueueStorage(() => saveGame(nextGame));
  }

  function enqueueStorage(operation: () => Promise<void>) {
    const nextOperation = storageQueueRef.current.catch(() => undefined).then(operation);
    storageQueueRef.current = nextOperation.catch(() => undefined);
  }

  return (
    <main className="app-frame">
      <TableView
        game={game}
        onRollDice={() => setActiveFlow("dice")}
        onWin={() => setActiveFlow("win")}
        onDraw={() => setActiveFlow("draw")}
        onAbortiveDraw={() => setActiveFlow("abortive-draw")}
        onUndo={() => updateGame(undoLastAction(game))}
        onNewGame={startNewGame}
        onRiichi={(playerId) => updateGame(declareRiichi(game, playerId))}
      />
      {activeFlow === "dice" ? (
        <DicePanel onApply={(dice) => updateGame(applyDiceRoll(game, dice))} onClose={() => setActiveFlow(null)} />
      ) : null}
      {activeFlow === "win" || activeFlow === "draw" || activeFlow === "abortive-draw" ? (
        <HandResultFlow
          game={game}
          mode={activeFlow}
          onClose={() => setActiveFlow(null)}
          onApplyExhaustiveDraw={(ids) => updateGame(applyExhaustiveDraw(game, ids))}
          onApplyAbortiveDraw={(drawType: AbortiveDrawType) => updateGame(applyAbortiveDraw(game, drawType))}
          onApplyWin={(payments, entries) => {
            const nextGame = applyWin(game, payments, entries);
            setGame(nextGame);
            persistGame(nextGame);
            return nextGame;
          }}
        />
      ) : null}
    </main>
  );
}
