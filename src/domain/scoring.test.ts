import { describe, expect, it } from "vitest";
import { scoreManualLimitHand, scoreWinEntry, validateWinEntry } from "./scoring";
import type { Meld, Tile, WinEntry } from "./types";

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

  it("rejects invalid manual score win types", () => {
    expect(() => scoreManualLimitHand({ label: "mangan", dealer: false, winType: "draw" as "ron" })).toThrow(
      "Win type must be ron or tsumo."
    );
  });

  it("accepts kan hands as 14 effective tiles", () => {
    const kanEntry: WinEntry = {
      ...baseWinEntry,
      winningTile: { suit: "sou", value: 7 },
      concealedTiles: [
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
      melds: [{ type: "closed-kan", tiles: repeatTile({ suit: "man", value: 1 }, 4) }]
    };

    expect(validateWinEntry(kanEntry)).toEqual([]);
  });

  it("rejects malformed tiles and red fives", () => {
    expect(validateWinEntry(withWinningTile({ suit: "honor", value: 8 }))).toContain("Honor tiles must have value 1-7.");
    expect(validateWinEntry(withWinningTile({ suit: "man", value: 0 }))).toContain("Suit tiles must have value 1-9.");
    expect(validateWinEntry(withWinningTile({ suit: "flower", value: 1 } as unknown as Tile))).toContain("Tile suit must be man, pin, sou, or honor.");
    expect(validateWinEntry(withWinningTile({ suit: "honor", value: 1, red: true }))).toContain("Only suit fives can be red.");
    expect(validateWinEntry(withWinningTile({ suit: "pin", value: 4, red: true }))).toContain("Only suit fives can be red.");

    const duplicateRed: WinEntry = {
      ...baseWinEntry,
      winningTile: { suit: "man", value: 5, red: true },
      concealedTiles: [
        { suit: "man", value: 5, red: true },
        ...baseWinEntry.concealedTiles.slice(1)
      ]
    };
    expect(validateWinEntry(duplicateRed)).toContain("A suit can have at most one red five.");
  });

  it("validates dora and ura dora indicators", () => {
    expect(validateWinEntry({ ...baseWinEntry, doraIndicators: [{ suit: "honor", value: 9 }] })).toContain(
      "Honor tiles must have value 1-7."
    );
    expect(validateWinEntry({ ...baseWinEntry, uraDoraIndicators: [{ suit: "north", value: 1 } as unknown as Tile] })).toContain(
      "Tile suit must be man, pin, sou, or honor."
    );
  });

  it("rejects malformed melds", () => {
    expect(validateWinEntry(withMeld({ type: "pon", tiles: repeatTile({ suit: "man", value: 2 }, 2) }))).toContain(
      "Pon melds must contain exactly 3 tiles."
    );
    expect(validateWinEntry(withMeld({ type: "open-kan", tiles: repeatTile({ suit: "sou", value: 4 }, 3) }))).toContain(
      "Kan melds must contain exactly 4 tiles."
    );
    expect(validateWinEntry(withMeld({ type: "chi", tiles: repeatTile({ suit: "honor", value: 1 }, 3) }))).toContain(
      "Chi melds must use suited tiles."
    );
    expect(validateWinEntry(withMeld({ type: "pair", tiles: repeatTile({ suit: "pin", value: 2 }, 2) } as unknown as Meld))).toContain(
      "Meld type is invalid."
    );
  });

  it("returns only relevant payment fields for the win type", async () => {
    await expect(scoreWinEntry(baseWinEntry)).resolves.toMatchObject({
      paymentKind: "ron",
      ronPayment: 1000
    });
    await expect(scoreWinEntry(baseWinEntry)).resolves.not.toHaveProperty("dealerTsumoPayment");

    const tsumoEntry: WinEntry = {
      ...baseWinEntry,
      winType: "tsumo",
      discarderId: undefined
    };
    await expect(scoreWinEntry(tsumoEntry)).resolves.toMatchObject({
      paymentKind: "tsumo",
      dealerTsumoPayment: 500,
      childTsumoPayment: 300
    });
    await expect(scoreWinEntry(tsumoEntry)).resolves.not.toHaveProperty("ronPayment");
  });

  it("rejects invalid runtime win type shapes", async () => {
    const invalidWinType = { ...baseWinEntry, winType: "draw" } as unknown as WinEntry;
    expect(validateWinEntry(invalidWinType)).toContain("Win type must be ron or tsumo.");
    await expect(scoreWinEntry(invalidWinType)).rejects.toThrow("Win type must be ron or tsumo.");

    const tsumoWithDiscarder = { ...baseWinEntry, winType: "tsumo" } as unknown as WinEntry;
    expect(validateWinEntry(tsumoWithDiscarder)).toContain("Tsumo must not include a discarder.");
    await expect(scoreWinEntry(tsumoWithDiscarder)).rejects.toThrow("Tsumo must not include a discarder.");
  });
});

function repeatTile(tile: Tile, count: number): Tile[] {
  return Array.from({ length: count }, () => ({ ...tile }));
}

function withWinningTile(winningTile: Tile): WinEntry {
  return { ...baseWinEntry, winningTile };
}

function withMeld(meld: Meld): WinEntry {
  return { ...baseWinEntry, melds: [meld] };
}
