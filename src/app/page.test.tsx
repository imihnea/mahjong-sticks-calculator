import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("HomePage", () => {
  it("renders through Vitest with the React automatic JSX runtime", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { name: "Mahjong Sticks Calculator" })).toBeInTheDocument();
  });
});
