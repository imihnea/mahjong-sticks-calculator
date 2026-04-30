import { MAHJONG_SOUL_RANKED_4P } from "./mahjongSoulRules";
import { exhaustiveDrawDeltas } from "./payments";
import type { AbortiveDrawType, GameLength, GameState, GameStateSnapshot, Player, PlayerId } from "./types";
import { calculateWallBreak } from "./wallBreak";
import { getSeatWind, rotateDealerAfterHand } from "./winds";

interface NewGameInput {
  gameLength: GameLength;
  playerNames: string[];
}

export function createNewGame(input: NewGameInput): GameState {
  if (input.playerNames.length !== 4) {
    throw new Error("A four-player game requires exactly four player names.");
  }

  const dealerIndex = 0;
  return refreshSeats({
    id: createId("game"),
    gameLength: input.gameLength,
    players: input.playerNames.map<Player>((name, index) => ({
      id: createId("player"),
      name,
      score: MAHJONG_SOUL_RANKED_4P.startingPoints,
      initialSeat: getSeatWind(index, dealerIndex),
      seatWind: getSeatWind(index, dealerIndex),
      isDealer: index === dealerIndex,
      riichi: false
    })),
    dealerIndex,
    roundWind: "east",
    handNumber: 1,
    honba: 0,
    riichiSticks: 0,
    history: [],
    undoStack: [],
    ended: false
  });
}

export function applyDiceRoll(game: GameState, dice: { die1: number; die2: number }): GameState {
  const currentDice = calculateWallBreak({ dealerIndex: game.dealerIndex, die1: dice.die1, die2: dice.die2 });

  return withSnapshot(game, {
    ...game,
    currentDice,
    history: [...game.history, { type: "dice", dice: currentDice }]
  });
}

export function declareRiichi(game: GameState, playerId: PlayerId): GameState {
  const player = game.players.find((candidate) => candidate.id === playerId);
  if (!player) throw new Error("Player not found.");
  if (player.riichi) {
    throw new Error("Player has already declared riichi.");
  }
  if (player.score < MAHJONG_SOUL_RANKED_4P.riichiMinimumScore) {
    throw new Error("A player under 1000 points cannot declare riichi.");
  }

  return withSnapshot(game, {
    ...game,
    riichiSticks: game.riichiSticks + 1,
    players: game.players.map((candidate) =>
      candidate.id === playerId ? { ...candidate, score: candidate.score - 1000, riichi: true } : candidate
    ),
    history: [...game.history, { type: "riichi", playerId }]
  });
}

export function applyExhaustiveDraw(game: GameState, tenpaiPlayerIds: PlayerId[]): GameState {
  if (new Set(tenpaiPlayerIds).size !== tenpaiPlayerIds.length) {
    throw new Error("Tenpai players must be unique.");
  }

  const tenpaiIndexes = tenpaiPlayerIds.map((id) => {
    const playerIndex = game.players.findIndex((player) => player.id === id);
    if (playerIndex === -1) throw new Error("Player not found.");
    return playerIndex;
  });
  const deltas = exhaustiveDrawDeltas(tenpaiIndexes, game.players.length);
  const dealerContinues = tenpaiIndexes.includes(game.dealerIndex);
  const dealerIndex = rotateDealerAfterHand(game.dealerIndex, dealerContinues);
  const roundProgression = advanceRound(game, dealerContinues);
  const tenpaiPlayerIdsSnapshot = [...tenpaiPlayerIds];

  return withSnapshot(
    game,
    refreshSeats({
      ...game,
      ...roundProgression,
      dealerIndex,
      honba: game.honba + 1,
      players: applyDeltas(game.players, deltas),
      currentDice: undefined,
      history: [...game.history, { type: "exhaustive-draw", tenpaiPlayerIds: tenpaiPlayerIdsSnapshot }]
    })
  );
}

export function applyAbortiveDraw(game: GameState, drawType: AbortiveDrawType): GameState {
  return withSnapshot(game, {
    ...game,
    honba: game.honba + 1,
    currentDice: undefined,
    history: [...game.history, { type: "abortive-draw", drawType }]
  });
}

function applyDeltas(players: Player[], deltas: Array<{ playerIndex: number; delta: number }>): Player[] {
  return players.map((player, index) => {
    const delta = deltas.find((candidate) => candidate.playerIndex === index)?.delta ?? 0;
    return { ...player, score: player.score + delta };
  });
}

function refreshSeats(game: GameState): GameState {
  return {
    ...game,
    players: game.players.map((player, index) => ({
      ...player,
      seatWind: getSeatWind(index, game.dealerIndex),
      isDealer: index === game.dealerIndex
    }))
  };
}

function advanceRound(game: GameState, dealerContinues: boolean): Pick<GameState, "roundWind" | "handNumber"> {
  if (dealerContinues) {
    return { roundWind: game.roundWind, handNumber: game.handNumber };
  }

  if (game.handNumber < 4) {
    return { roundWind: game.roundWind, handNumber: game.handNumber + 1 };
  }

  if (game.roundWind === "east") {
    return { roundWind: "south", handNumber: 1 };
  }

  if (game.roundWind === "south") {
    return { roundWind: "west", handNumber: 1 };
  }

  return { roundWind: game.roundWind, handNumber: game.handNumber };
}

function withSnapshot(previousGame: GameState, nextGame: GameState): GameState {
  const snapshot = toSnapshot(previousGame);
  return { ...nextGame, undoStack: [...previousGame.undoStack, snapshot] };
}

function toSnapshot(game: GameState): GameStateSnapshot {
  return {
    id: game.id,
    gameLength: game.gameLength,
    players: game.players.map((player) => ({ ...player })),
    dealerIndex: game.dealerIndex,
    roundWind: game.roundWind,
    handNumber: game.handNumber,
    honba: game.honba,
    riichiSticks: game.riichiSticks,
    currentDice: game.currentDice ? { ...game.currentDice, countPath: [...game.currentDice.countPath] } : undefined,
    history: structuredClone(game.history),
    ended: game.ended
  };
}

function createId(prefix: string): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${prefix}-${Math.random().toString(36).slice(2)}`;
}
