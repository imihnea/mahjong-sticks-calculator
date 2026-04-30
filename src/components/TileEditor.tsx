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
            <TileFace tile={tile} />
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
            aria-label={tileLabel(tile)}
            className="tile-button"
            key={`${tile.suit}-${tile.value}-${tile.red ? "red" : "normal"}`}
            type="button"
            onClick={() => onChange([...tiles, tile])}
          >
            <TileFace tile={tile} />
          </button>
        ))}
      </div>
    </div>
  );
}

function TileFace({ tile }: { tile: Tile }) {
  const label = tileLabel(tile);

  return (
    <svg
      aria-label={`${label} tile`}
      className={`tile-face tile-face-${tile.suit}${tile.red ? " tile-face-red" : ""}`}
      focusable="false"
      role="img"
      viewBox="0 0 56 78"
    >
      <rect className="tile-face-shadow" height="72" rx="7" width="50" x="5" y="5" />
      <rect className="tile-face-body" height="72" rx="7" width="50" x="2" y="2" />
      {tile.suit === "pin" ? renderPinFace(tile) : null}
      {tile.suit === "sou" ? renderSouFace(tile) : null}
      {tile.suit === "man" ? renderManFace(tile) : null}
      {tile.suit === "honor" ? renderHonorFace(tile) : null}
    </svg>
  );
}

function renderPinFace(tile: Tile) {
  return tilePositions(tile.value).map(([cx, cy], index) => (
    <g className={`tile-pip ${isRedFiveCenter(tile, index) ? "tile-pip-red" : pipColorClass(index)}`} key={`${cx}-${cy}`}>
      <circle cx={cx} cy={cy} r="6.4" />
      <circle className="tile-pip-core" cx={cx} cy={cy} r="2.5" />
    </g>
  ));
}

function renderSouFace(tile: Tile) {
  return tilePositions(tile.value).map(([cx, cy], index) => (
    <g className={`tile-bamboo ${isRedFiveCenter(tile, index) ? "tile-bamboo-red" : bambooColorClass(index)}`} key={`${cx}-${cy}`}>
      <rect height="18" rx="3.6" width="7.4" x={cx - 3.7} y={cy - 9} />
      <line x1={cx} x2={cx} y1={cy - 6.4} y2={cy + 6.4} />
    </g>
  ));
}

function renderManFace(tile: Tile) {
  return (
    <>
      <text className={tile.red ? "tile-man-number tile-man-red" : "tile-man-number"} textAnchor="middle" x="28" y="35">
        {MAN_NUMERALS[tile.value]}
      </text>
      <text className="tile-man-suit" textAnchor="middle" x="28" y="58">
        {MAN_SUIT}
      </text>
    </>
  );
}

function renderHonorFace(tile: Tile) {
  const className = `tile-honor tile-honor-${tile.value}`;
  if (tile.value === 5) {
    return (
      <>
        <rect className="tile-white-dragon-frame" height="38" rx="4" width="30" x="13" y="20" />
        <text className={className} textAnchor="middle" x="28" y="48">
          {HONOR_GLYPHS[tile.value]}
        </text>
      </>
    );
  }

  return (
    <text className={className} textAnchor="middle" x="28" y="50">
      {HONOR_GLYPHS[tile.value]}
    </text>
  );
}

function tilePositions(value: number): Array<[number, number]> {
  const positions: Record<number, Array<[number, number]>> = {
    1: [[28, 39]],
    2: [
      [20, 28],
      [36, 50]
    ],
    3: [
      [20, 27],
      [28, 39],
      [36, 51]
    ],
    4: [
      [19, 27],
      [37, 27],
      [19, 51],
      [37, 51]
    ],
    5: [
      [19, 25],
      [37, 25],
      [28, 39],
      [19, 53],
      [37, 53]
    ],
    6: [
      [19, 24],
      [37, 24],
      [19, 39],
      [37, 39],
      [19, 54],
      [37, 54]
    ],
    7: [
      [19, 22],
      [37, 22],
      [28, 34],
      [19, 45],
      [37, 45],
      [19, 58],
      [37, 58]
    ],
    8: [
      [19, 21],
      [37, 21],
      [19, 33],
      [37, 33],
      [19, 45],
      [37, 45],
      [19, 57],
      [37, 57]
    ],
    9: [
      [18, 22],
      [28, 22],
      [38, 22],
      [18, 39],
      [28, 39],
      [38, 39],
      [18, 56],
      [28, 56],
      [38, 56]
    ]
  };

  return positions[value] ?? [];
}

function pipColorClass(index: number): string {
  return index % 3 === 0 ? "tile-pip-green" : index % 3 === 1 ? "tile-pip-blue" : "tile-pip-red";
}

function bambooColorClass(index: number): string {
  return index % 2 === 0 ? "tile-bamboo-green" : "tile-bamboo-blue";
}

function isRedFiveCenter(tile: Tile, index: number): boolean {
  return Boolean(tile.red && tile.value === 5 && index === 2);
}

const MAN_NUMERALS: Record<number, string> = {
  1: "\u4E00",
  2: "\u4E8C",
  3: "\u4E09",
  4: "\u56DB",
  5: "\u4E94",
  6: "\u516D",
  7: "\u4E03",
  8: "\u516B",
  9: "\u4E5D"
};

const MAN_SUIT = "\u842C";

const HONOR_GLYPHS: Record<number, string> = {
  1: "\u6771",
  2: "\u5357",
  3: "\u897F",
  4: "\u5317",
  5: "\u767D",
  6: "\u767C",
  7: "\u4E2D"
};

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
