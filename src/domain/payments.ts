export interface ScoreDelta {
  playerIndex: number;
  delta: number;
}

export function applyHonba(payment: number, type: "ron" | "tsumo", honba: number): number {
  return payment + honba * (type === "ron" ? 300 : 100);
}

export function ronDeltas(input: {
  winnerIndex: number;
  discarderIndex: number;
  basePayment: number;
  honba: number;
  riichiSticks: number;
}): ScoreDelta[] {
  const amount = applyHonba(input.basePayment, "ron", input.honba) + input.riichiSticks * 1000;
  return [
    { playerIndex: input.winnerIndex, delta: amount },
    { playerIndex: input.discarderIndex, delta: -amount }
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
  if (tenpaiPlayerIndexes.length === 0 || tenpaiPlayerIndexes.length === playerCount) {
    return Array.from({ length: playerCount }, (_, playerIndex) => ({ playerIndex, delta: 0 }));
  }

  const tenpai = new Set(tenpaiPlayerIndexes);
  const notenCount = playerCount - tenpai.size;
  const tenpaiGain = 3000 / tenpai.size;
  const notenLoss = 3000 / notenCount;

  return Array.from({ length: playerCount }, (_, playerIndex) => ({
    playerIndex,
    delta: tenpai.has(playerIndex) ? tenpaiGain : -notenLoss
  }));
}
