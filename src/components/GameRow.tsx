import React from 'react';
import type { ScheduleEntry } from '../types/schedule';
import { formatTime, getGameStatus } from '../utils/scheduleUtils';
import './GameRow.css';

interface GameRowProps {
  game: ScheduleEntry;
  isCurrent: boolean;
  currentGame: ScheduleEntry | null;
}

export const GameRow: React.FC<GameRowProps> = ({ game, isCurrent, currentGame }) => {
  const isSpecialEvent = game.isSpecialEvent;
  const gameStatus = getGameStatus(game, currentGame);
  
  if (isSpecialEvent) {
    return (
      <tr className={`game-row ${isCurrent ? 'current-game' : ''} ${gameStatus === 'past' ? 'past-game' : ''} special-event-row`}>
        <td className="time-cell">{formatTime(game.time)}</td>
        <td colSpan={4} className="special-event-cell">
          {game.eventTitle}
        </td>
      </tr>
    );
  }
  
  return (
    <tr className={`game-row ${isCurrent ? 'current-game' : ''} ${gameStatus === 'past' ? 'past-game' : ''}`}>
      <td className="time-cell">{formatTime(game.time)}</td>
      <td className="team-cell cyan-team">
        {game.cyanTeam}
      </td>
      <td className="vs-cell">vs</td>
      <td className="team-cell magenta-team">
        {game.magentaTeam}
      </td>
      <td className="game-type-cell">{game.gameType}</td>
    </tr>
  );
};
