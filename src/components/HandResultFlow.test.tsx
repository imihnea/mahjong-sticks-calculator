import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
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

  it("uses selected winner, discarder, and ron type when applying a win", async () => {
    const onApplyWin = createOnApplyWinMock();
    renderWinFlow({ onApplyWin });

    fireEvent.click(within(screen.getByRole("group", { name: "Winner" })).getByRole("button", { name: "C" }));
    fireEvent.click(within(screen.getByRole("group", { name: "Discarder" })).getByRole("button", { name: "A" }));
    chooseTiles("Concealed tiles", ["3m", "4m", "6m", "7m", "8m", "2p", "3p", "4p", "3s", "4s", "5s", "5s", "5s"]);
    chooseTiles("Winning tile", ["2m"]);

    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    await waitFor(() => {
      expect(onApplyWin).toHaveBeenCalledWith(
        [{ winnerIndex: 2, payerIndexes: [0], amount: 2000 }],
        [
          expect.objectContaining({
            winnerId: game.players[2].id,
            winType: "ron",
            discarderId: game.players[0].id
          })
        ]
      );
    });
  });

  it("applies tsumo payments without a discarder", async () => {
    const onApplyWin = createOnApplyWinMock();
    renderWinFlow({ onApplyWin });

    fireEvent.click(within(screen.getByRole("group", { name: "Winner" })).getByRole("button", { name: "B" }));
    fireEvent.click(within(screen.getByRole("group", { name: "Win type" })).getByRole("button", { name: "Tsumo" }));
    expect(screen.queryByRole("group", { name: "Discarder" })).not.toBeInTheDocument();
    chooseTiles("Concealed tiles", ["3m", "4m", "6m", "7m", "8m", "2p", "3p", "4p", "3s", "4s", "5s", "5s", "5s"]);
    chooseTiles("Winning tile", ["2m"]);

    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    await waitFor(() => {
      expect(onApplyWin).toHaveBeenCalledWith(
        [
          { winnerIndex: 1, payerIndexes: [0], amount: 1300 },
          { winnerIndex: 1, payerIndexes: [2], amount: 700 },
          { winnerIndex: 1, payerIndexes: [3], amount: 700 }
        ],
        [
          expect.objectContaining({
            winnerId: game.players[1].id,
            winType: "tsumo"
          })
        ]
      );
    });
    expect(onApplyWin.mock.calls[0]?.[1]?.[0]).not.toHaveProperty("discarderId");
  });

  it("lets the user mark any combination of exhaustive draw tenpai players", () => {
    const onApplyExhaustiveDraw = vi.fn();
    render(
      <HandResultFlow
        game={game}
        mode="draw"
        onClose={() => undefined}
        onApplyExhaustiveDraw={onApplyExhaustiveDraw}
        onApplyAbortiveDraw={() => undefined}
      />
    );

    fireEvent.click(screen.getByLabelText("A tenpai"));
    fireEvent.click(screen.getByLabelText("C tenpai"));
    fireEvent.click(screen.getByRole("button", { name: "Apply draw" }));

    expect(onApplyExhaustiveDraw).toHaveBeenCalledWith([game.players[0].id, game.players[2].id]);
  });
});

function renderWinFlow(props: Partial<ComponentProps<typeof HandResultFlow>> = {}) {
  render(
    <HandResultFlow
      game={game}
      mode="win"
      onClose={() => undefined}
      onApplyExhaustiveDraw={() => undefined}
      onApplyAbortiveDraw={() => undefined}
      {...props}
    />
  );
}

function createOnApplyWinMock() {
  return vi.fn<NonNullable<ComponentProps<typeof HandResultFlow>["onApplyWin"]>>(() => game);
}

function chooseTiles(groupName: string, labels: string[]) {
  const group = screen.getByRole("group", { name: groupName });
  for (const label of labels) {
    fireEvent.click(within(group).getByRole("button", { name: label }));
  }
}
