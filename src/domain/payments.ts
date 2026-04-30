export interface ScoreDelta {
  playerIndex: number;
  delta: number;
}

export function applyHonba(payment: number, type: "ron" | "tsumo", honba: number): number {
  assertPayment(payment);
  assertNonNegativeInteger(honba, "Honba");

  return payment + honba * (type === "ron" ? 300 : 100);
}

export function ronDeltas(input: {
  winnerIndex: number;
  discarderIndex: number;
  basePayment: number;
  honba: number;
  riichiSticks: number;
}): ScoreDelta[] {
  assertSeatIndex(input.winnerIndex);
  assertSeatIndex(input.discarderIndex);
  if (input.winnerIndex === input.discarderIndex) {
    throw new Error("Winner and discarder must be different players.");
  }
  assertNonNegativeInteger(input.riichiSticks, "Riichi sticks");

  const payment = applyHonba(input.basePayment, "ron", input.honba);
  const winnerAmount = payment + input.riichiSticks * 1000;

  return [
    { playerIndex: input.winnerIndex, delta: winnerAmount },
    { playerIndex: input.discarderIndex, delta: -payment }
  ];
}

export function tsumoDeltas(input: {
  winnerIndex: number;
  dealerIndex: number;
  dealerPays: number;
  childPays: number;
  honba: number;
  riichiSticks: number;
}): ScoreDelta[] {
  assertSeatIndex(input.winnerIndex);
  assertSeatIndex(input.dealerIndex);
  assertNonNegativeInteger(input.riichiSticks, "Riichi sticks");
  assertPayment(input.childPays);
  if (input.winnerIndex === input.dealerIndex) {
    throw new Error("Dealer payment is not used when the winner is dealer.");
  }
  assertPayment(input.dealerPays);
  assertNonNegativeInteger(input.honba, "Honba");

  const deltas: ScoreDelta[] = [];
  let winnerDelta = input.riichiSticks * 1000;

  for (let playerIndex = 0; playerIndex < 4; playerIndex += 1) {
    if (playerIndex === input.winnerIndex) continue;
    const base = playerIndex === input.dealerIndex ? input.dealerPays : input.childPays;
    const amount = applyHonba(base, "tsumo", input.honba);
    deltas.push({ playerIndex, delta: -amount });
    winnerDelta += amount;
  }

  deltas.push({ playerIndex: input.winnerIndex, delta: winnerDelta });
  return deltas.sort((a, b) => a.playerIndex - b.playerIndex);
}

export function exhaustiveDrawDeltas(tenpaiPlayerIndexes: number[], playerCount: number): ScoreDelta[] {
  if (playerCount !== 4) {
    throw new Error("Only four-player exhaustive draw payments are supported.");
  }

  const tenpai = new Set(tenpaiPlayerIndexes);
  if (tenpai.size !== tenpaiPlayerIndexes.length) {
    throw new Error("Tenpai player indexes must be unique.");
  }

  for (const playerIndex of tenpai) {
    assertSeatIndex(playerIndex);
  }

  if (tenpai.size === 0 || tenpai.size === playerCount) {
    return Array.from({ length: playerCount }, (_, playerIndex) => ({ playerIndex, delta: 0 }));
  }

  const notenCount = playerCount - tenpai.size;
  const tenpaiGain = 3000 / tenpai.size;
  const notenLoss = 3000 / notenCount;

  return Array.from({ length: playerCount }, (_, playerIndex) => ({
    playerIndex,
    delta: tenpai.has(playerIndex) ? tenpaiGain : -notenLoss
  }));
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

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
}
