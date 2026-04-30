import { describe, expect, it } from "vitest";
import { applyAbortiveDraw, applyDiceRoll, applyExhaustiveDraw, applyWin, createNewGame, declareRiichi } from "./gameState";

describe("gameState", () => {
  it("creates a Mahjong Soul East game with winds and dealer marker", () => {
    const game = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });

    expect(game.roundWind).toBe("east");
    expect(game.handNumber).toBe(1);
    expect(game.players.map((player) => player.seatWind)).toEqual(["east", "south", "west", "north"]);
    expect(game.players[0].isDealer).toBe(true);
    expect(game.players.every((player) => player.score === 25000)).toBe(true);
  });

  it("records dice roll without changing scores", () => {
    const game = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });
    const startingScores = game.players.map((player) => player.score);

    const next = applyDiceRoll(game, { die1: 2, die2: 4 });

    expect(next.currentDice?.diceTotal).toBe(6);
    expect(next.players.map((player) => player.score)).toEqual(startingScores);
    expect(next.history.at(-1)?.type).toBe("dice");
    expect(next.undoStack.at(-1)?.currentDice).toBeUndefined();
    expect(next.undoStack.at(-1)?.history).toEqual([]);
  });

  it("prevents riichi below 1000 and otherwise deposits a stick", () => {
    const game = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });
    const afterRiichi = declareRiichi(game, game.players[1].id);
    const brokeGame = {
      ...game,
      players: game.players.map((player, index) => (index === 2 ? { ...player, score: 900 } : player))
    };

    expect(afterRiichi.players[1].score).toBe(24000);
    expect(afterRiichi.players[1].riichi).toBe(true);
    expect(afterRiichi.riichiSticks).toBe(1);
    expect(afterRiichi.history.at(-1)).toEqual({ type: "riichi", playerId: game.players[1].id });
    expect(() => declareRiichi(brokeGame, game.players[2].id)).toThrow("A player under 1000 points cannot declare riichi.");
    expect(() => declareRiichi(afterRiichi, game.players[1].id)).toThrow("Player has already declared riichi.");
    expect(() => declareRiichi(game, "missing")).toThrow("Player not found.");
  });

  it("allows riichi at exactly 1000 points", () => {
    const game = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });
    const exactGame = {
      ...game,
      players: game.players.map((player, index) => (index === 2 ? { ...player, score: 1000 } : player))
    };

    const next = declareRiichi(exactGame, game.players[2].id);

    expect(next.players[2].score).toBe(0);
    expect(next.riichiSticks).toBe(1);
  });

  it("rotates dealer after non-tenpai dealer exhaustive draw", () => {
    const game = applyDiceRoll(createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] }), { die1: 1, die2: 2 });

    const next = applyExhaustiveDraw(game, [game.players[1].id]);

    expect(next.dealerIndex).toBe(1);
    expect(next.handNumber).toBe(2);
    expect(next.roundWind).toBe("east");
    expect(next.players[1].seatWind).toBe("east");
    expect(next.honba).toBe(1);
    expect(next.currentDice).toBeUndefined();
    expect(next.players.map((player) => player.score)).toEqual([24000, 28000, 24000, 24000]);
    expect(next.history.at(-1)).toEqual({ type: "exhaustive-draw", tenpaiPlayerIds: [game.players[1].id] });
  });

  it("keeps dealer after tenpai dealer exhaustive draw", () => {
    const game = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });

    const next = applyExhaustiveDraw(game, [game.players[0].id]);

    expect(next.dealerIndex).toBe(0);
    expect(next.handNumber).toBe(1);
    expect(next.players[0].seatWind).toBe("east");
  });

  it("clears active riichi state after exhaustive draw while keeping riichi sticks", () => {
    const game = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });
    const afterRiichi = declareRiichi(game, game.players[2].id);

    const next = applyExhaustiveDraw(afterRiichi, [afterRiichi.players[1].id]);

    expect(next.riichiSticks).toBe(1);
    expect(next.players.every((player) => !player.riichi)).toBe(true);
  });

  it("clears riichi sticks after a win", async () => {
    const game = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });
    const withRiichi = declareRiichi(game, game.players[1].id);
    const next = applyWin(withRiichi, [{ winnerIndex: 2, payerIndexes: [0], amount: 8000 }]);
    expect(next.riichiSticks).toBe(0);
    expect(next.honba).toBe(0);
  });

  it("advances round wind after four dealer rotations", () => {
    const game = createNewGame({ gameLength: "south", playerNames: ["A", "B", "C", "D"] });
    const east2 = applyExhaustiveDraw(game, [game.players[1].id]);
    const east3 = applyExhaustiveDraw(east2, [east2.players[2].id]);
    const east4 = applyExhaustiveDraw(east3, [east3.players[3].id]);
    const south1 = applyExhaustiveDraw(east4, [east4.players[1].id]);

    expect(south1.roundWind).toBe("south");
    expect(south1.handNumber).toBe(1);
  });

  it("rejects invalid or duplicate tenpai players", () => {
    const game = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });

    expect(() => applyExhaustiveDraw(game, ["missing"])).toThrow("Player not found.");
    expect(() => applyExhaustiveDraw(game, [game.players[1].id, game.players[1].id])).toThrow("Tenpai players must be unique.");
  });

  it("keeps dealer on abortive draw", () => {
    const game = applyDiceRoll(createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] }), { die1: 1, die2: 1 });

    const next = applyAbortiveDraw(game, "suufuu-renda");

    expect(next.dealerIndex).toBe(0);
    expect(next.honba).toBe(1);
    expect(next.currentDice).toBeUndefined();
    expect(next.history.at(-1)).toEqual({ type: "abortive-draw", drawType: "suufuu-renda" });
  });

  it("clears active riichi state after abortive draw while keeping riichi sticks", () => {
    const game = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });
    const afterRiichi = declareRiichi(game, game.players[3].id);

    const next = applyAbortiveDraw(afterRiichi, "suucha-riichi");

    expect(next.riichiSticks).toBe(1);
    expect(next.players.every((player) => !player.riichi)).toBe(true);
  });
});
