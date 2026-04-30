import { render, screen } from "@testing-library/react";
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
    expect(screen.getByText("East")).toBeInTheDocument();
    expect(screen.getByText("Dealer")).toBeInTheDocument();
    expect(screen.getAllByText("25000")).toHaveLength(4);
    expect(screen.getByText("East 1")).toBeInTheDocument();
  });
});
