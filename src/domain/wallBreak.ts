import type { DiceRoll, SeatWind } from "./types";
import { nextSeatIndex, seatWindLabel } from "./winds";

interface WallBreakInput {
  dealerIndex: number;
  die1: number;
  die2: number;
}

const WIND_ORDER: SeatWind[] = ["east", "south", "west", "north"];

export function calculateWallBreak(input: WallBreakInput): DiceRoll {
  if (!isDie(input.die1) || !isDie(input.die2)) {
    throw new Error("Dice must be between 1 and 6.");
  }

  const diceTotal = input.die1 + input.die2;
  const countPath = buildCountPath(input.dealerIndex, diceTotal);
  const wallOwnerIndex = countPath[countPath.length - 1];
  const wallWind = seatWindLabel(WIND_ORDER[(wallOwnerIndex - input.dealerIndex + 4) % 4]);

  return {
    die1: input.die1,
    die2: input.die2,
    diceTotal,
    wallOwnerIndex,
    breakAfterStacksFromRight: diceTotal,
    countPath,
    instruction: `Break ${wallWind}'s wall after ${diceTotal} stacks from the right.`
  };
}

function isDie(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 6;
}

function buildCountPath(startIndex: number, count: number): number[] {
  const path = [startIndex];
  while (path.length < count) {
    path.push(nextSeatIndex(path[path.length - 1]));
  }
  return path;
}
