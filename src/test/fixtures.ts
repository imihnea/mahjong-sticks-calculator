import { createNewGame } from "@/domain/gameState";

export function createStartedEastGame() {
  return createNewGame({ gameLength: "east", playerNames: ["East", "South", "West", "North"] });
}
