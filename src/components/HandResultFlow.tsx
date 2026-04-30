"use client";

import type { AbortiveDrawType, GameState } from "@/domain/types";

interface HandResultFlowProps {
  game: GameState;
  mode: "win" | "draw" | "abortive-draw";
  onClose: () => void;
  onApplyExhaustiveDraw: (tenpaiPlayerIds: string[]) => void;
  onApplyAbortiveDraw: (drawType: AbortiveDrawType) => void;
}

export function HandResultFlow({
  game,
  mode,
  onClose,
  onApplyExhaustiveDraw,
  onApplyAbortiveDraw
}: HandResultFlowProps) {
  if (mode === "draw") {
    return (
      <section className="modal-surface">
        <h2>Exhaustive draw</h2>
        {game.players.map((player) => (
          <button key={player.id} onClick={() => onApplyExhaustiveDraw([player.id])}>
            {player.name} tenpai only
          </button>
        ))}
        <button onClick={() => onApplyExhaustiveDraw([])}>Nobody tenpai</button>
        <button onClick={onClose}>Cancel</button>
      </section>
    );
  }

  if (mode === "abortive-draw") {
    return (
      <section className="modal-surface">
        <h2>Abortive draw</h2>
        <button onClick={() => onApplyAbortiveDraw("kyuushu-kyuuhai")}>Kyuushu kyuuhai</button>
        <button onClick={() => onApplyAbortiveDraw("suufuu-renda")}>Suufuu renda</button>
        <button onClick={() => onApplyAbortiveDraw("suukaikan")}>Suukaikan</button>
        <button onClick={() => onApplyAbortiveDraw("suucha-riichi")}>Suucha riichi</button>
        <button onClick={onClose}>Cancel</button>
      </section>
    );
  }

  return (
    <section className="modal-surface">
      <h2>Winning hand</h2>
      <p>The tile editor is added in the next task.</p>
      <button onClick={onClose}>Close</button>
    </section>
  );
}
