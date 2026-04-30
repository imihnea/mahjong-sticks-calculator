import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TileEditor } from "./TileEditor";

describe("TileEditor", () => {
  it("adds selected tiles and reports them", () => {
    const onChange = vi.fn();
    render(<TileEditor tiles={[]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "1m" }));
    expect(onChange).toHaveBeenCalledWith([{ suit: "man", value: 1 }]);
  });

  it("renders tile choices as pictures while keeping their keyboard names", () => {
    render(<TileEditor tiles={[]} onChange={() => undefined} />);

    const oneMan = screen.getByRole("button", { name: "1m" });
    const redMan = screen.getByRole("button", { name: "0m" });
    const redPin = screen.getByRole("button", { name: "0p" });
    const redSou = screen.getByRole("button", { name: "0s" });

    expect(within(oneMan).getByRole("img", { name: "1m tile" })).toBeInTheDocument();
    expect(within(redMan).getByRole("img", { name: "0m tile" })).toBeInTheDocument();
    expect(within(redPin).getByRole("img", { name: "0p tile" })).toBeInTheDocument();
    expect(within(redSou).getByRole("img", { name: "0s tile" })).toBeInTheDocument();
    expect(oneMan).not.toHaveTextContent("1m");
  });

  it("removes the last selected tile and can clear the selection", () => {
    const onChange = vi.fn();
    render(<TileEditor tiles={[{ suit: "man", value: 1 }, { suit: "pin", value: 2 }]} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Backspace" }));
    expect(onChange).toHaveBeenCalledWith([{ suit: "man", value: 1 }]);

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("renders selected tiles as pictures instead of tile codes", () => {
    render(<TileEditor tiles={[{ suit: "pin", value: 2 }]} onChange={() => undefined} />);

    const selectedTiles = screen.getByLabelText("Tiles selected tiles");

    expect(within(selectedTiles).getByRole("img", { name: "2p tile" })).toBeInTheDocument();
    expect(selectedTiles).not.toHaveTextContent("2p");
  });
});
