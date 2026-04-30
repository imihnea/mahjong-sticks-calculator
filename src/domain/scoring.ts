import type { Tile, WinEntry, WinType } from "./types";

export interface ScoreBreakdown {
  yaku: string[];
  han: number;
  fu: number;
  limit?: "mangan" | "haneman" | "baiman" | "sanbaiman" | "yakuman" | "double-yakuman" | "triple-yakuman";
  ronPayment?: number;
  dealerTsumoPayment?: number;
  childTsumoPayment?: number;
}

export function validateWinEntry(entry: WinEntry): string[] {
  const errors: string[] = [];
  const tiles = [...entry.concealedTiles, entry.winningTile, ...entry.melds.flatMap((meld) => meld.tiles)];

  if (entry.winType === "ron" && !entry.discarderId) {
    errors.push("Ron requires a discarder.");
  }

  if (tiles.length !== 14) {
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

  return errors;
}

export function scoreManualLimitHand(input: {
  label: NonNullable<ScoreBreakdown["limit"]>;
  dealer: boolean;
  winType: WinType;
}): ScoreBreakdown {
  if (input.label !== "mangan") {
    throw new Error("Only mangan manual fallback is implemented in the MVP boundary.");
  }

  return input.winType === "ron"
    ? { yaku: ["Manual mangan"], han: 5, fu: 0, limit: "mangan", ronPayment: input.dealer ? 12000 : 8000 }
    : {
        yaku: ["Manual mangan"],
        han: 5,
        fu: 0,
        limit: "mangan",
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

  return {
    yaku: entry.conditions.includes("riichi") ? ["Riichi"] : [],
    han: entry.conditions.includes("riichi") ? 1 : 0,
    fu: 30,
    ronPayment: 1000,
    dealerTsumoPayment: 500,
    childTsumoPayment: 300
  };
}

function tileKey(tile: Tile): string {
  return `${tile.suit}-${tile.value}`;
}
