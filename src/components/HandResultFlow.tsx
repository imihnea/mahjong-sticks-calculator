"use client";

import { useState } from "react";
import { validateWinEntry } from "@/domain/scoring";
import type { AbortiveDrawType, GameState, Tile, WinEntry } from "@/domain/types";
import { TileEditor } from "./TileEditor";

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
  const [concealedTiles, setConcealedTiles] = useState<Tile[]>([]);
  const [winningTile, setWinningTile] = useState<Tile | null>(null);
  const [photoReference, setPhotoReference] = useState<File | null>(null);

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

  const winErrors = getWinEntryErrors(game, concealedTiles, winningTile);

  return (
    <section className="modal-surface">
      <h2>Winning hand</h2>
      <div className="tile-editor-field">
        <TileEditor label="Concealed tiles" tiles={concealedTiles} onChange={setConcealedTiles} />
      </div>
      <div className="tile-editor-field">
        <TileEditor
          label="Winning tile"
          tiles={winningTile ? [winningTile] : []}
          onChange={(tiles) => setWinningTile(tiles.at(-1) ?? null)}
        />
      </div>
      <label>
        Photo reference
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => setPhotoReference(event.target.files?.[0] ?? null)}
        />
      </label>
      {photoReference ? <p>{photoReference.name}</p> : null}
      {winErrors.map((error) => (
        <p className="field-error" key={error}>
          {error}
        </p>
      ))}
      <button disabled={winErrors.length > 0} onClick={onClose}>
        Apply
      </button>
      <button onClick={onClose}>Cancel</button>
    </section>
  );
}

function getWinEntryErrors(game: GameState, concealedTiles: Tile[], winningTile: Tile | null): string[] {
  if (!winningTile) {
    return ["Choose a winning tile."];
  }

  const winnerId = game.players[0]?.id;
  const discarderId = game.players[1]?.id;

  if (!winnerId || !discarderId) {
    return ["A winning hand needs at least two players in the game."];
  }

  const provisionalEntry: WinEntry = {
    winnerId,
    winType: "ron",
    discarderId,
    winningTile,
    concealedTiles,
    melds: [],
    doraIndicators: [],
    uraDoraIndicators: [],
    conditions: []
  };

  return validateWinEntry(provisionalEntry);
}
