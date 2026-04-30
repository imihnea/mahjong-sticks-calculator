import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GameState } from "@/domain/types";
import { AppShell } from "./AppShell";

const { loadSavedGame, saveGame } = vi.hoisted(() => ({
  loadSavedGame: vi.fn<() => Promise<GameState | null>>(),
  saveGame: vi.fn<(game: GameState) => Promise<void>>()
}));

vi.mock("@/storage/gameStorage", () => ({
  loadSavedGame,
  saveGame
}));

describe("AppShell", () => {
  beforeEach(() => {
    loadSavedGame.mockReset();
    saveGame.mockReset();
    saveGame.mockResolvedValue(undefined);
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
});
