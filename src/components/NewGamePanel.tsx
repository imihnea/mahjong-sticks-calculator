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
      <div className="action-row">
        <button onClick={() => onCreateGame({ gameLength: "east", playerNames: ["East", "South", "West", "North"] })}>
          Start East Game
        </button>
        <button onClick={() => onCreateGame({ gameLength: "south", playerNames: ["East", "South", "West", "North"] })}>
          Start South Game
        </button>
      </div>
    </section>
  );
}
