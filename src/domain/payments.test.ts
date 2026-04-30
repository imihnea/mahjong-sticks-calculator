import { describe, expect, it } from "vitest";
import { applyHonba, exhaustiveDrawDeltas, nearestWinnerForRiichiDeposit, ronDeltas, tsumoDeltas } from "./payments";

describe("payments", () => {
  it("applies ron deltas from one discarder to one winner", () => {
    expect(ronDeltas({ winnerIndex: 1, discarderIndex: 3, basePayment: 8000, honba: 0, riichiSticks: 1 })).toEqual([
      { playerIndex: 1, delta: 9000 },
      { playerIndex: 3, delta: -8000 }
    ]);
  });

  it("finds nearest winner from discarder turn order", () => {
    expect(nearestWinnerForRiichiDeposit({ discarderIndex: 0, winnerIndexes: [2, 3] })).toBe(2);
    expect(nearestWinnerForRiichiDeposit({ discarderIndex: 2, winnerIndexes: [0, 1] })).toBe(0);
  });

  it("adds 300 per honba to ron payment", () => {
    expect(applyHonba(8000, "ron", 2)).toBe(8600);
  });

  it("adds 100 per honba to each tsumo payer", () => {
    expect(applyHonba(2000, "tsumo", 3)).toBe(2300);
  });

  it("creates non-dealer tsumo deltas", () => {
    expect(tsumoDeltas({ winnerIndex: 2, dealerIndex: 0, dealerPays: 4000, childPays: 2000, honba: 1, riichiSticks: 0 })).toEqual([
      { playerIndex: 0, delta: -4100 },
      { playerIndex: 1, delta: -2100 },
      { playerIndex: 2, delta: 8300 },
      { playerIndex: 3, delta: -2100 }
    ]);
  });

  it("creates dealer tsumo deltas", () => {
    expect(tsumoDeltas({ winnerIndex: 0, dealerIndex: 0, dealerPays: 0, childPays: 4000, honba: 1, riichiSticks: 1 })).toEqual([
      { playerIndex: 0, delta: 13300 },
      { playerIndex: 1, delta: -4100 },
      { playerIndex: 2, delta: -4100 },
      { playerIndex: 3, delta: -4100 }
    ]);
  });

  it("applies exhaustive draw tenpai/noten payments", () => {
    expect(exhaustiveDrawDeltas([0], 4)).toEqual([
      { playerIndex: 0, delta: 3000 },
      { playerIndex: 1, delta: -1000 },
      { playerIndex: 2, delta: -1000 },
      { playerIndex: 3, delta: -1000 }
    ]);
    expect(exhaustiveDrawDeltas([0, 1, 2], 4)).toEqual([
      { playerIndex: 0, delta: 1000 },
      { playerIndex: 1, delta: 1000 },
      { playerIndex: 2, delta: 1000 },
      { playerIndex: 3, delta: -3000 }
    ]);
  });

  it("rejects impossible ron payment inputs", () => {
    expect(() => ronDeltas({ winnerIndex: 1, discarderIndex: 1, basePayment: 8000, honba: 0, riichiSticks: 0 })).toThrow(
      "Winner and discarder must be different players."
    );
    expect(() => ronDeltas({ winnerIndex: 4, discarderIndex: 1, basePayment: 8000, honba: 0, riichiSticks: 0 })).toThrow(
      "Player index must be between 0 and 3."
    );
    expect(() => ronDeltas({ winnerIndex: 1, discarderIndex: 3, basePayment: 8050, honba: 0, riichiSticks: 0 })).toThrow(
      "Payment must be a positive multiple of 100."
    );
    expect(() => ronDeltas({ winnerIndex: 1, discarderIndex: 3, basePayment: 8000, honba: -1, riichiSticks: 0 })).toThrow(
      "Honba must be a non-negative integer."
    );
    expect(() => ronDeltas({ winnerIndex: 1, discarderIndex: 3, basePayment: 8000, honba: 0, riichiSticks: -1 })).toThrow(
      "Riichi sticks must be a non-negative integer."
    );
  });

  it("rejects impossible tsumo payment inputs", () => {
    expect(() => tsumoDeltas({ winnerIndex: 2, dealerIndex: 0, dealerPays: 4050, childPays: 2000, honba: 0, riichiSticks: 0 })).toThrow(
      "Payment must be a positive multiple of 100."
    );
  });

  it("rejects invalid exhaustive draw inputs", () => {
    expect(() => exhaustiveDrawDeltas([0, 1, 2, 2], 4)).toThrow("Tenpai player indexes must be unique.");
    expect(() => exhaustiveDrawDeltas([-1], 4)).toThrow("Player index must be between 0 and 3.");
    expect(() => exhaustiveDrawDeltas([0], 3)).toThrow("Only four-player exhaustive draw payments are supported.");
  });
});
