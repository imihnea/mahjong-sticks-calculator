import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResultPanel } from "./ResultPanel";

describe("ResultPanel", () => {
  it("shows payment instructions and stick inventory", () => {
    render(
      <ResultPanel
        transfers={[{ from: "A", to: "B", amount: 3900 }]}
        inventories={[{ playerName: "B", score: 28900 }]}
        onClose={() => undefined}
      />
    );
    expect(screen.getByText("A pays B")).toBeInTheDocument();
    expect(screen.getByText("3900")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("28900")).toBeInTheDocument();
  });
});
