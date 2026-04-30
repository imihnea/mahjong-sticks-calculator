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
      <label>
        Die 1{" "}
        <input
          type="number"
          min={1}
          max={6}
          value={die1}
          onChange={(event) => setDie1(Number(event.target.value))}
        />
      </label>
      <label>
        Die 2{" "}
        <input
          type="number"
          min={1}
          max={6}
          value={die2}
          onChange={(event) => setDie2(Number(event.target.value))}
        />
      </label>
      <button onClick={() => onApply({ die1, die2 })}>Apply</button>
      <button onClick={onClose}>Cancel</button>
    </section>
  );
}
