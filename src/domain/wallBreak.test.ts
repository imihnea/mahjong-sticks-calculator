import { describe, expect, it } from "vitest";
import { calculateWallBreak } from "./wallBreak";

describe("calculateWallBreak", () => {
  it("counts the wall owner from the dealer using the dice sum", () => {
    expect(calculateWallBreak({ dealerIndex: 0, die1: 1, die2: 1 })).toMatchObject({
      diceTotal: 2,
      wallOwnerIndex: 1,
      breakAfterStacksFromRight: 2
    });
    expect(calculateWallBreak({ dealerIndex: 0, die1: 3, die2: 3 })).toMatchObject({
      diceTotal: 6,
      wallOwnerIndex: 1,
      breakAfterStacksFromRight: 6
    });
    expect(calculateWallBreak({ dealerIndex: 2, die1: 5, die2: 6 })).toMatchObject({
      diceTotal: 11,
      wallOwnerIndex: 0,
      breakAfterStacksFromRight: 11
    });
  });

  it("returns a readable count path and instruction", () => {
    const result = calculateWallBreak({ dealerIndex: 0, die1: 2, die2: 4 });
    expect(result.countPath).toEqual([0, 1, 2, 3, 0, 1]);
    expect(result.instruction).toBe("Break South's wall after 6 stacks from the right.");
  });

  it("rejects non-physical dice", () => {
    expect(() => calculateWallBreak({ dealerIndex: 0, die1: 0, die2: 4 })).toThrow("Dice must be between 1 and 6.");
  });
});
