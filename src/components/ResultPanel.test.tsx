import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResultPanel } from "./ResultPanel";

describe("ResultPanel", () => {
  it("shows payment instructions and stick inventory", () => {
    render(
      <ResultPanel
        transfers={[{ from: "A", to: "B", amount: 3900 }]}
        inventories={[
          { playerName: "A", score: 21100, seatWind: "east" },
          { playerName: "B", score: 28900, seatWind: "south" }
        ]}
        onClose={() => undefined}
      />
    );
    expect(screen.getByText("A pays B")).toBeInTheDocument();
    expect(screen.getByText("3900")).toBeInTheDocument();
    expect(screen.getByText("Give to B")).toBeInTheDocument();
    expect(screen.getByText("Receive from A")).toBeInTheDocument();
    expect(screen.getByLabelText("A payment summary")).toHaveClass("payment-seat-east");
    expect(screen.getByLabelText("B payment summary")).toHaveClass("payment-seat-south");
    expect(within(screen.getByLabelText("B payment summary")).getByText("B")).toBeInTheDocument();
    expect(screen.getByText("28900")).toBeInTheDocument();
  });

  it("shows negative scores without trying to render impossible stick inventory", () => {
    render(<ResultPanel transfers={[]} inventories={[{ playerName: "A", score: -1200, seatWind: "east" }]} onClose={() => undefined} />);

    expect(within(screen.getByLabelText("A payment summary")).getByText("A")).toBeInTheDocument();
    expect(screen.getByText("-1200")).toBeInTheDocument();
    expect(screen.getByText("Debt: 1200 points")).toBeInTheDocument();
  });
});
