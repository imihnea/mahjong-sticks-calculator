import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createNewGame } from "@/domain/gameState";
import { HandResultFlow } from "./HandResultFlow";

const game = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });

describe("HandResultFlow", () => {
  it("keeps Apply disabled until the winning hand is structurally valid", () => {
    renderWinFlow();

    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();

    chooseTiles("Concealed tiles", ["2m", "3m", "4m", "2p", "3p", "4p", "2s", "3s", "4s", "6m", "7m", "8m", "1z"]);
    chooseTiles("Winning tile", ["3m"]);

    expect(screen.getByRole("button", { name: "Apply" })).toBeEnabled();
  });

  it("keeps only one winning tile selected", () => {
    renderWinFlow();

    chooseTiles("Winning tile", ["1m", "2p"]);

    const winningTileRegion = screen.getByRole("group", { name: "Winning tile" });
    const selectedTiles = within(winningTileRegion).getByLabelText("Winning tile selected tiles");
    expect(within(selectedTiles).queryByText("1m")).not.toBeInTheDocument();
    expect(within(selectedTiles).getByText("2p")).toBeInTheDocument();
  });
});

function renderWinFlow() {
  render(
    <HandResultFlow
      game={game}
      mode="win"
      onClose={() => undefined}
      onApplyExhaustiveDraw={() => undefined}
      onApplyAbortiveDraw={() => undefined}
    />
  );
}

function chooseTiles(groupName: string, labels: string[]) {
  const group = screen.getByRole("group", { name: groupName });
  for (const label of labels) {
    fireEvent.click(within(group).getByRole("button", { name: label }));
  }
}
