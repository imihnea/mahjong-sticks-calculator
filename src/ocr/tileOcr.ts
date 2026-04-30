import type { Tile } from "@/domain/types";

export interface TileOcrResult {
  text: string;
  tiles: Tile[];
  confidence?: number;
}

type Recognizer = (image: string) => Promise<{ text: string; confidence?: number }>;

export function parseTileCodes(text: string): Tile[] {
  return Array.from(text.matchAll(/\b(0[mps]|[1-9][mps]|[1-7]z)\b/gi), (match) => parseTileCode(match[1])).filter(
    (tile): tile is Tile => tile !== null
  );
}

export async function recognizeTileCodesFromImage(image: string, recognizer: Recognizer = recognizeWithTesseract): Promise<TileOcrResult> {
  const result = await recognizer(image);
  return {
    text: result.text,
    confidence: result.confidence,
    tiles: parseTileCodes(result.text)
  };
}

function parseTileCode(code: string): Tile | null {
  const normalized = code.toLowerCase();
  const suitCode = normalized.at(-1);
  const valueCode = normalized.slice(0, -1);
  const value = Number(valueCode === "0" ? 5 : valueCode);

  if (suitCode === "m" && value >= 1 && value <= 9) return { suit: "man", value, ...(valueCode === "0" ? { red: true } : {}) };
  if (suitCode === "p" && value >= 1 && value <= 9) return { suit: "pin", value, ...(valueCode === "0" ? { red: true } : {}) };
  if (suitCode === "s" && value >= 1 && value <= 9) return { suit: "sou", value, ...(valueCode === "0" ? { red: true } : {}) };
  if (suitCode === "z" && value >= 1 && value <= 7) return { suit: "honor", value };
  return null;
}

async function recognizeWithTesseract(image: string): Promise<{ text: string; confidence?: number }> {
  const { recognize } = await import("tesseract.js");
  const result = await recognize(image, "eng");
  return { text: result.data.text, confidence: result.data.confidence };
}
