"use client";

import type { GameState } from "@/domain/types";
import { seatWindLabel } from "@/domain/winds";

interface TableViewProps {
  game: GameState;
  onRollDice: () => void;
  onWin: () => void;
  onDraw: () => void;
  onAbortiveDraw: () => void;
  onUndo: () => void;
  onNewGame: () => void;
  onRiichi: (playerId: string) => void;
}

export function TableView(props: TableViewProps) {
  const { game } = props;

  return (
    <section className="table-view" aria-label="Mahjong table">
      <div className="table-cross">
        <div className="table-center">
        <p className="eyebrow">{game.gameLength === "east" ? "East game" : "South game"}</p>
        <h1>
          {seatWindLabel(game.roundWind)} {game.handNumber}
        </h1>
        <div className="table-meta">
          <span>{game.honba} honba</span>
          <span>{game.riichiSticks} riichi sticks</span>
          {game.ended ? <span>Game ended</span> : null}
        </div>
        {game.currentDice ? <p className="dice-instruction">{game.currentDice.instruction}</p> : null}
        <div className="action-row">
          <button onClick={props.onRollDice} disabled={game.ended}>Roll dice</button>
          <button onClick={props.onWin} disabled={game.ended}>Win</button>
          <button onClick={props.onDraw} disabled={game.ended}>Draw</button>
          <button onClick={props.onAbortiveDraw} disabled={game.ended}>Abortive draw</button>
          <button onClick={props.onUndo} disabled={game.undoStack.length === 0}>Undo</button>
          <button onClick={props.onNewGame}>New game</button>
        </div>
        </div>
        {game.players.map((player) => (
          <article className={`player-seat player-seat-${player.seatWind}`} aria-label={`${seatWindLabel(player.seatWind)} seat`} key={player.id}>
            <div>
              <h2>{player.name}</h2>
              <p>{seatWindLabel(player.seatWind)}</p>
            </div>
            <strong>{player.score}</strong>
            {player.isDealer ? <span className="dealer-badge">Dealer</span> : null}
            {player.riichi ? <span className="riichi-badge">Riichi</span> : null}
            <button
              aria-label={`Declare riichi for ${player.name}`}
              onClick={() => props.onRiichi(player.id)}
              disabled={game.ended || player.riichi}
            >
              Riichi
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
