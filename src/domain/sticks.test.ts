import { describe, expect, it } from "vitest";
import { createStickInventory, describeTransferSticks } from "./sticks";

describe("sticks", () => {
  it("converts a score into recommended physical sticks", () => {
    expect(createStickInventory(25000)).toEqual({ tenThousand: 2, fiveThousand: 1, thousand: 0, hundred: 0 });
    expect(createStickInventory(32800)).toEqual({ tenThousand: 3, fiveThousand: 0, thousand: 2, hundred: 8 });
  });

  it("describes exact transfers without change", () => {
    expect(describeTransferSticks(3900)).toEqual({
      amount: 3900,
      give: { tenThousand: 0, fiveThousand: 0, thousand: 3, hundred: 9 },
      change: { tenThousand: 0, fiveThousand: 0, thousand: 0, hundred: 0 },
      text: "Give 3 x 1000 and 9 x 100."
    });
  });
});
