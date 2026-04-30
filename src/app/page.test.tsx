import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "./page";

vi.mock("@/storage/gameStorage", () => ({
  loadSavedGame: () => new Promise<null>(() => undefined),
  saveGame: vi.fn()
}));

describe("HomePage", () => {
  it("renders through Vitest with the React automatic JSX runtime", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { name: "Loading saved table" })).toBeInTheDocument();
  });
});
