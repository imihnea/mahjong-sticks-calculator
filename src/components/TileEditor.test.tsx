import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TileEditor } from "./TileEditor";

describe("TileEditor", () => {
  it("adds selected tiles and reports them", () => {
    const onChange = vi.fn();
    render(<TileEditor tiles={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText("1m"));
    expect(onChange).toHaveBeenCalledWith([{ suit: "man", value: 1 }]);
  });

  it("shows red fives separately", () => {
    render(<TileEditor tiles={[]} onChange={() => undefined} />);
    expect(screen.getByText("0m")).toBeInTheDocument();
    expect(screen.getByText("0p")).toBeInTheDocument();
    expect(screen.getByText("0s")).toBeInTheDocument();
  });
});
