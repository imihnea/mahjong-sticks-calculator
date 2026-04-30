"use client";

import { useState } from "react";

interface DicePanelProps {
  onApply: (dice: { die1: number; die2: number }) => void;
  onClose: () => void;
}

export function DicePanel({ onApply, onClose }: DicePanelProps) {
  const [die1, setDie1] = useState("1");
  const [die2, setDie2] = useState("1");
  const parsedDie1 = parseDie(die1);
  const parsedDie2 = parseDie(die2);
  const canApply = parsedDie1 !== null && parsedDie2 !== null;

  return (
    <section className="modal-surface">
      <h2>Roll dice</h2>
      <label>
        Die 1{" "}
        <input
          type="number"
          min={1}
          max={6}
          value={die1}
          onChange={(event) => setDie1(event.target.value)}
        />
      </label>
      <label>
        Die 2{" "}
        <input
          type="number"
          min={1}
          max={6}
          value={die2}
          onChange={(event) => setDie2(event.target.value)}
        />
      </label>
      {!canApply ? <p className="field-error">Dice must be whole numbers from 1 to 6.</p> : null}
      <button
        onClick={() => {
          if (parsedDie1 !== null && parsedDie2 !== null) {
            onApply({ die1: parsedDie1, die2: parsedDie2 });
          }
        }}
        disabled={!canApply}
      >
        Apply
      </button>
      <button onClick={onClose}>Cancel</button>
    </section>
  );
}

function parseDie(value: string): number | null {
  if (!/^[1-6]$/.test(value)) return null;
  return Number(value);
}
