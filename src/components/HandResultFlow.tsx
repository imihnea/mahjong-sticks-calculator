"use client";

import { useState } from "react";
import { applyHonba, nearestWinnerForRiichiDeposit } from "@/domain/payments";
import { scoreWinEntry, validateWinEntry } from "@/domain/scoring";
import type { AbortiveDrawType, GameState, PlayerId, SeatWind, Tile, WinEntry, WinType } from "@/domain/types";
import { ResultPanel } from "./ResultPanel";
import { TileEditor } from "./TileEditor";

export interface WinPayment {
  winnerIndex: number;
  payerIndexes: number[];
  amount: number;
}

interface HandResultFlowProps {
  game: GameState;
  mode: "win" | "draw" | "abortive-draw";
  onClose: () => void;
  onApplyExhaustiveDraw: (tenpaiPlayerIds: string[]) => void;
  onApplyAbortiveDraw: (drawType: AbortiveDrawType) => void;
  onApplyWin?: (payments: WinPayment[], entries: WinEntry[]) => GameState;
}

export function HandResultFlow({
  game,
  mode,
  onClose,
  onApplyExhaustiveDraw,
  onApplyAbortiveDraw,
  onApplyWin
}: HandResultFlowProps) {
  const [concealedTiles, setConcealedTiles] = useState<Tile[]>([]);
  const [winningTile, setWinningTile] = useState<Tile | null>(null);
  const [photoReference, setPhotoReference] = useState<File | null>(null);
  const [winnerId, setWinnerId] = useState<PlayerId>(game.players[0]?.id ?? "");
  const [winType, setWinType] = useState<WinType>("ron");
  const [discarderId, setDiscarderId] = useState<PlayerId>(game.players[1]?.id ?? "");
  const [tenpaiPlayerIds, setTenpaiPlayerIds] = useState<PlayerId[]>([]);
  const [result, setResult] = useState<{
    transfers: Array<{ from: string; to: string; amount: number }>;
    inventories: Array<{ playerName: string; score: number; seatWind: SeatWind }>;
  } | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  if (mode === "draw") {
    return (
      <section className="modal-surface">
        <h2>Exhaustive draw</h2>
        <div className="choice-grid">
          {game.players.map((player) => (
            <label key={player.id}>
              <input
                type="checkbox"
                checked={tenpaiPlayerIds.includes(player.id)}
                onChange={(event) => {
                  setTenpaiPlayerIds((current) =>
                    event.target.checked ? [...current, player.id] : current.filter((id) => id !== player.id)
                  );
                }}
              />
              {player.name} tenpai
            </label>
          ))}
        </div>
        <button onClick={() => onApplyExhaustiveDraw(tenpaiPlayerIds)}>Apply draw</button>
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

  if (result) {
    return <ResultPanel transfers={result.transfers} inventories={result.inventories} onClose={onClose} />;
  }

  const winErrors = getWinEntryErrors(game, {
    concealedTiles,
    winningTile,
    winnerId,
    winType,
    discarderId
  });

  return (
    <section className="modal-surface">
      <h2>Winning hand</h2>
      <div className="tile-editor-field" role="group" aria-label="Winner">
        <h3>Winner</h3>
        <div className="choice-grid">
          {game.players.map((player) => (
            <button
              aria-pressed={winnerId === player.id}
              key={player.id}
              onClick={() => {
                setWinnerId(player.id);
                if (discarderId === player.id) {
                  setDiscarderId(game.players.find((candidate) => candidate.id !== player.id)?.id ?? "");
                }
              }}
            >
              {player.name}
            </button>
          ))}
        </div>
      </div>
      <div className="tile-editor-field" role="group" aria-label="Win type">
        <h3>Win type</h3>
        <div className="choice-grid">
          {(["ron", "tsumo"] as const).map((type) => (
            <button aria-pressed={winType === type} key={type} onClick={() => setWinType(type)}>
              {type === "ron" ? "Ron" : "Tsumo"}
            </button>
          ))}
        </div>
      </div>
      {winType === "ron" ? (
        <div className="tile-editor-field" role="group" aria-label="Discarder">
          <h3>Discarder</h3>
          <div className="choice-grid">
            {game.players
              .filter((player) => player.id !== winnerId)
              .map((player) => (
                <button aria-pressed={discarderId === player.id} key={player.id} onClick={() => setDiscarderId(player.id)}>
                  {player.name}
                </button>
              ))}
          </div>
        </div>
      ) : null}
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
        Photo reference (not saved)
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
      {applyError ? <p className="field-error">{applyError}</p> : null}
      <button
        disabled={winErrors.length > 0 || isApplying}
        onClick={() => {
          void applyScoredWin({
            game,
            concealedTiles,
            winningTile,
            winnerId,
            winType,
            discarderId,
            onApplyWin,
            setApplyError,
            setIsApplying,
            setResult
          });
        }}
      >
        {isApplying ? "Scoring..." : "Apply"}
      </button>
      <button onClick={onClose}>Cancel</button>
    </section>
  );
}

async function applyScoredWin(input: {
  game: GameState;
  concealedTiles: Tile[];
  winningTile: Tile | null;
  winnerId: PlayerId;
  winType: WinType;
  discarderId: PlayerId;
  onApplyWin?: (payments: WinPayment[], entries: WinEntry[]) => GameState;
  setApplyError: (error: string | null) => void;
  setIsApplying: (isApplying: boolean) => void;
  setResult: (result: {
    transfers: Array<{ from: string; to: string; amount: number }>;
    inventories: Array<{ playerName: string; score: number; seatWind: SeatWind }>;
  }) => void;
}) {
  const entry = createProvisionalWinEntry(input.game, {
    concealedTiles: input.concealedTiles,
    winningTile: input.winningTile,
    winnerId: input.winnerId,
    winType: input.winType,
    discarderId: input.discarderId
  });
  if (!entry) return;

  const winnerIndex = input.game.players.findIndex((player) => player.id === entry.winnerId);
  const discarderIndex = entry.winType === "ron" ? input.game.players.findIndex((player) => player.id === entry.discarderId) : -1;
  if (winnerIndex === -1 || (entry.winType === "ron" && discarderIndex === -1)) return;

  input.setApplyError(null);
  input.setIsApplying(true);

  try {
    const score = await scoreWinEntry(entry, {
      roundWind: input.game.roundWind,
      seatWind: input.game.players[winnerIndex].seatWind,
      dealer: winnerIndex === input.game.dealerIndex
    });
    const payments = paymentsFromScore({
      game: input.game,
      winnerIndex,
      discarderIndex,
      score
    });
    const nextGame = input.onApplyWin?.(payments, [entry]) ?? previewAppliedPayments(input.game, payments);

    input.setResult({
      transfers: transfersFromPayments(input.game, payments),
      inventories: nextGame.players.map((player) => ({ playerName: player.name, score: player.score, seatWind: player.seatWind }))
    });
  } catch (error) {
    input.setApplyError(error instanceof Error ? error.message : "Winning hand could not be applied.");
  } finally {
    input.setIsApplying(false);
  }
}

function paymentsFromScore(input: {
  game: GameState;
  winnerIndex: number;
  discarderIndex: number;
  score: Awaited<ReturnType<typeof scoreWinEntry>>;
}): WinPayment[] {
  const payments: WinPayment[] = [];

  if (input.score.paymentKind === "ron") {
    payments.push({
      winnerIndex: input.winnerIndex,
      payerIndexes: [input.discarderIndex],
      amount: applyHonba(input.score.ronPayment, "ron", input.game.honba)
    });
  } else {
    const payerIndexes = input.game.players.map((_, index) => index).filter((index) => index !== input.winnerIndex);
    for (const payerIndex of payerIndexes) {
      const baseAmount = payerIndex === input.game.dealerIndex ? input.score.dealerTsumoPayment : input.score.childTsumoPayment;
      payments.push({ winnerIndex: input.winnerIndex, payerIndexes: [payerIndex], amount: applyHonba(baseAmount, "tsumo", input.game.honba) });
    }
  }

  if (input.game.riichiSticks > 0) {
    const depositWinnerIndex =
      input.score.paymentKind === "ron"
        ? nearestWinnerForRiichiDeposit({ discarderIndex: input.discarderIndex, winnerIndexes: [input.winnerIndex] })
        : input.winnerIndex;
    payments.push({ winnerIndex: depositWinnerIndex, payerIndexes: [], amount: input.game.riichiSticks * 1000 });
  }

  return payments;
}

function transfersFromPayments(game: GameState, payments: WinPayment[]): Array<{ from: string; to: string; amount: number }> {
  return payments.flatMap((payment) => {
    const winnerName = game.players[payment.winnerIndex]?.name ?? `Player ${payment.winnerIndex + 1}`;
    if (payment.payerIndexes.length === 0) {
      return [{ from: "Riichi pool", to: winnerName, amount: payment.amount }];
    }

    return payment.payerIndexes.map((payerIndex) => ({
      from: game.players[payerIndex]?.name ?? `Player ${payerIndex + 1}`,
      to: winnerName,
      amount: payment.amount
    }));
  });
}

function previewAppliedPayments(game: GameState, payments: WinPayment[]): GameState {
  return {
    ...game,
    players: game.players.map((player, index) => {
      const won = payments.filter((payment) => payment.winnerIndex === index).reduce((sum, payment) => sum + payment.amount, 0);
      const paid = payments.filter((payment) => payment.payerIndexes.includes(index)).reduce((sum, payment) => sum + payment.amount, 0);
      return { ...player, score: player.score + won - paid };
    })
  };
}

function getWinEntryErrors(
  game: GameState,
  input: { concealedTiles: Tile[]; winningTile: Tile | null; winnerId: PlayerId; winType: WinType; discarderId: PlayerId }
): string[] {
  const provisionalEntry = createProvisionalWinEntry(game, input);
  if (!provisionalEntry) {
    return ["Choose a winning tile."];
  }

  return validateWinEntry(provisionalEntry);
}

function createProvisionalWinEntry(
  game: GameState,
  input: { concealedTiles: Tile[]; winningTile: Tile | null; winnerId: PlayerId; winType: WinType; discarderId: PlayerId }
): WinEntry | null {
  if (!input.winningTile) {
    return null;
  }

  const winnerExists = game.players.some((player) => player.id === input.winnerId);
  const discarderExists = input.winType === "tsumo" || game.players.some((player) => player.id === input.discarderId);

  if (!winnerExists || !discarderExists || (input.winType === "ron" && input.winnerId === input.discarderId)) {
    return null;
  }

  const base = {
    winnerId: input.winnerId,
    winningTile: input.winningTile,
    concealedTiles: input.concealedTiles,
    melds: [],
    doraIndicators: [],
    uraDoraIndicators: [],
    conditions: []
  };

  return input.winType === "ron" ? { ...base, winType: "ron", discarderId: input.discarderId } : { ...base, winType: "tsumo" };
}
