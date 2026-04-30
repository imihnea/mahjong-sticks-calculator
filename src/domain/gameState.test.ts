import { describe, expect, it } from "vitest";
import { applyAbortiveDraw, applyDiceRoll, applyExhaustiveDraw, applyWin, createNewGame, declareRiichi, undoLastAction } from "./gameState";

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

  it("undoes the last state transition", () => {
    const game = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });
    const next = applyDiceRoll(game, { die1: 2, die2: 4 });

    const undone = undoLastAction(next);

    expect(undone.currentDice).toBeUndefined();
    expect(undone.history).toEqual([]);
    expect(undone.undoStack).toEqual([]);
    expect(() => undoLastAction(game)).toThrow("No action to undo.");
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
    const next = applyWin(withRiichi, [
      { winnerIndex: 2, payerIndexes: [0], amount: 8000 },
      { winnerIndex: 2, payerIndexes: [], amount: 1000 }
    ]);
    expect(next.riichiSticks).toBe(0);
    expect(next.honba).toBe(0);
  });

  it("rejects invalid win payment rows before mutating hand state", () => {
    const game = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });

    expect(() => applyWin(game, [])).toThrow("Win payments must include at least one player payment.");
    expect(() => applyWin(game, [{ winnerIndex: 4, payerIndexes: [0], amount: 8000 }])).toThrow("Player index must be between 0 and 3.");
    expect(() => applyWin(game, [{ winnerIndex: 1, payerIndexes: [4], amount: 8000 }])).toThrow("Player index must be between 0 and 3.");
    expect(() => applyWin(game, [{ winnerIndex: 1, payerIndexes: [0, 0], amount: 8000 }])).toThrow("Win payment payers must be unique.");
    expect(() => applyWin(game, [{ winnerIndex: 1, payerIndexes: [1], amount: 8000 }])).toThrow("Winner cannot pay their own win payment.");
    expect(() => applyWin(game, [{ winnerIndex: 1, payerIndexes: [0, 2], amount: 8000 }])).toThrow(
      "Win payment rows must have one payer, or no payer for riichi pool rows."
    );
    expect(() => applyWin(game, [{ winnerIndex: 1, payerIndexes: [0], amount: -8000 }])).toThrow(
      "Payment must be a positive multiple of 100."
    );
    expect(() => applyWin(game, [{ winnerIndex: 1, payerIndexes: [], amount: 1000 }])).toThrow(
      "Win payments must include at least one player payment."
    );
    expect(() =>
      applyWin(game, [
        { winnerIndex: 1, payerIndexes: [0], amount: 8000 },
        { winnerIndex: 1, payerIndexes: [], amount: 1000 }
      ])
    ).toThrow("Riichi pool payment cannot exceed the riichi sticks on the table.");

    const withTwoRiichi = declareRiichi(declareRiichi(game, game.players[2].id), game.players[3].id);
    expect(() =>
      applyWin(withTwoRiichi, [
        { winnerIndex: 1, payerIndexes: [0], amount: 8000 },
        { winnerIndex: 1, payerIndexes: [], amount: 1000 }
      ])
    ).toThrow("Riichi pool payment must equal the riichi sticks on the table.");
    expect(() =>
      applyWin(withTwoRiichi, [
        { winnerIndex: 1, payerIndexes: [0], amount: 8000 },
        { winnerIndex: 0, payerIndexes: [], amount: 2000 }
      ])
    ).toThrow("Riichi pool recipient must be a winning player.");
    expect(game.handNumber).toBe(1);
    expect(game.riichiSticks).toBe(0);
  });

  it("rotates dealer and advances the hand after a non-dealer win", () => {
    const game = applyDiceRoll(createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] }), { die1: 1, die2: 2 });

    const next = applyWin(game, [{ winnerIndex: 2, payerIndexes: [0], amount: 8000 }]);

    expect(next.dealerIndex).toBe(1);
    expect(next.handNumber).toBe(2);
    expect(next.roundWind).toBe("east");
    expect(next.players[1].seatWind).toBe("east");
    expect(next.currentDice).toBeUndefined();
  });

  it("ends on tobi and at target after the scheduled final hand", () => {
    const eastGame = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });
    const tobiGame = {
      ...eastGame,
      players: eastGame.players.map((player, index) => (index === 0 ? { ...player, score: 1000 } : player))
    };
    expect(applyWin(tobiGame, [{ winnerIndex: 1, payerIndexes: [0], amount: 2000 }]).ended).toBe(true);

    const east2 = applyWin(eastGame, [{ winnerIndex: 1, payerIndexes: [0], amount: 8000 }]);
    const east3 = applyWin(east2, [{ winnerIndex: 2, payerIndexes: [1], amount: 8000 }]);
    const east4 = applyWin(east3, [{ winnerIndex: 3, payerIndexes: [2], amount: 8000 }]);

    const ended = applyWin(east4, [{ winnerIndex: 1, payerIndexes: [3], amount: 8000 }]);

    expect(ended.ended).toBe(true);
    expect(ended.roundWind).toBe("south");
    expect(ended.handNumber).toBe(1);
  });

  it("extends past the scheduled final hand when nobody reaches target", () => {
    const game = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });
    const lowScoreGame = {
      ...game,
      handNumber: 4,
      players: game.players.map((player) => ({ ...player, score: 25000 }))
    };

    const next = applyWin(lowScoreGame, [{ winnerIndex: 1, payerIndexes: [0], amount: 1000 }]);

    expect(next.ended).toBe(false);
    expect(next.roundWind).toBe("south");
    expect(next.handNumber).toBe(1);
  });

  it("ends the scheduled final hand when the dealer continues and target is reached", () => {
    const game = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });
    const east4 = {
      ...game,
      handNumber: 4,
      players: game.players.map((player, index) => (index === 0 ? { ...player, score: 29000 } : player))
    };

    const dealerWin = applyWin(east4, [{ winnerIndex: 0, payerIndexes: [1], amount: 1000 }]);

    expect(dealerWin.ended).toBe(true);

    const dealerTenpai = applyExhaustiveDraw(east4, [east4.players[0].id]);

    expect(dealerTenpai.ended).toBe(true);
  });

  it("continues all-last dealer repeats until the dealer is first at target", () => {
    const game = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });
    const east4 = {
      ...game,
      handNumber: 4,
      players: game.players.map((player, index) => {
        if (index === 0) return { ...player, score: 26000 };
        if (index === 1) return { ...player, score: 32000 };
        return { ...player, score: 21000 };
      })
    };
    const south1 = { ...east4, roundWind: "south" as const, handNumber: 1 };

    const dealerWinBehind = applyWin(east4, [{ winnerIndex: 0, payerIndexes: [2], amount: 1000 }]);
    const extensionDealerTenpaiBehind = applyExhaustiveDraw(south1, [south1.players[0].id]);

    expect(dealerWinBehind.ended).toBe(false);
    expect(dealerWinBehind.handNumber).toBe(4);
    expect(extensionDealerTenpaiBehind.ended).toBe(false);
    expect(extensionDealerTenpaiBehind.roundWind).toBe("south");
  });

  it("ends after the maximum extension round when nobody reaches target", () => {
    const game = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });
    const south4 = {
      ...game,
      roundWind: "south" as const,
      handNumber: 4,
      players: game.players.map((player) => ({ ...player, score: 25000 }))
    };

    const next = applyWin(south4, [{ winnerIndex: 1, payerIndexes: [0], amount: 1000 }]);

    expect(next.ended).toBe(true);
  });

  it("advances round wind after a non-dealer win on the fourth hand", () => {
    const game = createNewGame({ gameLength: "south", playerNames: ["A", "B", "C", "D"] });
    const east2 = applyWin(game, [{ winnerIndex: 1, payerIndexes: [0], amount: 8000 }]);
    const east3 = applyWin(east2, [{ winnerIndex: 2, payerIndexes: [1], amount: 8000 }]);
    const east4 = applyWin(east3, [{ winnerIndex: 3, payerIndexes: [2], amount: 8000 }]);

    const south1 = applyWin(east4, [{ winnerIndex: 1, payerIndexes: [3], amount: 8000 }]);

    expect(south1.roundWind).toBe("south");
    expect(south1.handNumber).toBe(1);
    expect(south1.dealerIndex).toBe(0);
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
