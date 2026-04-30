import { describe, expect, it } from "vitest";
import { getSeatWind, nextSeatIndex, rotateDealerAfterHand } from "./winds";

describe("winds", () => {
  it("maps dealer-relative seats to Riichi seat winds", () => {
    expect(getSeatWind(0, 0)).toBe("east");
    expect(getSeatWind(1, 0)).toBe("south");
    expect(getSeatWind(2, 0)).toBe("west");
    expect(getSeatWind(3, 0)).toBe("north");
    expect(getSeatWind(0, 1)).toBe("north");
    expect(getSeatWind(1, 1)).toBe("east");
  });

  it("advances counterclockwise through seats", () => {
    expect(nextSeatIndex(0)).toBe(1);
    expect(nextSeatIndex(3)).toBe(0);
  });

  it("keeps dealer on renchan and rotates otherwise", () => {
    expect(rotateDealerAfterHand(2, true)).toBe(2);
    expect(rotateDealerAfterHand(2, false)).toBe(3);
  });
});
