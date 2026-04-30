import { MAHJONG_SOUL_RANKED_4P } from "./mahjongSoulRules";
import { exhaustiveDrawDeltas } from "./payments";
import type { AbortiveDrawType, GameLength, GameState, GameStateSnapshot, Player, PlayerId, WinEntry } from "./types";
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
  assertGameActive(game);
  const currentDice = calculateWallBreak({ dealerIndex: game.dealerIndex, die1: dice.die1, die2: dice.die2 });

  return withSnapshot(game, {
    ...game,
    currentDice,
    history: [...game.history, { type: "dice", dice: currentDice }]
  });
}

export function declareRiichi(game: GameState, playerId: PlayerId): GameState {
  assertGameActive(game);
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
  assertGameActive(game);
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

  const nextGame = refreshSeats({
    ...game,
    ...roundProgression,
    dealerIndex,
    honba: game.honba + 1,
    players: clearRiichi(applyDeltas(game.players, deltas)),
    currentDice: undefined,
    history: [...game.history, { type: "exhaustive-draw", tenpaiPlayerIds: tenpaiPlayerIdsSnapshot }]
  });

  return withSnapshot(game, markEndedAfterHand(game, nextGame, dealerContinues));
}

export function applyWin(
  game: GameState,
  payments: Array<{ winnerIndex: number; payerIndexes: number[]; amount: number }>,
  entries: WinEntry[] = []
): GameState {
  assertGameActive(game);
  validateWinPayments(game, payments);

  const dealerWon = payments.some((payment) => payment.payerIndexes.length > 0 && payment.winnerIndex === game.dealerIndex);
  const dealerIndex = rotateDealerAfterHand(game.dealerIndex, dealerWon);
  const roundProgression = advanceRound(game, dealerWon);
  const players = game.players.map((player, index) => {
    const won = payments.filter((payment) => payment.winnerIndex === index).reduce((sum, payment) => sum + payment.amount, 0);
    const paid = payments.filter((payment) => payment.payerIndexes.includes(index)).reduce((sum, payment) => sum + payment.amount, 0);
    return { ...player, score: player.score + won - paid, riichi: false };
  });

  const nextGame = refreshSeats({
    ...game,
    ...roundProgression,
    players,
    dealerIndex,
    honba: dealerWon ? game.honba + 1 : 0,
    riichiSticks: 0,
    currentDice: undefined,
    history: [...game.history, { type: "win", entries }]
  });

  return withSnapshot(game, markEndedAfterHand(game, nextGame, dealerWon));
}

export function applyAbortiveDraw(game: GameState, drawType: AbortiveDrawType): GameState {
  assertGameActive(game);
  return withSnapshot(game, {
    ...game,
    honba: game.honba + 1,
    players: clearRiichi(game.players),
    currentDice: undefined,
    history: [...game.history, { type: "abortive-draw", drawType }]
  });
}

export function undoLastAction(game: GameState): GameState {
  const previousSnapshot = game.undoStack.at(-1);
  if (!previousSnapshot) {
    throw new Error("No action to undo.");
  }

  return { ...previousSnapshot, undoStack: game.undoStack.slice(0, -1) };
}

function validateWinPayments(game: GameState, payments: Array<{ winnerIndex: number; payerIndexes: number[]; amount: number }>): void {
  let playerPaymentCount = 0;
  let riichiPoolPayment = 0;
  const realWinnerIndexes = new Set<number>();

  for (const payment of payments) {
    assertSeatIndex(payment.winnerIndex);
    assertPayment(payment.amount);

    if (new Set(payment.payerIndexes).size !== payment.payerIndexes.length) {
      throw new Error("Win payment payers must be unique.");
    }

    if (payment.payerIndexes.length > 1) {
      throw new Error("Win payment rows must have one payer, or no payer for riichi pool rows.");
    }

    for (const payerIndex of payment.payerIndexes) {
      assertSeatIndex(payerIndex);
      if (payerIndex === payment.winnerIndex) {
        throw new Error("Winner cannot pay their own win payment.");
      }
    }

    if (payment.payerIndexes.length === 0) {
      riichiPoolPayment += payment.amount;
      continue;
    } else {
      playerPaymentCount += 1;
      realWinnerIndexes.add(payment.winnerIndex);
    }
  }

  if (playerPaymentCount === 0) {
    throw new Error("Win payments must include at least one player payment.");
  }

  for (const payment of payments) {
    if (payment.payerIndexes.length === 0 && !realWinnerIndexes.has(payment.winnerIndex)) {
      throw new Error("Riichi pool recipient must be a winning player.");
    }
  }

  const expectedRiichiPoolPayment = game.riichiSticks * 1000;
  if (riichiPoolPayment > expectedRiichiPoolPayment) {
    throw new Error("Riichi pool payment cannot exceed the riichi sticks on the table.");
  }

  if (riichiPoolPayment !== expectedRiichiPoolPayment) {
    throw new Error("Riichi pool payment must equal the riichi sticks on the table.");
  }
}

function applyDeltas(players: Player[], deltas: Array<{ playerIndex: number; delta: number }>): Player[] {
  return players.map((player, index) => {
    const delta = deltas.find((candidate) => candidate.playerIndex === index)?.delta ?? 0;
    return { ...player, score: player.score + delta };
  });
}

function clearRiichi(players: Player[]): Player[] {
  return players.map((player) => ({ ...player, riichi: false }));
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

function markEndedAfterHand(previousGame: GameState, nextGame: GameState, dealerContinues: boolean): GameState {
  if (nextGame.players.some((player) => player.score < 0)) {
    return { ...nextGame, ended: true };
  }

  const hasPlayerAtTarget = nextGame.players.some((player) => player.score >= MAHJONG_SOUL_RANKED_4P.targetPoints);
  const isEndableHand = isScheduledFinalHand(previousGame) || isExtensionHand(previousGame);
  const ended =
    isEndableHand &&
    (dealerContinues ? isDealerFirstAtTarget(previousGame, nextGame) : hasPlayerAtTarget || isMaximumExtensionFinalHand(previousGame));
  return { ...nextGame, ended };
}

function isScheduledFinalHand(game: GameState): boolean {
  return (game.gameLength === "east" && game.roundWind === "east" && game.handNumber === 4) ||
    (game.gameLength === "south" && game.roundWind === "south" && game.handNumber === 4);
}

function isExtensionHand(game: GameState): boolean {
  return (game.gameLength === "east" && game.roundWind !== "east") || (game.gameLength === "south" && game.roundWind === "west");
}

function isMaximumExtensionFinalHand(game: GameState): boolean {
  return (game.gameLength === "east" && game.roundWind === "south" && game.handNumber === 4) ||
    (game.gameLength === "south" && game.roundWind === "west" && game.handNumber === 4);
}

function isDealerFirstAtTarget(previousGame: GameState, nextGame: GameState): boolean {
  const dealerScore = nextGame.players[previousGame.dealerIndex]?.score ?? Number.NEGATIVE_INFINITY;
  const highestScore = Math.max(...nextGame.players.map((player) => player.score));
  return dealerScore >= MAHJONG_SOUL_RANKED_4P.targetPoints && dealerScore >= highestScore;
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

function assertSeatIndex(index: number): void {
  if (!Number.isInteger(index) || index < 0 || index > 3) {
    throw new Error("Player index must be between 0 and 3.");
  }
}

function assertPayment(payment: number): void {
  if (!Number.isInteger(payment) || payment <= 0 || payment % 100 !== 0) {
    throw new Error("Payment must be a positive multiple of 100.");
  }
}

function assertGameActive(game: GameState): void {
  if (game.ended) {
    throw new Error("Game has ended.");
  }
}

function createId(prefix: string): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${prefix}-${Math.random().toString(36).slice(2)}`;
}
