"use client";

import { createStickInventory, describeTransferSticks } from "@/domain/sticks";
import type { SeatWind } from "@/domain/types";
import { StickIcon } from "./StickIcon";

interface ResultPanelProps {
  transfers: Array<{ from: string; to: string; amount: number }>;
  inventories: Array<{ playerName: string; score: number; seatWind: SeatWind }>;
  onClose: () => void;
}

export function ResultPanel({ transfers, inventories, onClose }: ResultPanelProps) {
  return (
    <section className="result-panel">
      <h2>Payment now</h2>
      {transfers.length === 0 ? <p>No immediate payments.</p> : null}
      {transfers.map((transfer, index) => (
        <article key={`${transfer.from}-${transfer.to}-${transfer.amount}-${index}`}>
          <h3>
            {transfer.from} pays {transfer.to}
          </h3>
          <StickSet amount={transfer.amount} label={`${transfer.from} pays ${transfer.to} sticks`} />
        </article>
      ))}

      <h2>Payment by player</h2>
      <div className="payment-cross">
        {inventories.map((inventory) => {
          const outgoing = transfers.filter((transfer) => transfer.from === inventory.playerName);
          const incoming = transfers.filter((transfer) => transfer.to === inventory.playerName);
          return (
            <article
              aria-label={`${inventory.playerName} payment summary`}
              className={`payment-seat payment-seat-${inventory.seatWind}`}
              key={`${inventory.playerName}-${inventory.seatWind}`}
            >
              <h3>{inventory.playerName}</h3>
              {outgoing.length === 0 && incoming.length === 0 ? <p>No sticks now.</p> : null}
              {outgoing.map((transfer, index) => (
                <div className="stick-task" key={`give-${transfer.to}-${transfer.amount}-${index}`}>
                  <strong>Give to {transfer.to}</strong>
                  <StickSet amount={transfer.amount} label={`${inventory.playerName} gives sticks to ${transfer.to}`} />
                </div>
              ))}
              {incoming.map((transfer, index) => (
                <div className="stick-task stick-task-receive" key={`receive-${transfer.from}-${transfer.amount}-${index}`}>
                  <strong>Receive from {transfer.from}</strong>
                  <StickSet amount={transfer.amount} label={`${inventory.playerName} receives sticks from ${transfer.from}`} />
                </div>
              ))}
            </article>
          );
        })}
      </div>

      <h2>Stick inventory</h2>
      {inventories.map((inventory) => {
        const sticks = inventory.score >= 0 ? createStickInventory(inventory.score) : null;
        return (
          <article
            aria-label={
              sticks
                ? `${inventory.playerName} stick inventory worth ${inventory.score} points`
                : `${inventory.playerName} stick inventory debt ${Math.abs(inventory.score)} points`
            }
            key={inventory.playerName}
          >
            <h3>{inventory.playerName}</h3>
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

function StickSet({ amount, label }: { amount: number; label: string }) {
  const sticks = describeTransferSticks(amount).give;
  return (
    <div aria-label={label} className="stick-row">
      <StickIcon value={10000} count={sticks.tenThousand} />
      <StickIcon value={5000} count={sticks.fiveThousand} />
      <StickIcon value={1000} count={sticks.thousand} />
      <StickIcon value={100} count={sticks.hundred} />
    </div>
  );
}
