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
    expect(screen.queryByText("3900")).not.toBeInTheDocument();
    const immediatePayment = screen.getByLabelText("A pays B sticks");
    expect(within(immediatePayment).getAllByRole("img", { name: "1000-point stick" })).toHaveLength(3);
    expect(within(immediatePayment).getAllByRole("img", { name: "100-point stick" })).toHaveLength(9);
    expect(screen.getByText("Give to B")).toBeInTheDocument();
    expect(screen.getByText("Receive from A")).toBeInTheDocument();
    expect(screen.getByLabelText("A payment summary")).toHaveClass("payment-seat-east");
    expect(screen.getByLabelText("B payment summary")).toHaveClass("payment-seat-south");
    expect(within(screen.getByLabelText("B payment summary")).getByText("B")).toBeInTheDocument();
    const bInventory = screen.getByLabelText("B stick inventory worth 28900 points");
    expect(within(bInventory).getAllByRole("img", { name: "10000-point stick" })).toHaveLength(2);
    expect(within(bInventory).getAllByRole("img", { name: "5000-point stick" })).toHaveLength(1);
    expect(within(bInventory).getAllByRole("img", { name: "1000-point stick" })).toHaveLength(3);
    expect(within(bInventory).getAllByRole("img", { name: "100-point stick" })).toHaveLength(9);
    expect(screen.queryByText("28900")).not.toBeInTheDocument();
  });

  it("shows negative scores without trying to render impossible stick inventory", () => {
    render(<ResultPanel transfers={[]} inventories={[{ playerName: "A", score: -1200, seatWind: "east" }]} onClose={() => undefined} />);

    expect(within(screen.getByLabelText("A payment summary")).getByText("A")).toBeInTheDocument();
    expect(screen.queryByText("-1200")).not.toBeInTheDocument();
    expect(screen.getByText("Debt: 1200 points")).toBeInTheDocument();
  });
});
