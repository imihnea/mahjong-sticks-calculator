import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NewGamePanel } from "./NewGamePanel";

describe("NewGamePanel", () => {
  it("creates a game with the names entered for each initial wind", () => {
    const onCreateGame = vi.fn();
    render(<NewGamePanel onCreateGame={onCreateGame} />);

    fireEvent.change(screen.getByLabelText("East player name"), { target: { value: "Mihnea" } });
    fireEvent.change(screen.getByLabelText("South player name"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("West player name"), { target: { value: "Radu" } });
    fireEvent.change(screen.getByLabelText("North player name"), { target: { value: "Ioana" } });
    fireEvent.click(screen.getByRole("button", { name: "Start East Game" }));

    expect(onCreateGame).toHaveBeenCalledWith({
      gameLength: "east",
      playerNames: ["Mihnea", "Ana", "Radu", "Ioana"]
    });
  });
});
