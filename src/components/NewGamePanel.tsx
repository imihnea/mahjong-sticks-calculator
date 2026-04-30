"use client";

import { useState } from "react";
import type { GameLength } from "@/domain/types";

interface NewGamePanelProps {
  onCreateGame: (input: { gameLength: GameLength; playerNames: string[] }) => void;
}

const INITIAL_WINDS = ["East", "South", "West", "North"] as const;

export function NewGamePanel({ onCreateGame }: NewGamePanelProps) {
  const [playerNames, setPlayerNames] = useState<string[]>([...INITIAL_WINDS]);

  function startGame(gameLength: GameLength) {
    onCreateGame({
      gameLength,
      playerNames: playerNames.map((name, index) => name.trim() || INITIAL_WINDS[index])
    });
  }

  return (
    <section className="new-game">
      <p className="eyebrow">Mahjong Soul Ranked 4P</p>
      <h1>Mahjong Sticks Calculator</h1>
      <div className="name-grid">
        {INITIAL_WINDS.map((wind, index) => (
          <label key={wind}>
            {wind} player name
            <input
              value={playerNames[index]}
              onChange={(event) => {
                setPlayerNames((current) => current.map((name, candidateIndex) => (candidateIndex === index ? event.target.value : name)));
              }}
            />
          </label>
        ))}
      </div>
      <div className="action-row">
        <button onClick={() => startGame("east")}>Start East Game</button>
        <button onClick={() => startGame("south")}>Start South Game</button>
      </div>
    </section>
  );
}
