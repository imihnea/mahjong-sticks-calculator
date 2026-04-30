import type { Tile, WinEntry, WinType } from "./types";

type LimitLabel = "mangan" | "haneman" | "baiman" | "sanbaiman" | "yakuman" | "double-yakuman" | "triple-yakuman";

interface BaseScoreBreakdown {
  yaku: string[];
  han: number;
  fu: number;
  limit?: LimitLabel;
}

export type ScoreBreakdown =
  | (BaseScoreBreakdown & {
      paymentKind: "ron";
      ronPayment: number;
    })
  | (BaseScoreBreakdown & {
      paymentKind: "tsumo";
      dealerTsumoPayment: number;
      childTsumoPayment: number;
    });

export function validateWinEntry(entry: WinEntry): string[] {
  const errors: string[] = [];
  const tiles = [...entry.concealedTiles, entry.winningTile, ...entry.melds.flatMap((meld) => meld.tiles)];
  const indicatorTiles = [...entry.doraIndicators, ...entry.uraDoraIndicators];
  const effectiveTileCount =
    entry.concealedTiles.length + 1 + entry.melds.reduce((total, meld) => total + effectiveMeldTileCount(meld.type), 0);

  if (entry.winType === "ron" && !entry.discarderId) {
    errors.push("Ron requires a discarder.");
  }

  for (const tile of tiles) {
    errors.push(...validateTile(tile));
  }

  for (const tile of indicatorTiles) {
    errors.push(...validateTile(tile));
  }

  for (const meld of entry.melds) {
    errors.push(...validateMeld(meld));
  }

  if (effectiveTileCount !== 14) {
    errors.push("A complete winning hand must contain 14 tiles including the winning tile.");
  }

  const tileCounts = new Map<string, number>();
  for (const tile of tiles) {
    const key = tileKey(tile);
    tileCounts.set(key, (tileCounts.get(key) ?? 0) + 1);
  }

  if ([...tileCounts.values()].some((count) => count > 4)) {
    errors.push("A physical tile cannot appear more than four times.");
  }

  const redFiveCounts = new Map<string, number>();
  for (const tile of tiles) {
    if (!tile.red) continue;
    redFiveCounts.set(tile.suit, (redFiveCounts.get(tile.suit) ?? 0) + 1);
  }

  if ([...redFiveCounts.values()].some((count) => count > 1)) {
    errors.push("A suit can have at most one red five.");
  }

  return errors;
}

export function scoreManualLimitHand(input: {
  label: "mangan";
  dealer: boolean;
  winType: WinType;
}): ScoreBreakdown {
  return input.winType === "ron"
    ? { yaku: ["Manual mangan"], han: 5, fu: 0, limit: input.label, paymentKind: "ron", ronPayment: input.dealer ? 12000 : 8000 }
    : {
        yaku: ["Manual mangan"],
        han: 5,
        fu: 0,
        limit: input.label,
        paymentKind: "tsumo",
        dealerTsumoPayment: input.dealer ? 4000 : 4000,
        childTsumoPayment: input.dealer ? 4000 : 2000
      };
}

// The MVP boundary validates inputs now; full yaku/fu scoring is wired in Task 11.
export async function scoreWinEntry(entry: WinEntry): Promise<ScoreBreakdown> {
  const errors = validateWinEntry(entry);
  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }

  const base = {
    yaku: entry.conditions.includes("riichi") ? ["Riichi"] : [],
    han: entry.conditions.includes("riichi") ? 1 : 0,
    fu: 30
  };

  return entry.winType === "ron"
    ? { ...base, paymentKind: "ron", ronPayment: 1000 }
    : { ...base, paymentKind: "tsumo", dealerTsumoPayment: 500, childTsumoPayment: 300 };
}

function tileKey(tile: Tile): string {
  return `${tile.suit}-${tile.value}`;
}

function validateTile(tile: Tile): string[] {
  const errors: string[] = [];

  if (!isTileSuit(tile.suit)) {
    errors.push("Tile suit must be man, pin, sou, or honor.");
  } else if (tile.suit === "honor") {
    if (!Number.isInteger(tile.value) || tile.value < 1 || tile.value > 7) {
      errors.push("Honor tiles must have value 1-7.");
    }
  } else if (!Number.isInteger(tile.value) || tile.value < 1 || tile.value > 9) {
    errors.push("Suit tiles must have value 1-9.");
  }

  if (tile.red && (tile.suit === "honor" || tile.value !== 5)) {
    errors.push("Only suit fives can be red.");
  }

  return errors;
}

function validateMeld(meld: WinEntry["melds"][number]): string[] {
  const errors: string[] = [];
  if (!isMeldType(meld.type)) {
    errors.push("Meld type is invalid.");
    return errors;
  }

  const expectedCount = meld.type === "open-kan" || meld.type === "closed-kan" || meld.type === "added-kan" ? 4 : 3;

  if (meld.tiles.length !== expectedCount) {
    const label = meld.type === "pon" ? "Pon" : meld.type === "chi" ? "Chi" : "Kan";
    errors.push(`${label} melds must contain exactly ${expectedCount} tiles.`);
  }

  if (meld.type === "chi") {
    if (meld.tiles.some((tile) => tile.suit === "honor")) {
      errors.push("Chi melds must use suited tiles.");
    }
    const [firstSuit] = meld.tiles;
    const sortedValues = meld.tiles.map((tile) => tile.value).sort((a, b) => a - b);
    const sameSuit = meld.tiles.every((tile) => tile.suit === firstSuit.suit);
    const sequential = sortedValues.length === 3 && sortedValues[0] + 1 === sortedValues[1] && sortedValues[1] + 1 === sortedValues[2];
    if (!sameSuit || !sequential) {
      errors.push("Chi melds must be three sequential suited tiles.");
    }
  } else if (meld.tiles.length > 0) {
    const key = tileKey(meld.tiles[0]);
    if (!meld.tiles.every((tile) => tileKey(tile) === key)) {
      errors.push("Pon and kan melds must contain identical tiles.");
    }
  }

  return errors;
}

function effectiveMeldTileCount(type: WinEntry["melds"][number]["type"]): number {
  return isMeldType(type) ? 3 : 0;
}

function isTileSuit(suit: string): suit is Tile["suit"] {
  return suit === "man" || suit === "pin" || suit === "sou" || suit === "honor";
}

function isMeldType(type: string): type is WinEntry["melds"][number]["type"] {
  return type === "chi" || type === "pon" || type === "open-kan" || type === "closed-kan" || type === "added-kan";
}
