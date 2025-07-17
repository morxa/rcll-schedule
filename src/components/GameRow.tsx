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
  
  // Classify game importance based on game type
  const getGameImportanceClass = (gameType: string): string => {
    const lowerGameType = gameType?.toLowerCase() || '';
    
    if (lowerGameType.includes('final')) {
      return 'game-final';
    } else if (lowerGameType.includes('round robin') || lowerGameType.includes('playoffs')) {
      return 'game-round-robin';
    } else if (lowerGameType.includes('challenge track') && !lowerGameType.includes('setup')) {
      return 'game-challenge';
    } else if (lowerGameType.includes('setup')) {
      return 'game-setup';
    } else if (lowerGameType.includes('test game')) {
      return 'game-test';
    }
    return 'game-regular';
  };
  
  const importanceClass = getGameImportanceClass(game.gameType);
  
  if (isSpecialEvent) {
    return (
      <tr className={`game-row ${isCurrent ? 'current-game' : ''} ${gameStatus === 'past' ? 'past-game' : ''} special-event-row ${importanceClass}`}>
        <td className="time-cell">{formatTime(game.time)}</td>
        <td colSpan={4} className="special-event-cell">
          {game.eventTitle}
        </td>
      </tr>
    );
  }
  
  return (
    <tr className={`game-row ${isCurrent ? 'current-game' : ''} ${gameStatus === 'past' ? 'past-game' : ''} ${importanceClass}`}>
      <td className="time-cell">{formatTime(game.time)}</td>
      <td className="team-cell cyan-team">
        {game.cyanTeam}
      </td>
      <td className="vs-cell">
        {gameStatus === 'past' && (game.cyanScore !== undefined || game.magentaScore !== undefined)
          ? (() => {
              // Handle single-team games or games with only one score
              if (game.cyanScore !== undefined && game.magentaScore !== undefined) {
                return `${game.cyanScore} - ${game.magentaScore}`;
              } else if (game.cyanScore !== undefined && !game.magentaTeam) {
                // Only cyan team played
                return `${game.cyanScore}`;
              } else if (game.magentaScore !== undefined && !game.cyanTeam) {
                // Only magenta team played  
                return `${game.magentaScore}`;
              } else if (game.cyanScore !== undefined) {
                // Cyan has score but magenta doesn't
                return `${game.cyanScore} - -`;
              } else if (game.magentaScore !== undefined) {
                // Magenta has score but cyan doesn't
                return `- - ${game.magentaScore}`;
              }
              return 'vs';
            })()
          : 'vs'
        }
      </td>
      <td className="team-cell magenta-team">
        {game.magentaTeam}
      </td>
      <td className="game-type-cell">
        {game.gameType}
        {game.isLivestreamed && (
          <span className="livestream-indicator" title="Live streamed">
            📡
          </span>
        )}
      </td>
    </tr>
  );
};
