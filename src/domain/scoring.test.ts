import { describe, expect, it } from "vitest";
import { scoreManualLimitHand, validateWinEntry } from "./scoring";
import type { WinEntry } from "./types";

const baseWinEntry: WinEntry = {
  winnerId: "p1",
  winType: "ron",
  discarderId: "p2",
  winningTile: { suit: "man", value: 3 },
  concealedTiles: [
    { suit: "man", value: 2 },
    { suit: "man", value: 3 },
    { suit: "man", value: 4 },
    { suit: "pin", value: 2 },
    { suit: "pin", value: 3 },
    { suit: "pin", value: 4 },
    { suit: "sou", value: 2 },
    { suit: "sou", value: 3 },
    { suit: "sou", value: 4 },
    { suit: "man", value: 6 },
    { suit: "man", value: 7 },
    { suit: "man", value: 8 },
    { suit: "honor", value: 1 }
  ],
  melds: [],
  doraIndicators: [],
  uraDoraIndicators: [],
  conditions: ["riichi"]
};

describe("scoring adapter", () => {
  it("accepts a 14-tile closed hand with a winning tile", () => {
    expect(validateWinEntry(baseWinEntry)).toEqual([]);
  });

  it("rejects tile counts above four", () => {
    const invalid = {
      ...baseWinEntry,
      concealedTiles: Array.from({ length: 13 }, () => ({ suit: "man" as const, value: 1 }))
    };
    expect(validateWinEntry(invalid)).toContain("A physical tile cannot appear more than four times.");
  });

  it("returns deterministic manual limit score objects for special flows", () => {
    expect(scoreManualLimitHand({ label: "mangan", dealer: false, winType: "ron" })).toMatchObject({
      han: 5,
      fu: 0,
      limit: "mangan",
      ronPayment: 8000
    });
  });
});
