import type { SeatWind } from "./types";

const WIND_ORDER: SeatWind[] = ["east", "south", "west", "north"];

export function nextSeatIndex(index: number): number {
  return (index + 1) % 4;
}

export function getSeatWind(playerIndex: number, dealerIndex: number): SeatWind {
  const relativeIndex = (playerIndex - dealerIndex + 4) % 4;
  return WIND_ORDER[relativeIndex];
}

export function rotateDealerAfterHand(dealerIndex: number, dealerContinues: boolean): number {
  return dealerContinues ? dealerIndex : nextSeatIndex(dealerIndex);
}

export function seatWindLabel(wind: SeatWind): string {
  return wind[0].toUpperCase() + wind.slice(1);
}
