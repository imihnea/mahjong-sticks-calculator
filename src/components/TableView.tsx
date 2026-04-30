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
        <h1>
          {seatWindLabel(game.roundWind)} {game.handNumber}
        </h1>
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
            <button onClick={() => props.onRiichi(player.id)} disabled={player.riichi}>
              Riichi
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
