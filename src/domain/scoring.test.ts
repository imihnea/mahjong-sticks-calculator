import { describe, expect, it } from "vitest";
import { scoreManualLimitHand, scoreWinEntry, validateWinEntry } from "./scoring";
import type { Meld, Tile, WinEntry } from "./types";

const baseWinEntry: WinEntry = {
  winnerId: "p1",
  winType: "ron",
  discarderId: "p2",
  winningTile: { suit: "man", value: 2 },
  concealedTiles: [
    { suit: "man", value: 3 },
    { suit: "man", value: 4 },
    { suit: "man", value: 6 },
    { suit: "man", value: 7 },
    { suit: "man", value: 8 },
    { suit: "pin", value: 2 },
    { suit: "pin", value: 3 },
    { suit: "pin", value: 4 },
    { suit: "sou", value: 3 },
    { suit: "sou", value: 4 },
    { suit: "sou", value: 5 },
    { suit: "sou", value: 5 },
    { suit: "sou", value: 5 }
  ],
  melds: [],
  doraIndicators: [],
  uraDoraIndicators: [],
  conditions: ["riichi"]
};

const noYakuRonEntry: WinEntry = {
  ...baseWinEntry,
  winningTile: { suit: "man", value: 2 },
  concealedTiles: [
    { suit: "man", value: 3 },
    { suit: "man", value: 4 },
    { suit: "man", value: 6 },
    { suit: "man", value: 7 },
    { suit: "man", value: 8 },
    { suit: "pin", value: 2 },
    { suit: "pin", value: 3 },
    { suit: "pin", value: 4 },
    { suit: "sou", value: 3 },
    { suit: "sou", value: 4 },
    { suit: "sou", value: 5 },
    { suit: "honor", value: 1 },
    { suit: "honor", value: 1 }
  ],
  conditions: []
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

  it("scores manual riichi pinfu ron fixture through the adapter", async () => {
    const result = await scoreWinEntry(baseWinEntry);

    expect(result.paymentKind).toBe("ron");
    expect(result.yaku).toContain("Riichi");
    expect(result.yaku).toContain("Pinfu");
    expect(result.yaku).toContain("Tanyao");
    expect(result.han).toBe(3);
    expect(result.fu).toBe(30);
    if (result.paymentKind === "ron") {
      expect(result.ronPayment).toBe(3900);
    }
  });

  it("requires at least one yaku", async () => {
    await expect(scoreWinEntry(noYakuRonEntry)).rejects.toThrow("Winning hand has no yaku.");
  });

  it("returns only relevant payment fields for the win type", async () => {
    await expect(scoreWinEntry(baseWinEntry)).resolves.toMatchObject({
      paymentKind: "ron",
      ronPayment: 3900
    });
    await expect(scoreWinEntry(baseWinEntry)).resolves.not.toHaveProperty("dealerTsumoPayment");

    const tsumoEntry: WinEntry = {
      ...baseWinEntry,
      winType: "tsumo",
      discarderId: undefined
    };
    await expect(scoreWinEntry(tsumoEntry)).resolves.toMatchObject({
      paymentKind: "tsumo",
      dealerTsumoPayment: 2600,
      childTsumoPayment: 1300
    });
    await expect(scoreWinEntry(tsumoEntry)).resolves.not.toHaveProperty("ronPayment");
  });

  it("uses dealer payments when the winner seat wind is east", async () => {
    await expect(scoreWinEntry(baseWinEntry, { roundWind: "east", seatWind: "east" })).resolves.toMatchObject({
      paymentKind: "ron",
      ronPayment: 5800
    });
    await expect(scoreWinEntry(baseWinEntry, { dealer: true })).resolves.toMatchObject({
      paymentKind: "ron",
      ronPayment: 5800
    });

    const dealerTsumo: WinEntry = {
      ...baseWinEntry,
      winType: "tsumo",
      discarderId: undefined
    };
    await expect(scoreWinEntry(dealerTsumo, { roundWind: "east", seatWind: "east" })).resolves.toMatchObject({
      paymentKind: "tsumo",
      dealerTsumoPayment: 2600,
      childTsumoPayment: 2600
    });
  });

  it("passes seat wind context through for wind yaku detection", async () => {
    const northSeatWindEntry: WinEntry = {
      winnerId: "p1",
      winType: "ron",
      discarderId: "p2",
      winningTile: { suit: "pin", value: 5 },
      concealedTiles: [
        { suit: "honor", value: 4 },
        { suit: "honor", value: 4 },
        { suit: "honor", value: 4 },
        { suit: "man", value: 2 },
        { suit: "man", value: 3 },
        { suit: "man", value: 4 },
        { suit: "pin", value: 2 },
        { suit: "pin", value: 3 },
        { suit: "pin", value: 4 },
        { suit: "sou", value: 6 },
        { suit: "sou", value: 7 },
        { suit: "sou", value: 8 },
        { suit: "pin", value: 5 }
      ],
      melds: [],
      doraIndicators: [],
      uraDoraIndicators: [],
      conditions: []
    };

    await expect(scoreWinEntry(northSeatWindEntry)).rejects.toThrow("Winning hand has no yaku.");
    await expect(scoreWinEntry(northSeatWindEntry, { roundWind: "east", seatWind: "north" })).resolves.toMatchObject({
      yaku: ["自風北"],
      han: 1,
      fu: 40,
      paymentKind: "ron",
      ronPayment: 1300
    });
  });

  it("does not count ura dora unless riichi or double riichi is declared", async () => {
    const uraIndicatorEntry: WinEntry = {
      ...baseWinEntry,
      conditions: [],
      uraDoraIndicators: [{ suit: "man", value: 1 }]
    };

    await expect(scoreWinEntry(uraIndicatorEntry)).resolves.toMatchObject({
      han: 2,
      ronPayment: 2000
    });
  });

  it("counts ura dora after riichi", async () => {
    await expect(scoreWinEntry({ ...baseWinEntry, uraDoraIndicators: [{ suit: "man", value: 1 }] })).resolves.toMatchObject({
      han: 4,
      ronPayment: 7700
    });
  });

  it("scores yakuman hands even though the library reports zero han", async () => {
    const kokushi: WinEntry = {
      winnerId: "p1",
      winType: "ron",
      discarderId: "p2",
      winningTile: { suit: "man", value: 1 },
      concealedTiles: [
        { suit: "man", value: 1 },
        { suit: "man", value: 9 },
        { suit: "pin", value: 1 },
        { suit: "pin", value: 9 },
        { suit: "sou", value: 1 },
        { suit: "sou", value: 9 },
        { suit: "honor", value: 1 },
        { suit: "honor", value: 2 },
        { suit: "honor", value: 3 },
        { suit: "honor", value: 4 },
        { suit: "honor", value: 5 },
        { suit: "honor", value: 6 },
        { suit: "honor", value: 7 }
      ],
      melds: [],
      doraIndicators: [],
      uraDoraIndicators: [],
      conditions: []
    };

    await expect(scoreWinEntry(kokushi)).resolves.toMatchObject({
      han: 26,
      fu: 0,
      limit: "double-yakuman",
      paymentKind: "ron",
      ronPayment: 64000
    });
  });

  it("sorts red fives by face value when serializing chi melds", async () => {
    const openTanyao: WinEntry = {
      winnerId: "p1",
      winType: "ron",
      discarderId: "p2",
      winningTile: { suit: "pin", value: 5 },
      concealedTiles: [
        { suit: "pin", value: 2 },
        { suit: "pin", value: 3 },
        { suit: "pin", value: 4 },
        { suit: "sou", value: 2 },
        { suit: "sou", value: 3 },
        { suit: "sou", value: 4 },
        { suit: "sou", value: 6 },
        { suit: "sou", value: 7 },
        { suit: "sou", value: 8 },
        { suit: "pin", value: 5 }
      ],
      melds: [
        {
          type: "chi",
          tiles: [
            { suit: "man", value: 4 },
            { suit: "man", value: 5, red: true },
            { suit: "man", value: 6 }
          ]
        }
      ],
      doraIndicators: [],
      uraDoraIndicators: [],
      conditions: []
    };

    await expect(scoreWinEntry(openTanyao)).resolves.toMatchObject({
      han: 2,
      paymentKind: "ron",
      ronPayment: 2000
    });
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
