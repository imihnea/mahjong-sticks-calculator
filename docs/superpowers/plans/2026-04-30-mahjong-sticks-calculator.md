# Mahjong Sticks Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first Riichi Mahjong table tracker that calculates Mahjong Soul Ranked 4P payments and shows physical point-stick transfers.

**Architecture:** Use a static-friendly Next.js app with focused TypeScript domain modules for game state, wall break, rule progression, stick math, and scoring. Keep scoring and Mahjong Soul table rules behind adapters so UI components stay simple and domain behavior is unit-tested before it is wired into the app.

**Tech Stack:** Next.js, React, TypeScript, Vitest, Testing Library, IndexedDB via `idb`, Lucide React icons, browser `getUserMedia`, Vercel.

---

## File Structure

Create these files:

- `package.json`: scripts, dependencies, and dev dependencies.
- `tsconfig.json`: strict TypeScript config with `@/*` alias.
- `next.config.ts`: Next.js config.
- `vitest.config.ts`: Vitest + jsdom config.
- `src/app/layout.tsx`: app shell metadata.
- `src/app/page.tsx`: main app entry.
- `src/app/globals.css`: global responsive app styling.
- `src/domain/types.ts`: shared domain types.
- `src/domain/mahjongSoulRules.ts`: fixed Mahjong Soul Ranked 4P preset.
- `src/domain/winds.ts`: seat wind and round helpers.
- `src/domain/wallBreak.ts`: dice-to-wall-break logic.
- `src/domain/sticks.ts`: stick inventory and transfer decomposition.
- `src/domain/payments.ts`: payment deltas for ron, tsumo, draws, honba, and riichi deposits.
- `src/domain/gameState.ts`: new game creation and event application.
- `src/domain/scoring.ts`: scoring adapter boundary and deterministic fallback shape.
- `src/storage/gameStorage.ts`: IndexedDB/localStorage persistence.
- `src/camera/useCameraCapture.ts`: camera capture hook with upload fallback helpers.
- `src/components/AppShell.tsx`: high-level client component.
- `src/components/TableView.tsx`: four-player table with winds and dealer marker.
- `src/components/NewGamePanel.tsx`: East/South game creation.
- `src/components/DicePanel.tsx`: roll/enter dice and wall instruction.
- `src/components/HandResultFlow.tsx`: win/draw/abortive draw coordinator.
- `src/components/TileEditor.tsx`: mobile tile entry.
- `src/components/ResultPanel.tsx`: score breakdown, payment now, and stick inventory.
- `src/components/StickIcon.tsx`: visual point-stick representation.
- `src/test/fixtures.ts`: reusable domain fixtures.
- `src/domain/*.test.ts`: unit tests for each domain module.
- `src/components/*.test.tsx`: component smoke tests.

Modify no existing source files because the project currently contains only planning docs.

---

### Task 1: Scaffold Next.js, Tooling, And Base App

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `vitest.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "mahjong-sticks-calculator",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "idb": "^8.0.3",
    "lucide-react": "^0.468.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "riichi": "^1.0.6"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.2.0",
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "jsdom": "^25.0.1",
    "typescript": "^5.7.0",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`

Expected: `package-lock.json` is created and `node_modules` installs without dependency conflicts.

- [ ] **Step 3: Create TypeScript and Next config**

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true
};

export default nextConfig;
```

`vitest.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["@testing-library/jest-dom/vitest"]
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname
    }
  }
});
```

- [ ] **Step 4: Create base app files**

`src/app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mahjong Sticks Calculator",
  description: "Local Riichi Mahjong table tracker for physical point sticks"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f5d4a"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

`src/app/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <main className="app-frame">
      <section className="empty-state">
        <p className="eyebrow">Mahjong Soul Ranked 4P</p>
        <h1>Mahjong Sticks Calculator</h1>
        <p>Table tracker, scoring flow, and physical stick payments.</p>
      </section>
    </main>
  );
}
```

`src/app/globals.css`:

```css
:root {
  color-scheme: light;
  --felt: #0f5d4a;
  --felt-dark: #08392e;
  --ink: #17211f;
  --paper: #f7f1df;
  --line: rgba(23, 33, 31, 0.16);
  --accent: #d94836;
}

* {
  box-sizing: border-box;
}

html,
body {
  min-height: 100%;
  margin: 0;
}

body {
  background: var(--felt-dark);
  color: var(--ink);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

button,
input,
select {
  font: inherit;
}

.app-frame {
  min-height: 100svh;
  display: grid;
  place-items: center;
  padding: 16px;
  background:
    radial-gradient(circle at 50% 35%, rgba(255, 255, 255, 0.08), transparent 28rem),
    var(--felt);
}

.empty-state {
  width: min(100%, 560px);
  color: var(--paper);
  text-align: center;
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 0.78rem;
  letter-spacing: 0;
  text-transform: uppercase;
  opacity: 0.78;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 8vw, 4rem);
  line-height: 1;
  letter-spacing: 0;
}
```

- [ ] **Step 5: Verify scaffold**

Run: `npm run typecheck`

Expected: PASS with no TypeScript errors.

Run: `npm run build`

Expected: PASS and `.next` build output is generated.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts vitest.config.ts src/app
git commit -m "Scaffold Next app foundation"
```

---

### Task 2: Domain Types, Rules Preset, Winds, And Wall Break

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/mahjongSoulRules.ts`
- Create: `src/domain/winds.ts`
- Create: `src/domain/wallBreak.ts`
- Create: `src/domain/wallBreak.test.ts`
- Create: `src/domain/winds.test.ts`

- [ ] **Step 1: Write failing tests for winds and wall break**

`src/domain/winds.test.ts`:

```ts
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
```

`src/domain/wallBreak.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { calculateWallBreak } from "./wallBreak";

describe("calculateWallBreak", () => {
  it("counts the wall owner from the dealer using the dice sum", () => {
    expect(calculateWallBreak({ dealerIndex: 0, die1: 1, die2: 1 })).toMatchObject({
      diceTotal: 2,
      wallOwnerIndex: 1,
      breakAfterStacksFromRight: 2
    });
    expect(calculateWallBreak({ dealerIndex: 0, die1: 3, die2: 3 })).toMatchObject({
      diceTotal: 6,
      wallOwnerIndex: 1,
      breakAfterStacksFromRight: 6
    });
    expect(calculateWallBreak({ dealerIndex: 2, die1: 5, die2: 6 })).toMatchObject({
      diceTotal: 11,
      wallOwnerIndex: 0,
      breakAfterStacksFromRight: 11
    });
  });

  it("returns a readable count path and instruction", () => {
    const result = calculateWallBreak({ dealerIndex: 0, die1: 2, die2: 4 });
    expect(result.countPath).toEqual([0, 1, 2, 3, 0, 1]);
    expect(result.instruction).toBe("Break South's wall after 6 stacks from the right.");
  });

  it("rejects non-physical dice", () => {
    expect(() => calculateWallBreak({ dealerIndex: 0, die1: 0, die2: 4 })).toThrow("Dice must be between 1 and 6.");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/domain/winds.test.ts src/domain/wallBreak.test.ts`

Expected: FAIL because the domain modules do not exist yet.

- [ ] **Step 3: Implement shared domain types**

`src/domain/types.ts`:

```ts
export type PlayerId = string;
export type SeatWind = "east" | "south" | "west" | "north";
export type RoundWind = "east" | "south" | "west";
export type GameLength = "east" | "south";
export type WinType = "ron" | "tsumo";
export type TileSuit = "man" | "pin" | "sou" | "honor";
export type AbortiveDrawType = "kyuushu-kyuuhai" | "suufuu-renda" | "suukaikan" | "suucha-riichi";

export interface Player {
  id: PlayerId;
  name: string;
  score: number;
  initialSeat: SeatWind;
  seatWind: SeatWind;
  isDealer: boolean;
  riichi: boolean;
}

export interface DiceRoll {
  die1: number;
  die2: number;
  diceTotal: number;
  wallOwnerIndex: number;
  breakAfterStacksFromRight: number;
  countPath: number[];
  instruction: string;
}

export interface GameState {
  id: string;
  gameLength: GameLength;
  players: Player[];
  dealerIndex: number;
  roundWind: RoundWind;
  handNumber: number;
  honba: number;
  riichiSticks: number;
  currentDice?: DiceRoll;
  history: HandEvent[];
  undoStack: GameStateSnapshot[];
  ended: boolean;
}

export type GameStateSnapshot = Omit<GameState, "undoStack">;

export type HandEvent =
  | { type: "dice"; dice: DiceRoll }
  | { type: "riichi"; playerId: PlayerId }
  | { type: "exhaustive-draw"; tenpaiPlayerIds: PlayerId[] }
  | { type: "abortive-draw"; drawType: AbortiveDrawType }
  | { type: "win"; entries: WinEntry[] };

export interface Tile {
  suit: TileSuit;
  value: number;
  red?: boolean;
}

export interface Meld {
  type: "chi" | "pon" | "open-kan" | "closed-kan" | "added-kan";
  tiles: Tile[];
}

export interface WinEntry {
  winnerId: PlayerId;
  winType: WinType;
  discarderId?: PlayerId;
  winningTile: Tile;
  concealedTiles: Tile[];
  melds: Meld[];
  doraIndicators: Tile[];
  uraDoraIndicators: Tile[];
  conditions: WinCondition[];
}

export type WinCondition =
  | "riichi"
  | "double-riichi"
  | "ippatsu"
  | "haitei"
  | "houtei"
  | "rinshan"
  | "chankan"
  | "tenhou"
  | "chiihou"
  | "nagashi-mangan";
```

- [ ] **Step 4: Implement rules preset and helpers**

`src/domain/mahjongSoulRules.ts`:

```ts
export const MAHJONG_SOUL_RANKED_4P = {
  id: "mahjong-soul-ranked-4p",
  startingPoints: 25000,
  targetPoints: 30000,
  returnPoints: 25000,
  uma: [15, 5, -5, -15],
  redFives: true,
  openTanyao: true,
  atozuke: true,
  kuikae: false,
  localYaku: false,
  kiriageMangan: false,
  kazoeYakuman: true,
  doubleRon: true,
  tripleRon: true,
  tripleRonAbortiveDraw: false,
  tobiAtNegative: true,
  tobiAtZero: false,
  riichiMinimumScore: 1000
} as const;
```

`src/domain/winds.ts`:

```ts
import type { SeatWind } from "./types";

const WIND_ORDER: SeatWind[] = ["east", "south", "west", "north"];

export function nextSeatIndex(index: number): number {
  return (index + 1) % 4;
}

export function getSeatWind(playerIndex: number, dealerIndex: number): SeatWind {
  const relativeIndex = (playerIndex - dealerIndex + 4) % 4;
  return WIND_ORDER[relativeIndex];
}

export function rotateDealerAfterHand(dealerIndex: number, dealerContinues: boolean): number {
  return dealerContinues ? dealerIndex : nextSeatIndex(dealerIndex);
}

export function seatWindLabel(wind: SeatWind): string {
  return wind[0].toUpperCase() + wind.slice(1);
}
```

`src/domain/wallBreak.ts`:

```ts
import type { DiceRoll } from "./types";
import { nextSeatIndex, seatWindLabel } from "./winds";

interface WallBreakInput {
  dealerIndex: number;
  die1: number;
  die2: number;
}

export function calculateWallBreak(input: WallBreakInput): DiceRoll {
  if (!isDie(input.die1) || !isDie(input.die2)) {
    throw new Error("Dice must be between 1 and 6.");
  }

  const diceTotal = input.die1 + input.die2;
  const countPath = buildCountPath(input.dealerIndex, diceTotal);
  const wallOwnerIndex = countPath[countPath.length - 1];
  const wallWind = seatWindLabel(["east", "south", "west", "north"][(wallOwnerIndex - input.dealerIndex + 4) % 4]);

  return {
    die1: input.die1,
    die2: input.die2,
    diceTotal,
    wallOwnerIndex,
    breakAfterStacksFromRight: diceTotal,
    countPath,
    instruction: `Break ${wallWind}'s wall after ${diceTotal} stacks from the right.`
  };
}

function isDie(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 6;
}

function buildCountPath(startIndex: number, count: number): number[] {
  const path = [startIndex];
  while (path.length < count) {
    path.push(nextSeatIndex(path[path.length - 1]));
  }
  return path;
}
```

- [ ] **Step 5: Run tests**

Run: `npm test -- src/domain/winds.test.ts src/domain/wallBreak.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain package.json package-lock.json tsconfig.json vitest.config.ts
git commit -m "Add table wind and wall break domain logic"
```

---

### Task 3: Stick Inventory And Payment Transfer Math

**Files:**
- Create: `src/domain/sticks.ts`
- Create: `src/domain/sticks.test.ts`
- Create: `src/domain/payments.ts`
- Create: `src/domain/payments.test.ts`

- [ ] **Step 1: Write failing stick tests**

`src/domain/sticks.test.ts`:

```ts
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
```

`src/domain/payments.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { applyHonba, exhaustiveDrawDeltas, ronDeltas, tsumoDeltas } from "./payments";

describe("payments", () => {
  it("applies ron deltas from one discarder to one winner", () => {
    expect(ronDeltas({ winnerIndex: 1, discarderIndex: 3, basePayment: 8000, honba: 0, riichiSticks: 1 })).toEqual([
      { playerIndex: 1, delta: 9000 },
      { playerIndex: 3, delta: -9000 }
    ]);
  });

  it("adds 300 per honba to ron payment", () => {
    expect(applyHonba(8000, "ron", 2)).toBe(8600);
  });

  it("adds 100 per honba to each tsumo payer", () => {
    expect(applyHonba(2000, "tsumo", 3)).toBe(2300);
  });

  it("creates non-dealer tsumo deltas", () => {
    expect(tsumoDeltas({ winnerIndex: 2, dealerIndex: 0, dealerPays: 4000, childPays: 2000, honba: 1, riichiSticks: 0 })).toEqual([
      { playerIndex: 0, delta: -4100 },
      { playerIndex: 1, delta: -2100 },
      { playerIndex: 2, delta: 8300 },
      { playerIndex: 3, delta: -2100 }
    ]);
  });

  it("applies exhaustive draw tenpai/noten payments", () => {
    expect(exhaustiveDrawDeltas([0], 4)).toEqual([
      { playerIndex: 0, delta: 3000 },
      { playerIndex: 1, delta: -1000 },
      { playerIndex: 2, delta: -1000 },
      { playerIndex: 3, delta: -1000 }
    ]);
    expect(exhaustiveDrawDeltas([0, 1, 2], 4)).toEqual([
      { playerIndex: 0, delta: 1000 },
      { playerIndex: 1, delta: 1000 },
      { playerIndex: 2, delta: 1000 },
      { playerIndex: 3, delta: -3000 }
    ]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/domain/sticks.test.ts src/domain/payments.test.ts`

Expected: FAIL because modules do not exist.

- [ ] **Step 3: Implement sticks**

`src/domain/sticks.ts`:

```ts
export interface StickInventory {
  tenThousand: number;
  fiveThousand: number;
  thousand: number;
  hundred: number;
}

export interface StickTransferDescription {
  amount: number;
  give: StickInventory;
  change: StickInventory;
  text: string;
}

export function createStickInventory(score: number): StickInventory {
  if (!Number.isInteger(score) || score < 0 || score % 100 !== 0) {
    throw new Error("Score must be a non-negative multiple of 100.");
  }

  let remaining = score;
  const tenThousand = Math.floor(remaining / 10000);
  remaining -= tenThousand * 10000;
  const fiveThousand = Math.floor(remaining / 5000);
  remaining -= fiveThousand * 5000;
  const thousand = Math.floor(remaining / 1000);
  remaining -= thousand * 1000;
  const hundred = Math.floor(remaining / 100);

  return { tenThousand, fiveThousand, thousand, hundred };
}

export function describeTransferSticks(amount: number): StickTransferDescription {
  const give = createStickInventory(amount);
  const change = createStickInventory(0);
  return {
    amount,
    give,
    change,
    text: `Give ${formatInventory(give)}.`
  };
}

function formatInventory(inventory: StickInventory): string {
  const parts = [
    [inventory.tenThousand, "10000"],
    [inventory.fiveThousand, "5000"],
    [inventory.thousand, "1000"],
    [inventory.hundred, "100"]
  ]
    .filter(([count]) => Number(count) > 0)
    .map(([count, label]) => `${count} x ${label}`);

  return parts.length === 0 ? "no sticks" : parts.join(" and ");
}
```

- [ ] **Step 4: Implement payment helpers**

`src/domain/payments.ts`:

```ts
export interface ScoreDelta {
  playerIndex: number;
  delta: number;
}

export function applyHonba(payment: number, type: "ron" | "tsumo", honba: number): number {
  return payment + honba * (type === "ron" ? 300 : 100);
}

export function ronDeltas(input: {
  winnerIndex: number;
  discarderIndex: number;
  basePayment: number;
  honba: number;
  riichiSticks: number;
}): ScoreDelta[] {
  const amount = applyHonba(input.basePayment, "ron", input.honba) + input.riichiSticks * 1000;
  return [
    { playerIndex: input.winnerIndex, delta: amount },
    { playerIndex: input.discarderIndex, delta: -amount }
  ];
}

export function tsumoDeltas(input: {
  winnerIndex: number;
  dealerIndex: number;
  dealerPays: number;
  childPays: number;
  honba: number;
  riichiSticks: number;
}): ScoreDelta[] {
  const deltas: ScoreDelta[] = [];
  let winnerDelta = input.riichiSticks * 1000;

  for (let playerIndex = 0; playerIndex < 4; playerIndex += 1) {
    if (playerIndex === input.winnerIndex) continue;
    const base = playerIndex === input.dealerIndex ? input.dealerPays : input.childPays;
    const amount = applyHonba(base, "tsumo", input.honba);
    deltas.push({ playerIndex, delta: -amount });
    winnerDelta += amount;
  }

  deltas.push({ playerIndex: input.winnerIndex, delta: winnerDelta });
  return deltas.sort((a, b) => a.playerIndex - b.playerIndex);
}

export function exhaustiveDrawDeltas(tenpaiPlayerIndexes: number[], playerCount: number): ScoreDelta[] {
  if (tenpaiPlayerIndexes.length === 0 || tenpaiPlayerIndexes.length === playerCount) {
    return Array.from({ length: playerCount }, (_, playerIndex) => ({ playerIndex, delta: 0 }));
  }

  const tenpai = new Set(tenpaiPlayerIndexes);
  const notenCount = playerCount - tenpai.size;
  const tenpaiGain = 3000 / tenpai.size;
  const notenLoss = 3000 / notenCount;

  return Array.from({ length: playerCount }, (_, playerIndex) => ({
    playerIndex,
    delta: tenpai.has(playerIndex) ? tenpaiGain : -notenLoss
  }));
}
```

- [ ] **Step 5: Run tests**

Run: `npm test -- src/domain/sticks.test.ts src/domain/payments.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/sticks.ts src/domain/sticks.test.ts src/domain/payments.ts src/domain/payments.test.ts
git commit -m "Add point stick and payment math"
```

---

### Task 4: Game State Creation And Table Progression

**Files:**
- Create: `src/domain/gameState.ts`
- Create: `src/domain/gameState.test.ts`
- Create: `src/test/fixtures.ts`

- [ ] **Step 1: Write failing tests**

`src/domain/gameState.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { applyAbortiveDraw, applyDiceRoll, applyExhaustiveDraw, createNewGame, declareRiichi } from "./gameState";

describe("gameState", () => {
  it("creates a Mahjong Soul East game with winds and dealer marker", () => {
    const game = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });
    expect(game.roundWind).toBe("east");
    expect(game.handNumber).toBe(1);
    expect(game.players.map((player) => player.seatWind)).toEqual(["east", "south", "west", "north"]);
    expect(game.players[0].isDealer).toBe(true);
    expect(game.players.every((player) => player.score === 25000)).toBe(true);
  });

  it("records dice roll without changing scores", () => {
    const game = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });
    const next = applyDiceRoll(game, { die1: 2, die2: 4 });
    expect(next.currentDice?.diceTotal).toBe(6);
    expect(next.history.at(-1)?.type).toBe("dice");
  });

  it("prevents riichi below 1000 and otherwise deposits a stick", () => {
    const game = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });
    const afterRiichi = declareRiichi(game, game.players[1].id);
    expect(afterRiichi.players[1].score).toBe(24000);
    expect(afterRiichi.players[1].riichi).toBe(true);
    expect(afterRiichi.riichiSticks).toBe(1);
  });

  it("rotates dealer after non-tenpai dealer exhaustive draw", () => {
    const game = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });
    const next = applyExhaustiveDraw(game, [game.players[1].id]);
    expect(next.dealerIndex).toBe(1);
    expect(next.players[1].seatWind).toBe("east");
    expect(next.honba).toBe(1);
  });

  it("keeps dealer on abortive draw", () => {
    const game = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });
    const next = applyAbortiveDraw(game, "suufuu-renda");
    expect(next.dealerIndex).toBe(0);
    expect(next.honba).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/domain/gameState.test.ts`

Expected: FAIL because `gameState.ts` does not exist.

- [ ] **Step 3: Implement fixtures**

`src/test/fixtures.ts`:

```ts
import { createNewGame } from "@/domain/gameState";

export function createStartedEastGame() {
  return createNewGame({ gameLength: "east", playerNames: ["East", "South", "West", "North"] });
}
```

- [ ] **Step 4: Implement game state**

`src/domain/gameState.ts`:

```ts
import { MAHJONG_SOUL_RANKED_4P } from "./mahjongSoulRules";
import { calculateWallBreak } from "./wallBreak";
import { getSeatWind, rotateDealerAfterHand } from "./winds";
import { exhaustiveDrawDeltas } from "./payments";
import type { AbortiveDrawType, GameLength, GameState, GameStateSnapshot, Player } from "./types";

interface NewGameInput {
  gameLength: GameLength;
  playerNames: string[];
}

export function createNewGame(input: NewGameInput): GameState {
  if (input.playerNames.length !== 4) {
    throw new Error("A four-player game requires exactly four player names.");
  }

  const dealerIndex = 0;
  return refreshSeats({
    id: crypto.randomUUID(),
    gameLength: input.gameLength,
    players: input.playerNames.map<Player>((name, index) => ({
      id: crypto.randomUUID(),
      name,
      score: MAHJONG_SOUL_RANKED_4P.startingPoints,
      initialSeat: getSeatWind(index, dealerIndex),
      seatWind: getSeatWind(index, dealerIndex),
      isDealer: index === dealerIndex,
      riichi: false
    })),
    dealerIndex,
    roundWind: "east",
    handNumber: 1,
    honba: 0,
    riichiSticks: 0,
    history: [],
    undoStack: [],
    ended: false
  });
}

export function applyDiceRoll(game: GameState, dice: { die1: number; die2: number }): GameState {
  const currentDice = calculateWallBreak({ dealerIndex: game.dealerIndex, die1: dice.die1, die2: dice.die2 });
  return withSnapshot({
    ...game,
    currentDice,
    history: [...game.history, { type: "dice", dice: currentDice }]
  });
}

export function declareRiichi(game: GameState, playerId: string): GameState {
  const player = game.players.find((candidate) => candidate.id === playerId);
  if (!player) throw new Error("Player not found.");
  if (player.score < MAHJONG_SOUL_RANKED_4P.riichiMinimumScore) {
    throw new Error("A player under 1000 points cannot declare riichi.");
  }

  return withSnapshot({
    ...game,
    riichiSticks: game.riichiSticks + 1,
    players: game.players.map((candidate) =>
      candidate.id === playerId ? { ...candidate, score: candidate.score - 1000, riichi: true } : candidate
    ),
    history: [...game.history, { type: "riichi", playerId }]
  });
}

export function applyExhaustiveDraw(game: GameState, tenpaiPlayerIds: string[]): GameState {
  const tenpaiIndexes = tenpaiPlayerIds.map((id) => game.players.findIndex((player) => player.id === id));
  const deltas = exhaustiveDrawDeltas(tenpaiIndexes, game.players.length);
  const dealerContinues = tenpaiIndexes.includes(game.dealerIndex);
  const dealerIndex = rotateDealerAfterHand(game.dealerIndex, dealerContinues);

  return withSnapshot(
    refreshSeats({
      ...game,
      dealerIndex,
      honba: game.honba + 1,
      players: applyDeltas(game.players, deltas),
      currentDice: undefined,
      history: [...game.history, { type: "exhaustive-draw", tenpaiPlayerIds }]
    })
  );
}

export function applyAbortiveDraw(game: GameState, drawType: AbortiveDrawType): GameState {
  return withSnapshot({
    ...game,
    honba: game.honba + 1,
    currentDice: undefined,
    history: [...game.history, { type: "abortive-draw", drawType }]
  });
}

function applyDeltas(players: Player[], deltas: { playerIndex: number; delta: number }[]): Player[] {
  return players.map((player, index) => {
    const delta = deltas.find((candidate) => candidate.playerIndex === index)?.delta ?? 0;
    return { ...player, score: player.score + delta };
  });
}

function refreshSeats(game: GameState): GameState {
  return {
    ...game,
    players: game.players.map((player, index) => ({
      ...player,
      seatWind: getSeatWind(index, game.dealerIndex),
      isDealer: index === game.dealerIndex
    }))
  };
}

function withSnapshot(game: GameState): GameState {
  const snapshot: GameStateSnapshot = {
    id: game.id,
    gameLength: game.gameLength,
    players: game.players,
    dealerIndex: game.dealerIndex,
    roundWind: game.roundWind,
    handNumber: game.handNumber,
    honba: game.honba,
    riichiSticks: game.riichiSticks,
    currentDice: game.currentDice,
    history: game.history,
    ended: game.ended
  };
  return { ...game, undoStack: [...game.undoStack, snapshot] };
}
```

- [ ] **Step 5: Run tests**

Run: `npm test -- src/domain/gameState.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/gameState.ts src/domain/gameState.test.ts src/test/fixtures.ts
git commit -m "Add Mahjong Soul table state progression"
```

---

### Task 5: Scoring Adapter Boundary

**Files:**
- Create: `src/domain/scoring.ts`
- Create: `src/domain/scoring.test.ts`

- [ ] **Step 1: Write scoring boundary tests**

`src/domain/scoring.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { scoreManualLimitHand, validateWinEntry } from "./scoring";
import type { WinEntry } from "./types";

const baseWinEntry: WinEntry = {
  winnerId: "p1",
  winType: "ron",
  discarderId: "p2",
  winningTile: { suit: "man", value: 3 },
  concealedTiles: [
    { suit: "man", value: 2 },
    { suit: "man", value: 3 },
    { suit: "man", value: 4 },
    { suit: "pin", value: 2 },
    { suit: "pin", value: 3 },
    { suit: "pin", value: 4 },
    { suit: "sou", value: 2 },
    { suit: "sou", value: 3 },
    { suit: "sou", value: 4 },
    { suit: "man", value: 6 },
    { suit: "man", value: 7 },
    { suit: "man", value: 8 },
    { suit: "honor", value: 1 }
  ],
  melds: [],
  doraIndicators: [],
  uraDoraIndicators: [],
  conditions: ["riichi"]
};

describe("scoring adapter", () => {
  it("accepts a 14-tile closed hand with a winning tile", () => {
    expect(validateWinEntry(baseWinEntry)).toEqual([]);
  });

  it("rejects tile counts above four", () => {
    const invalid = {
      ...baseWinEntry,
      concealedTiles: Array.from({ length: 13 }, () => ({ suit: "man" as const, value: 1 }))
    };
    expect(validateWinEntry(invalid)).toContain("A physical tile cannot appear more than four times.");
  });

  it("returns deterministic manual limit score objects for special flows", () => {
    expect(scoreManualLimitHand({ label: "mangan", dealer: false, winType: "ron" })).toMatchObject({
      han: 5,
      fu: 0,
      limit: "mangan",
      ronPayment: 8000
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/domain/scoring.test.ts`

Expected: FAIL because the scoring module does not exist.

- [ ] **Step 3: Implement scoring boundary**

`src/domain/scoring.ts`:

```ts
import type { Tile, WinEntry, WinType } from "./types";

export interface ScoreBreakdown {
  yaku: string[];
  han: number;
  fu: number;
  limit?: "mangan" | "haneman" | "baiman" | "sanbaiman" | "yakuman" | "double-yakuman" | "triple-yakuman";
  ronPayment?: number;
  dealerTsumoPayment?: number;
  childTsumoPayment?: number;
}

export function validateWinEntry(entry: WinEntry): string[] {
  const errors: string[] = [];
  const tiles = [...entry.concealedTiles, entry.winningTile, ...entry.melds.flatMap((meld) => meld.tiles)];

  if (entry.winType === "ron" && !entry.discarderId) {
    errors.push("Ron requires a discarder.");
  }

  if (tiles.length !== 14) {
    errors.push("A complete winning hand must contain 14 tiles including the winning tile.");
  }

  const tileCounts = new Map<string, number>();
  for (const tile of tiles) {
    const key = tileKey(tile);
    tileCounts.set(key, (tileCounts.get(key) ?? 0) + 1);
  }

  if ([...tileCounts.values()].some((count) => count > 4)) {
    errors.push("A physical tile cannot appear more than four times.");
  }

  return errors;
}

export function scoreManualLimitHand(input: {
  label: NonNullable<ScoreBreakdown["limit"]>;
  dealer: boolean;
  winType: WinType;
}): ScoreBreakdown {
  if (input.label !== "mangan") {
    throw new Error("Only mangan manual fallback is implemented in the MVP boundary.");
  }

  return input.winType === "ron"
    ? { yaku: ["Manual mangan"], han: 5, fu: 0, limit: "mangan", ronPayment: input.dealer ? 12000 : 8000 }
    : {
        yaku: ["Manual mangan"],
        han: 5,
        fu: 0,
        limit: "mangan",
        dealerTsumoPayment: input.dealer ? 4000 : 4000,
        childTsumoPayment: input.dealer ? 4000 : 2000
      };
}

export async function scoreWinEntry(entry: WinEntry): Promise<ScoreBreakdown> {
  const errors = validateWinEntry(entry);
  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }

  return {
    yaku: entry.conditions.includes("riichi") ? ["Riichi"] : [],
    han: entry.conditions.includes("riichi") ? 1 : 0,
    fu: 30,
    ronPayment: 1000,
    dealerTsumoPayment: 500,
    childTsumoPayment: 300
  };
}

function tileKey(tile: Tile): string {
  return `${tile.suit}-${tile.value}`;
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- src/domain/scoring.test.ts`

Expected: PASS.

- [ ] **Step 5: Record scoring adapter limitation in code**

Add this comment above `scoreWinEntry`:

```ts
// The MVP boundary validates inputs now; full yaku/fu scoring is wired in Task 11.
```

- [ ] **Step 6: Commit**

```bash
git add src/domain/scoring.ts src/domain/scoring.test.ts
git commit -m "Define scoring adapter boundary"
```

---

### Task 6: Local Storage And Undo Snapshots

**Files:**
- Create: `src/storage/gameStorage.ts`
- Create: `src/storage/gameStorage.test.ts`

- [ ] **Step 1: Write storage tests**

`src/storage/gameStorage.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createNewGame } from "@/domain/gameState";
import { clearSavedGame, loadSavedGame, saveGame } from "./gameStorage";

describe("gameStorage", () => {
  beforeEach(async () => {
    await clearSavedGame();
  });

  it("saves and loads the active game", async () => {
    const game = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });
    await saveGame(game);
    await expect(loadSavedGame()).resolves.toMatchObject({ id: game.id, gameLength: "east" });
  });

  it("returns null when no game is saved", async () => {
    await expect(loadSavedGame()).resolves.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- src/storage/gameStorage.test.ts`

Expected: FAIL because storage module does not exist.

- [ ] **Step 3: Implement storage**

`src/storage/gameStorage.ts`:

```ts
import { openDB } from "idb";
import type { GameState } from "@/domain/types";

const DB_NAME = "mahjong-sticks-calculator";
const DB_VERSION = 1;
const STORE_NAME = "games";
const ACTIVE_GAME_KEY = "active";

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    }
  });
}

export async function saveGame(game: GameState): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAME, game, ACTIVE_GAME_KEY);
}

export async function loadSavedGame(): Promise<GameState | null> {
  const db = await getDb();
  return (await db.get(STORE_NAME, ACTIVE_GAME_KEY)) ?? null;
}

export async function clearSavedGame(): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, ACTIVE_GAME_KEY);
}
```

- [ ] **Step 4: Run storage tests**

Run: `npm test -- src/storage/gameStorage.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/storage/gameStorage.ts src/storage/gameStorage.test.ts
git commit -m "Add local game persistence"
```

---

### Task 7: Table UI And New Game Flow

**Files:**
- Create: `src/components/AppShell.tsx`
- Create: `src/components/NewGamePanel.tsx`
- Create: `src/components/TableView.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`
- Create: `src/components/TableView.test.tsx`

- [ ] **Step 1: Write table component test**

`src/components/TableView.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createNewGame } from "@/domain/gameState";
import { TableView } from "./TableView";

describe("TableView", () => {
  it("shows each player score, wind, and dealer marker", () => {
    const game = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });
    render(<TableView game={game} onRollDice={() => undefined} onWin={() => undefined} onDraw={() => undefined} onAbortiveDraw={() => undefined} onRiichi={() => undefined} />);

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("East")).toBeInTheDocument();
    expect(screen.getByText("Dealer")).toBeInTheDocument();
    expect(screen.getByText("25000")).toBeInTheDocument();
    expect(screen.getByText("East 1")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- src/components/TableView.test.tsx`

Expected: FAIL because components do not exist.

- [ ] **Step 3: Implement components**

`src/components/NewGamePanel.tsx`:

```tsx
"use client";

import type { GameLength } from "@/domain/types";

interface NewGamePanelProps {
  onCreateGame: (input: { gameLength: GameLength; playerNames: string[] }) => void;
}

export function NewGamePanel({ onCreateGame }: NewGamePanelProps) {
  return (
    <section className="new-game">
      <p className="eyebrow">Mahjong Soul Ranked 4P</p>
      <h1>Mahjong Sticks Calculator</h1>
      <button onClick={() => onCreateGame({ gameLength: "east", playerNames: ["East", "South", "West", "North"] })}>
        Start East Game
      </button>
      <button onClick={() => onCreateGame({ gameLength: "south", playerNames: ["East", "South", "West", "North"] })}>
        Start South Game
      </button>
    </section>
  );
}
```

`src/components/TableView.tsx`:

```tsx
"use client";

import type { GameState } from "@/domain/types";
import { seatWindLabel } from "@/domain/winds";

interface TableViewProps {
  game: GameState;
  onRollDice: () => void;
  onWin: () => void;
  onDraw: () => void;
  onAbortiveDraw: () => void;
  onRiichi: (playerId: string) => void;
}

export function TableView(props: TableViewProps) {
  const { game } = props;
  return (
    <section className="table-view" aria-label="Mahjong table">
      <div className="table-center">
        <p className="eyebrow">{game.gameLength === "east" ? "East game" : "South game"}</p>
        <h1>{seatWindLabel(game.roundWind)} {game.handNumber}</h1>
        <div className="table-meta">
          <span>{game.honba} honba</span>
          <span>{game.riichiSticks} riichi sticks</span>
        </div>
        {game.currentDice ? <p className="dice-instruction">{game.currentDice.instruction}</p> : null}
        <div className="action-row">
          <button onClick={props.onRollDice}>Roll dice</button>
          <button onClick={props.onWin}>Win</button>
          <button onClick={props.onDraw}>Draw</button>
          <button onClick={props.onAbortiveDraw}>Abortive draw</button>
        </div>
      </div>

      <div className="players-grid">
        {game.players.map((player) => (
          <article className={`player-seat player-seat-${player.seatWind}`} key={player.id}>
            <div>
              <h2>{player.name}</h2>
              <p>{seatWindLabel(player.seatWind)}</p>
            </div>
            <strong>{player.score}</strong>
            {player.isDealer ? <span className="dealer-badge">Dealer</span> : null}
            {player.riichi ? <span className="riichi-badge">Riichi</span> : null}
            <button onClick={() => props.onRiichi(player.id)} disabled={player.riichi}>Riichi</button>
          </article>
        ))}
      </div>
    </section>
  );
}
```

`src/components/AppShell.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { createNewGame, declareRiichi } from "@/domain/gameState";
import type { GameState, GameLength } from "@/domain/types";
import { loadSavedGame, saveGame } from "@/storage/gameStorage";
import { NewGamePanel } from "./NewGamePanel";
import { TableView } from "./TableView";

export function AppShell() {
  const [game, setGame] = useState<GameState | null>(null);

  useEffect(() => {
    void loadSavedGame().then(setGame);
  }, []);

  useEffect(() => {
    if (game) void saveGame(game);
  }, [game]);

  if (!game) {
    return (
      <main className="app-frame">
        <NewGamePanel onCreateGame={(input: { gameLength: GameLength; playerNames: string[] }) => setGame(createNewGame(input))} />
      </main>
    );
  }

  return (
    <main className="app-frame">
      <TableView
        game={game}
        onRollDice={() => undefined}
        onWin={() => undefined}
        onDraw={() => undefined}
        onAbortiveDraw={() => undefined}
        onRiichi={(playerId) => setGame(declareRiichi(game, playerId))}
      />
    </main>
  );
}
```

Modify `src/app/page.tsx`:

```tsx
import { AppShell } from "@/components/AppShell";

export default function HomePage() {
  return <AppShell />;
}
```

- [ ] **Step 4: Add table styling**

Append to `src/app/globals.css`:

```css
.new-game {
  width: min(100%, 520px);
  color: var(--paper);
  display: grid;
  gap: 14px;
}

.new-game button,
.action-row button,
.player-seat button {
  border: 0;
  border-radius: 8px;
  padding: 12px 14px;
  background: var(--paper);
  color: var(--ink);
  font-weight: 700;
}

.table-view {
  width: min(100%, 980px);
  min-height: calc(100svh - 32px);
  position: relative;
  display: grid;
  place-items: center;
  color: var(--paper);
}

.table-center {
  width: min(100%, 440px);
  text-align: center;
  display: grid;
  gap: 12px;
}

.table-meta,
.action-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.players-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.player-seat {
  position: absolute;
  width: min(46vw, 220px);
  min-height: 132px;
  padding: 12px;
  border: 1px solid rgba(247, 241, 223, 0.32);
  border-radius: 8px;
  background: rgba(8, 57, 46, 0.74);
  pointer-events: auto;
}

.player-seat-east {
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
}

.player-seat-south {
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

.player-seat-west {
  top: 0;
  left: 50%;
  transform: translateX(-50%);
}

.player-seat-north {
  left: 0;
  top: 50%;
  transform: translateY(-50%);
}

.player-seat h2,
.player-seat p {
  margin: 0;
}

.dealer-badge,
.riichi-badge {
  display: inline-flex;
  margin-right: 6px;
  margin-top: 8px;
  padding: 4px 7px;
  border-radius: 999px;
  background: var(--accent);
  color: white;
  font-size: 0.78rem;
  font-weight: 800;
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `npm test -- src/components/TableView.test.tsx`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app src/components
git commit -m "Add table UI with winds and dealer marker"
```

---

### Task 8: Dice, Draw, Abortive Draw, And Result Panels

**Files:**
- Create: `src/components/DicePanel.tsx`
- Create: `src/components/HandResultFlow.tsx`
- Create: `src/components/ResultPanel.tsx`
- Create: `src/components/StickIcon.tsx`
- Modify: `src/components/AppShell.tsx`
- Modify: `src/components/TableView.tsx`

- [ ] **Step 1: Write result component test**

`src/components/ResultPanel.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResultPanel } from "./ResultPanel";

describe("ResultPanel", () => {
  it("shows payment instructions and stick inventory", () => {
    render(
      <ResultPanel
        transfers={[{ from: "A", to: "B", amount: 3900 }]}
        inventories={[{ playerName: "B", score: 28900 }]}
        onClose={() => undefined}
      />
    );
    expect(screen.getByText("A pays B")).toBeInTheDocument();
    expect(screen.getByText("3900")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("28900")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- src/components/ResultPanel.test.tsx`

Expected: FAIL because `ResultPanel` does not exist.

- [ ] **Step 3: Implement result components**

`src/components/StickIcon.tsx`:

```tsx
interface StickIconProps {
  value: 100 | 1000 | 5000 | 10000;
  count: number;
}

export function StickIcon({ value, count }: StickIconProps) {
  return (
    <span className={`stick stick-${value}`} aria-label={`${count} sticks worth ${value}`}>
      {count}x {value}
    </span>
  );
}
```

`src/components/ResultPanel.tsx`:

```tsx
"use client";

import { createStickInventory, describeTransferSticks } from "@/domain/sticks";
import { StickIcon } from "./StickIcon";

interface ResultPanelProps {
  transfers: Array<{ from: string; to: string; amount: number }>;
  inventories: Array<{ playerName: string; score: number }>;
  onClose: () => void;
}

export function ResultPanel({ transfers, inventories, onClose }: ResultPanelProps) {
  return (
    <section className="result-panel">
      <h2>Payment now</h2>
      {transfers.map((transfer) => {
        const sticks = describeTransferSticks(transfer.amount);
        return (
          <article key={`${transfer.from}-${transfer.to}-${transfer.amount}`}>
            <h3>{transfer.from} pays {transfer.to}</h3>
            <strong>{transfer.amount}</strong>
            <p>{sticks.text}</p>
          </article>
        );
      })}

      <h2>Stick inventory</h2>
      {inventories.map((inventory) => {
        const sticks = createStickInventory(inventory.score);
        return (
          <article key={inventory.playerName}>
            <h3>{inventory.playerName}</h3>
            <strong>{inventory.score}</strong>
            <div className="stick-row">
              <StickIcon value={10000} count={sticks.tenThousand} />
              <StickIcon value={5000} count={sticks.fiveThousand} />
              <StickIcon value={1000} count={sticks.thousand} />
              <StickIcon value={100} count={sticks.hundred} />
            </div>
          </article>
        );
      })}
      <button onClick={onClose}>Close</button>
    </section>
  );
}
```

- [ ] **Step 4: Implement dice and draw flow shell**

`src/components/DicePanel.tsx`:

```tsx
"use client";

import { useState } from "react";

interface DicePanelProps {
  onApply: (dice: { die1: number; die2: number }) => void;
  onClose: () => void;
}

export function DicePanel({ onApply, onClose }: DicePanelProps) {
  const [die1, setDie1] = useState(1);
  const [die2, setDie2] = useState(1);

  return (
    <section className="modal-surface">
      <h2>Roll dice</h2>
      <label>Die 1 <input type="number" min={1} max={6} value={die1} onChange={(event) => setDie1(Number(event.target.value))} /></label>
      <label>Die 2 <input type="number" min={1} max={6} value={die2} onChange={(event) => setDie2(Number(event.target.value))} /></label>
      <button onClick={() => onApply({ die1, die2 })}>Apply</button>
      <button onClick={onClose}>Cancel</button>
    </section>
  );
}
```

`src/components/HandResultFlow.tsx`:

```tsx
"use client";

import type { GameState } from "@/domain/types";

interface HandResultFlowProps {
  game: GameState;
  mode: "win" | "draw" | "abortive-draw";
  onClose: () => void;
  onApplyExhaustiveDraw: (tenpaiPlayerIds: string[]) => void;
  onApplyAbortiveDraw: (drawType: "kyuushu-kyuuhai" | "suufuu-renda" | "suukaikan" | "suucha-riichi") => void;
}

export function HandResultFlow({ game, mode, onClose, onApplyExhaustiveDraw, onApplyAbortiveDraw }: HandResultFlowProps) {
  if (mode === "draw") {
    return (
      <section className="modal-surface">
        <h2>Exhaustive draw</h2>
        {game.players.map((player) => (
          <button key={player.id} onClick={() => onApplyExhaustiveDraw([player.id])}>{player.name} tenpai only</button>
        ))}
        <button onClick={() => onApplyExhaustiveDraw([])}>Nobody tenpai</button>
        <button onClick={onClose}>Cancel</button>
      </section>
    );
  }

  if (mode === "abortive-draw") {
    return (
      <section className="modal-surface">
        <h2>Abortive draw</h2>
        <button onClick={() => onApplyAbortiveDraw("kyuushu-kyuuhai")}>Kyuushu kyuuhai</button>
        <button onClick={() => onApplyAbortiveDraw("suufuu-renda")}>Suufuu renda</button>
        <button onClick={() => onApplyAbortiveDraw("suukaikan")}>Suukaikan</button>
        <button onClick={() => onApplyAbortiveDraw("suucha-riichi")}>Suucha riichi</button>
        <button onClick={onClose}>Cancel</button>
      </section>
    );
  }

  return (
    <section className="modal-surface">
      <h2>Winning hand</h2>
      <p>The tile editor is added in the next task.</p>
      <button onClick={onClose}>Close</button>
    </section>
  );
}
```

- [ ] **Step 5: Wire flow in `AppShell`**

Modify `src/components/AppShell.tsx` to keep an `activeFlow` state and call `applyDiceRoll`, `applyExhaustiveDraw`, and `applyAbortiveDraw` from `gameState`.

Use this handler block inside `AppShell`:

```tsx
const [activeFlow, setActiveFlow] = useState<null | "dice" | "win" | "draw" | "abortive-draw">(null);

function updateGame(nextGame: GameState) {
  setGame(nextGame);
  setActiveFlow(null);
}
```

Render `DicePanel` and `HandResultFlow` below `TableView` when `activeFlow` is set.

- [ ] **Step 6: Run tests and typecheck**

Run: `npm test -- src/components/ResultPanel.test.tsx`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components src/domain src/app
git commit -m "Add dice and hand result flow shell"
```

---

### Task 9: Tile Editor And Manual Winning Hand Input

**Files:**
- Create: `src/components/TileEditor.tsx`
- Create: `src/components/TileEditor.test.tsx`
- Modify: `src/components/HandResultFlow.tsx`
- Modify: `src/domain/scoring.ts`

- [ ] **Step 1: Write tile editor test**

`src/components/TileEditor.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- src/components/TileEditor.test.tsx`

Expected: FAIL because `TileEditor` does not exist.

- [ ] **Step 3: Implement tile editor**

`src/components/TileEditor.tsx`:

```tsx
"use client";

import type { Tile } from "@/domain/types";

interface TileEditorProps {
  tiles: Tile[];
  onChange: (tiles: Tile[]) => void;
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

export function TileEditor({ tiles, onChange }: TileEditorProps) {
  return (
    <div className="tile-editor">
      <div className="selected-tiles" aria-label="Selected tiles">
        {tiles.map((tile, index) => <span className="tile" key={`${tileLabel(tile)}-${index}`}>{tileLabel(tile)}</span>)}
      </div>
      <div className="tile-keyboard">
        {NUMBER_TILES.map((tile) => (
          <button key={`${tile.suit}-${tile.value}-${tile.red ? "red" : "normal"}`} onClick={() => onChange([...tiles, tile])}>
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
```

- [ ] **Step 4: Wire TileEditor into win shell**

Update `HandResultFlow` win mode with local state:

```tsx
const [concealedTiles, setConcealedTiles] = useState<Tile[]>([]);
const [winningTile, setWinningTile] = useState<Tile | null>(null);
```

Render one `TileEditor` for concealed tiles and a second selection control for the winning tile. Use `validateWinEntry` before enabling the apply button.

- [ ] **Step 5: Run tests and typecheck**

Run: `npm test -- src/components/TileEditor.test.tsx src/domain/scoring.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/TileEditor.tsx src/components/TileEditor.test.tsx src/components/HandResultFlow.tsx src/domain/scoring.ts
git commit -m "Add mobile tile entry for winning hands"
```

---

### Task 10: Camera Capture With Upload Fallback

**Files:**
- Create: `src/camera/useCameraCapture.ts`
- Create: `src/camera/useCameraCapture.test.ts`
- Modify: `src/components/HandResultFlow.tsx`

- [ ] **Step 1: Write camera helper test**

`src/camera/useCameraCapture.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { cameraUnavailableMessage, supportsCameraCapture } from "./useCameraCapture";

describe("camera helpers", () => {
  it("detects missing browser camera support", () => {
    expect(supportsCameraCapture({ mediaDevices: undefined })).toBe(false);
  });

  it("explains secure-context requirement", () => {
    expect(cameraUnavailableMessage(false)).toBe("Camera capture requires HTTPS or localhost. Use photo upload instead.");
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- src/camera/useCameraCapture.test.ts`

Expected: FAIL because camera helper does not exist.

- [ ] **Step 3: Implement camera hook and helpers**

`src/camera/useCameraCapture.ts`:

```ts
"use client";

import { useCallback, useRef, useState } from "react";

export function supportsCameraCapture(navigatorLike: Pick<Navigator, "mediaDevices"> | { mediaDevices?: undefined }): boolean {
  return Boolean(navigatorLike.mediaDevices?.getUserMedia);
}

export function cameraUnavailableMessage(isSecureContext: boolean): string {
  return isSecureContext
    ? "Camera permission was denied or no camera is available. Use photo upload instead."
    : "Camera capture requires HTTPS or localhost. Use photo upload instead.";
}

export function useCameraCapture() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    if (!supportsCameraCapture(navigator)) {
      setError(cameraUnavailableMessage(window.isSecureContext));
      return;
    }

    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      setStream(nextStream);
      if (videoRef.current) videoRef.current.srcObject = nextStream;
    } catch {
      setError(cameraUnavailableMessage(window.isSecureContext));
    }
  }, []);

  const stop = useCallback(() => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
  }, [stream]);

  return { videoRef, stream, error, start, stop };
}
```

- [ ] **Step 4: Wire photo reference in win flow**

In `HandResultFlow`, add a file input:

```tsx
<label>
  Photo reference
  <input type="file" accept="image/*" capture="environment" />
</label>
```

Keep the selected file in component state for display; persist binary storage in a later task only if the photo is needed after reload.

- [ ] **Step 5: Run tests**

Run: `npm test -- src/camera/useCameraCapture.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/camera src/components/HandResultFlow.tsx
git commit -m "Add camera capture fallback helpers"
```

---

### Task 11: Full Scoring Adapter Integration

**Files:**
- Modify: `src/domain/scoring.ts`
- Modify: `src/domain/scoring.test.ts`
- Modify: `src/components/HandResultFlow.tsx`
- Modify: `src/components/ResultPanel.tsx`

- [ ] **Step 1: Add scoring examples as failing tests**

Extend `src/domain/scoring.test.ts` with:

```ts
it("scores manual riichi pinfu ron fixture through the adapter", async () => {
  const result = await scoreWinEntry(baseWinEntry);
  expect(result.yaku).toContain("Riichi");
  expect(result.han).toBeGreaterThanOrEqual(1);
  expect(result.ronPayment).toBeGreaterThan(0);
});

it("requires at least one yaku", async () => {
  await expect(scoreWinEntry({ ...baseWinEntry, conditions: [] })).rejects.toThrow("Winning hand has no yaku.");
});
```

- [ ] **Step 2: Run tests to verify missing-yaku failure**

Run: `npm test -- src/domain/scoring.test.ts`

Expected: FAIL because the current adapter returns a no-yaku result instead of rejecting it.

- [ ] **Step 3: Harden the adapter before replacing internals**

Update `scoreWinEntry`:

```ts
export async function scoreWinEntry(entry: WinEntry): Promise<ScoreBreakdown> {
  const errors = validateWinEntry(entry);
  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }

  const yaku = entry.conditions.includes("riichi") ? ["Riichi"] : [];
  if (yaku.length === 0 && !entry.conditions.includes("nagashi-mangan")) {
    throw new Error("Winning hand has no yaku.");
  }

  return {
    yaku,
    han: yaku.length,
    fu: 30,
    ronPayment: entry.winType === "ron" ? 1000 : undefined,
    dealerTsumoPayment: entry.winType === "tsumo" ? 500 : undefined,
    childTsumoPayment: entry.winType === "tsumo" ? 300 : undefined
  };
}
```

- [ ] **Step 4: Evaluate the installed `riichi` package locally**

Run: `node -e "const riichi = require('riichi'); console.log(Object.keys(riichi));"`

Expected: output lists callable scoring exports. If the package shape cannot score yaku/fu reliably, keep the adapter boundary and implement scoring incrementally with tests before wiring UI claims.

- [ ] **Step 5: Replace adapter internals with library-backed scoring**

Map `Tile` into the library tile notation in `scoring.ts`:

```ts
function toRiichiTile(tile: Tile): string {
  const suffix = tile.suit === "man" ? "m" : tile.suit === "pin" ? "p" : tile.suit === "sou" ? "s" : "z";
  return `${tile.red ? 0 : tile.value}${suffix}`;
}
```

Keep the public `ScoreBreakdown` shape unchanged. All UI code must consume only `ScoreBreakdown`.

- [ ] **Step 6: Run scoring tests**

Run: `npm test -- src/domain/scoring.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/scoring.ts src/domain/scoring.test.ts src/components/HandResultFlow.tsx src/components/ResultPanel.tsx package.json package-lock.json
git commit -m "Wire Riichi scoring adapter"
```

---

### Task 12: Apply Win Events And Multiple Ron Payments

**Files:**
- Modify: `src/domain/gameState.ts`
- Modify: `src/domain/gameState.test.ts`
- Modify: `src/domain/payments.ts`
- Modify: `src/domain/payments.test.ts`
- Modify: `src/components/HandResultFlow.tsx`
- Modify: `src/components/ResultPanel.tsx`

- [ ] **Step 1: Add multiple ron payment tests**

Extend `src/domain/payments.test.ts`:

```ts
import { nearestWinnerForRiichiDeposit } from "./payments";

it("finds nearest winner from discarder turn order", () => {
  expect(nearestWinnerForRiichiDeposit({ discarderIndex: 0, winnerIndexes: [2, 3] })).toBe(2);
  expect(nearestWinnerForRiichiDeposit({ discarderIndex: 2, winnerIndexes: [0, 1] })).toBe(0);
});
```

Extend `src/domain/gameState.test.ts` with a win application case after `applyWin` exists:

```ts
it("clears riichi sticks after a win", async () => {
  const game = createNewGame({ gameLength: "east", playerNames: ["A", "B", "C", "D"] });
  const withRiichi = declareRiichi(game, game.players[1].id);
  const next = applyWin(withRiichi, [{ winnerIndex: 2, payerIndexes: [0], amount: 8000 }]);
  expect(next.riichiSticks).toBe(0);
  expect(next.honba).toBe(0);
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- src/domain/payments.test.ts src/domain/gameState.test.ts`

Expected: FAIL because the new helpers do not exist.

- [ ] **Step 3: Implement nearest winner and win application**

Add to `src/domain/payments.ts`:

```ts
export function nearestWinnerForRiichiDeposit(input: { discarderIndex: number; winnerIndexes: number[] }): number {
  for (let offset = 1; offset <= 3; offset += 1) {
    const candidate = (input.discarderIndex + offset) % 4;
    if (input.winnerIndexes.includes(candidate)) return candidate;
  }
  throw new Error("No winner found for riichi deposit.");
}
```

Add to `src/domain/gameState.ts`:

```ts
export function applyWin(game: GameState, payments: Array<{ winnerIndex: number; payerIndexes: number[]; amount: number }>): GameState {
  const dealerWon = payments.some((payment) => payment.winnerIndex === game.dealerIndex);
  const dealerIndex = rotateDealerAfterHand(game.dealerIndex, dealerWon);
  const players = game.players.map((player, index) => {
    const won = payments.filter((payment) => payment.winnerIndex === index).reduce((sum, payment) => sum + payment.amount, 0);
    const paid = payments.filter((payment) => payment.payerIndexes.includes(index)).reduce((sum, payment) => sum + payment.amount, 0);
    return { ...player, score: player.score + won - paid, riichi: false };
  });

  return withSnapshot(refreshSeats({
    ...game,
    players,
    dealerIndex,
    honba: dealerWon ? game.honba + 1 : 0,
    riichiSticks: 0,
    currentDice: undefined,
    history: [...game.history, { type: "win", entries: [] }]
  }));
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- src/domain/payments.test.ts src/domain/gameState.test.ts`

Expected: PASS.

- [ ] **Step 5: Wire UI result**

In `HandResultFlow`, after scoring a win entry, call an `onApplyWin` callback with computed payment rows. Then show `ResultPanel` before returning to the table.

- [ ] **Step 6: Commit**

```bash
git add src/domain src/components
git commit -m "Apply win events and multiple ron payments"
```

---

### Task 13: Polish, Verification, GitHub Backup, And Vercel Deploy

**Files:**
- Modify: `src/app/globals.css`
- Modify: `README.md`
- Modify: `.gitignore`

- [ ] **Step 1: Create `.gitignore`**

`.gitignore`:

```gitignore
node_modules
.next
out
dist
.env
.env.local
.DS_Store
coverage
.vercel
```

- [ ] **Step 2: Create `README.md`**

`README.md`:

```md
# Mahjong Sticks Calculator

Local-first Riichi Mahjong table tracker for a four-player group using Mahjong Soul Ranked 4P-style rules and real point sticks.

## Scripts

- `npm run dev`
- `npm test`
- `npm run typecheck`
- `npm run build`

## Notes

Camera capture requires HTTPS or localhost. Vercel production deploys provide HTTPS.
```

- [ ] **Step 3: Run full verification**

Run: `npm test`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add README.md .gitignore src/app/globals.css
git commit -m "Polish app for deployment"
```

- [ ] **Step 5: Push to GitHub**

Run: `git push origin main`

Expected: branch `main` updates on `https://github.com/imihnea/mahjong-sticks-calculator`.

If terminal Git authentication is still unavailable, use the GitHub connector to create or update changed files in `imihnea/mahjong-sticks-calculator`, then tell the user that local `git push` still needs `gh auth login` or HTTPS/SSH credentials.

- [ ] **Step 6: Deploy to Vercel**

Run the Vercel deployment connector for the current project.

Expected: Vercel returns a deployment URL. Open the URL and verify the app loads, camera upload fallback is visible in the win flow, and local storage persists after reload.

---

## Self-Review Notes

- Spec coverage: the plan covers local-first app, East/South game creation, Mahjong Soul preset, player winds/dealer display, dice wall break, win/draw/abortive flows, scoring boundary, sticks, persistence, tests, GitHub backup, and Vercel deployment.
- Known implementation risk: full yaku/fu scoring depends on the selected `riichi` package shape. The adapter boundary and tests isolate that risk so the UI never depends directly on package internals.
- GitHub operational note: the local terminal currently cannot push over HTTPS without credentials. The GitHub connector can back up files, but regular `git push` requires `gh auth login` or configured Git HTTPS/SSH credentials.
