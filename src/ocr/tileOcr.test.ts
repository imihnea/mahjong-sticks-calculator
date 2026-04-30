import { describe, expect, it, vi } from "vitest";
import { parseTileCodes, recognizeTileCodesFromImage } from "./tileOcr";

describe("tile OCR", () => {
  it("parses tile codes from OCR text", () => {
    expect(parseTileCodes("2m 3m 4m 0p 5s 7z")).toEqual([
      { suit: "man", value: 2 },
      { suit: "man", value: 3 },
      { suit: "man", value: 4 },
      { suit: "pin", value: 5, red: true },
      { suit: "sou", value: 5 },
      { suit: "honor", value: 7 }
    ]);
  });

  it("runs injected OCR and returns parsed tiles", async () => {
    const recognize = vi.fn().mockResolvedValue({ text: "1m 2m 3m 4p" });

    const result = await recognizeTileCodesFromImage("data:image/png;base64,test", recognize);

    expect(recognize).toHaveBeenCalledWith("data:image/png;base64,test");
    expect(result.tiles).toEqual([
      { suit: "man", value: 1 },
      { suit: "man", value: 2 },
      { suit: "man", value: 3 },
      { suit: "pin", value: 4 }
    ]);
  });
});
