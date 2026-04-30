import { describe, expect, it } from "vitest";
import type { WinEntry } from "./types";

const winningTile = { suit: "man", value: 1 } as const;

describe("WinEntry type", () => {
  it("allows valid ron and tsumo entries at runtime", () => {
    const ron: WinEntry = {
      winnerId: "winner",
      winType: "ron",
      discarderId: "discarder",
      winningTile,
      concealedTiles: [],
      melds: [],
      doraIndicators: [],
      uraDoraIndicators: [],
      conditions: []
    };

    const tsumo: WinEntry = {
      winnerId: "winner",
      winType: "tsumo",
      winningTile,
      concealedTiles: [],
      melds: [],
      doraIndicators: [],
      uraDoraIndicators: [],
      conditions: []
    };

    expect(ron.winType).toBe("ron");
    expect(tsumo.winType).toBe("tsumo");
  });
});

// @ts-expect-error Ron requires a discarder.
const ronWithoutDiscarder: WinEntry = {
  winnerId: "winner",
  winType: "ron",
  winningTile,
  concealedTiles: [],
  melds: [],
  doraIndicators: [],
  uraDoraIndicators: [],
  conditions: []
};

// @ts-expect-error Tsumo must not include a discarder.
const tsumoWithDiscarder: WinEntry = {
  winnerId: "winner",
  winType: "tsumo",
  discarderId: "discarder",
  winningTile,
  concealedTiles: [],
  melds: [],
  doraIndicators: [],
  uraDoraIndicators: [],
  conditions: []
};

void ronWithoutDiscarder;
void tsumoWithDiscarder;
