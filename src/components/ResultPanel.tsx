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
      {transfers.length === 0 ? <p>No immediate payments.</p> : null}
      {transfers.map((transfer, index) => {
        const sticks = describeTransferSticks(transfer.amount);
        return (
          <article key={`${transfer.from}-${transfer.to}-${transfer.amount}-${index}`}>
            <h3>
              {transfer.from} pays {transfer.to}
            </h3>
            <strong>{transfer.amount}</strong>
            <p>{sticks.text}</p>
          </article>
        );
      })}

      <h2>Stick inventory</h2>
      {inventories.map((inventory) => {
        const sticks = inventory.score >= 0 ? createStickInventory(inventory.score) : null;
        return (
          <article key={inventory.playerName}>
            <h3>{inventory.playerName}</h3>
            <strong>{inventory.score}</strong>
            {sticks ? (
              <div className="stick-row">
                <StickIcon value={10000} count={sticks.tenThousand} />
                <StickIcon value={5000} count={sticks.fiveThousand} />
                <StickIcon value={1000} count={sticks.thousand} />
                <StickIcon value={100} count={sticks.hundred} />
              </div>
            ) : (
              <p>Debt: {Math.abs(inventory.score)} points</p>
            )}
          </article>
        );
      })}
      <button onClick={onClose}>Close</button>
    </section>
  );
}
