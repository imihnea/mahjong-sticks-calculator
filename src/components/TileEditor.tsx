"use client";

import type { Tile } from "@/domain/types";

interface TileEditorProps {
  tiles: Tile[];
  onChange: (tiles: Tile[]) => void;
  label?: string;
}

const NUMBER_TILES: Tile[] = [
  ...Array.from({ length: 9 }, (_, index) => ({ suit: "man" as const, value: index + 1 })),
  { suit: "man", value: 5, red: true },
  ...Array.from({ length: 9 }, (_, index) => ({ suit: "pin" as const, value: index + 1 })),
  { suit: "pin", value: 5, red: true },
  ...Array.from({ length: 9 }, (_, index) => ({ suit: "sou" as const, value: index + 1 })),
  { suit: "sou", value: 5, red: true },
  ...Array.from({ length: 7 }, (_, index) => ({ suit: "honor" as const, value: index + 1 }))
];

export function TileEditor({ tiles, onChange, label = "Tiles" }: TileEditorProps) {
  return (
    <div className="tile-editor" role="group" aria-label={label}>
      <h3>{label}</h3>
      <div className="selected-tiles" aria-label={`${label} selected tiles`}>
        {tiles.map((tile, index) => (
          <span className="tile" key={`${tileLabel(tile)}-${index}`}>
            {tileLabel(tile)}
          </span>
        ))}
      </div>
      <div className="tile-editor-actions">
        <button type="button" onClick={() => onChange(tiles.slice(0, -1))} disabled={tiles.length === 0}>
          Backspace
        </button>
        <button type="button" onClick={() => onChange([])} disabled={tiles.length === 0}>
          Clear
        </button>
      </div>
      <div className="tile-keyboard">
        {NUMBER_TILES.map((tile) => (
          <button
            key={`${tile.suit}-${tile.value}-${tile.red ? "red" : "normal"}`}
            type="button"
            onClick={() => onChange([...tiles, tile])}
          >
            {tileLabel(tile)}
          </button>
        ))}
      </div>
    </div>
  );
}

function tileLabel(tile: Tile): string {
  if (tile.red) return `0${suitLabel(tile.suit)}`;
  return `${tile.value}${suitLabel(tile.suit)}`;
}

function suitLabel(suit: Tile["suit"]): string {
  if (suit === "man") return "m";
  if (suit === "pin") return "p";
  if (suit === "sou") return "s";
  return "z";
}
