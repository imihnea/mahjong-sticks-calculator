import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DicePanel } from "./DicePanel";

describe("DicePanel", () => {
  it("disables apply while dice values are invalid", () => {
    render(<DicePanel onApply={() => undefined} onClose={() => undefined} />);

    fireEvent.change(screen.getByLabelText("Die 1"), { target: { value: "" } });
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Die 1"), { target: { value: "7" } });
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
  });

  it("applies valid dice values", () => {
    const onApply = vi.fn();
    render(<DicePanel onApply={onApply} onClose={() => undefined} />);

    fireEvent.change(screen.getByLabelText("Die 1"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Die 2"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(onApply).toHaveBeenCalledWith({ die1: 2, die2: 5 });
  });
});
