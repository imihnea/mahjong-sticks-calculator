import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createNewGame } from "@/domain/gameState";
import { TableView } from "./TableView";

describe("TableView", () => {
  it("shows each player score, wind, and dealer marker", () => {
    const game = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });
    render(
      <TableView
        game={game}
        onRollDice={() => undefined}
        onWin={() => undefined}
        onDraw={() => undefined}
        onAbortiveDraw={() => undefined}
        onRiichi={() => undefined}
      />
    );

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("East 1")).toBeInTheDocument();
    expect(screen.getAllByText("Dealer")).toHaveLength(1);
    expect(screen.getAllByText("25000")).toHaveLength(4);

    [
      ["A", "East"],
      ["B", "South"],
      ["C", "West"],
      ["D", "North"]
    ].forEach(([name, wind]) => {
      const seat = screen.getByText(name).closest("article");
      expect(seat).not.toBeNull();
      expect(within(seat as HTMLElement).getByText(wind)).toBeInTheDocument();
      expect(within(seat as HTMLElement).getByText("25000")).toBeInTheDocument();
    });

    ["Roll dice", "Win", "Draw", "Abortive draw"].forEach((name) => {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    });
  });
});
