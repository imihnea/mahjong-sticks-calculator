import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createNewGame } from "@/domain/gameState";
import type { GameState } from "@/domain/types";
import { AppShell } from "./AppShell";

const { clearSavedGame, loadSavedGame, saveGame } = vi.hoisted(() => ({
  loadSavedGame: vi.fn<() => Promise<GameState | null>>(),
  saveGame: vi.fn<(game: GameState) => Promise<void>>(),
  clearSavedGame: vi.fn<() => Promise<void>>()
}));

vi.mock("@/storage/gameStorage", () => ({
  clearSavedGame,
  loadSavedGame,
  saveGame
}));

describe("AppShell", () => {
  beforeEach(() => {
    loadSavedGame.mockReset();
    saveGame.mockReset();
    clearSavedGame.mockReset();
    saveGame.mockResolvedValue(undefined);
    clearSavedGame.mockResolvedValue(undefined);
  });

  it("waits for saved game loading before showing new game controls", async () => {
    let resolveLoad!: (game: GameState | null) => void;
    loadSavedGame.mockReturnValue(
      new Promise((resolve) => {
        resolveLoad = resolve;
      })
    );

    render(<AppShell />);

    expect(screen.getByText("Loading saved table")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start East Game" })).not.toBeInTheDocument();

    await act(async () => {
      resolveLoad(null);
    });

    expect(await screen.findByRole("button", { name: "Start East Game" })).toBeInTheDocument();
  });

  it("saves a newly created game after loading completes", async () => {
    loadSavedGame.mockResolvedValue(null);

    render(<AppShell />);

    fireEvent.click(await screen.findByRole("button", { name: "Start East Game" }));

    expect(await screen.findByText("East 1")).toBeInTheDocument();
    expect(saveGame).toHaveBeenCalledWith(expect.objectContaining({ gameLength: "east" }));
  });

  it("applies a dice roll, closes the flow, and saves the updated game", async () => {
    loadSavedGame.mockResolvedValue(createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] }));
    render(<AppShell />);
    await screen.findByText("East 1");
    saveGame.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Roll dice" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(await screen.findByText("Break South's wall after 2 stacks from the right.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Roll dice" })).not.toBeInTheDocument();
    await waitFor(() => {
      expect(saveGame).toHaveBeenCalledWith(
        expect.objectContaining({ currentDice: expect.objectContaining({ diceTotal: 2 }) })
      );
    });
  });

  it("undoes the last action and starts a new game from the table", async () => {
    loadSavedGame.mockResolvedValue(createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] }));
    render(<AppShell />);
    await screen.findByText("East 1");

    fireEvent.click(screen.getByRole("button", { name: "Roll dice" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(await screen.findByText("Break South's wall after 2 stacks from the right.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    await waitFor(() => {
      expect(screen.queryByText("Break South's wall after 2 stacks from the right.")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "New game" }));
    expect(await screen.findByRole("button", { name: "Start East Game" })).toBeInTheDocument();
    expect(clearSavedGame).toHaveBeenCalled();
  });

  it("saves a replacement game only after the previous saved game is cleared", async () => {
    let resolveClear!: () => void;
    let clearResolved = false;
    const savedGame = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });
    const savesBeforeClear: GameState[] = [];
    loadSavedGame.mockResolvedValue(savedGame);
    clearSavedGame.mockReturnValue(
      new Promise((resolve) => {
        resolveClear = () => {
          clearResolved = true;
          resolve();
        };
      })
    );
    saveGame.mockImplementation(async (game) => {
      if (!clearResolved) savesBeforeClear.push(game);
    });

    render(<AppShell />);
    await screen.findByText("East 1");
    saveGame.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "New game" }));
    fireEvent.click(await screen.findByRole("button", { name: "Start East Game" }));
    expect(await screen.findByText("East 1")).toBeInTheDocument();
    await act(async () => undefined);

    expect(savesBeforeClear).toEqual([]);

    await act(async () => {
      resolveClear();
    });

    await waitFor(() => {
      expect(saveGame).toHaveBeenCalledWith(expect.objectContaining({ id: expect.not.stringMatching(savedGame.id) }));
    });
  });

  it("applies an exhaustive draw, closes the flow, and saves the updated game", async () => {
    loadSavedGame.mockResolvedValue(createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] }));
    render(<AppShell />);
    await screen.findByText("East 1");
    saveGame.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Draw" }));
    fireEvent.click(screen.getByLabelText("B tenpai"));
    fireEvent.click(screen.getByRole("button", { name: "Apply draw" }));

    expect(await screen.findByText("East 2")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Exhaustive draw" })).not.toBeInTheDocument();
    await waitFor(() => {
      expect(saveGame).toHaveBeenCalledWith(expect.objectContaining({ handNumber: 2, honba: 1 }));
    });
  });

  it("applies an abortive draw, closes the flow, and saves the updated game", async () => {
    loadSavedGame.mockResolvedValue(createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] }));
    render(<AppShell />);
    await screen.findByText("East 1");
    saveGame.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Abortive draw" }));
    fireEvent.click(screen.getByRole("button", { name: "Kyuushu kyuuhai" }));

    expect(await screen.findByText("1 honba")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Abortive draw" })).not.toBeInTheDocument();
    await waitFor(() => {
      expect(saveGame).toHaveBeenCalledWith(expect.objectContaining({ honba: 1 }));
    });
  });
});
